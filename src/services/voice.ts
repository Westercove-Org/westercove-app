export interface VoiceService {
  /**
   * Capture speech and return the transcript. The audio is never stored or sent
   * anywhere — only the transcript is returned, which the user then edits before
   * submitting. Uses on-device recognition (the browser's Web Speech API on web);
   * rejects when recognition is unavailable or the mic is denied, so the caller
   * can tell the user rather than inserting placeholder text.
   */
  capture(): Promise<string>;
  isAvailable(): boolean;
}

/** Minimal Web Speech API surface we use — the TS DOM lib isn't in scope for
 * react-native-web, so we declare just the members we touch. */
interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  0: SpeechAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechResult };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** The platform's SpeechRecognition constructor, or undefined off web / in a
 * browser without the API. Reads `globalThis` (which is `window` on web). */
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const g = globalThis as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return g.SpeechRecognition ?? g.webkitSpeechRecognition;
}

/**
 * Real on-device speech-to-text on web via the Web Speech API. The browser
 * prompts for microphone permission on the first `start()`. A single utterance
 * is captured (`continuous = false`), so it auto-stops on a pause and resolves
 * with the final transcript. Nothing is uploaded — recognition runs in the
 * browser and only the text string is returned.
 */
export class WebVoiceService implements VoiceService {
  static isSupported(): boolean {
    return getSpeechRecognitionCtor() !== undefined;
  }

  isAvailable(): boolean {
    return WebVoiceService.isSupported();
  }

  capture(): Promise<string> {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return Promise.reject(new Error('Voice input is not supported in this browser.'));

    return new Promise<string>((resolve, reject) => {
      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false; // one utterance; auto-stops on silence

      let final = '';
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
        }
      };
      // `error` is 'not-allowed' (denied), 'no-speech', 'audio-capture', etc.
      rec.onerror = (e) => finish(() => reject(new Error(e.error || 'voice-error')));
      rec.onend = () =>
        finish(() => {
          const text = final.trim();
          if (text) resolve(text);
          else reject(new Error('no-speech'));
        });

      try {
        rec.start();
      } catch (err) {
        finish(() => reject(err instanceof Error ? err : new Error('voice-start-failed')));
      }
    });
  }
}

/**
 * Fallback where on-device STT isn't wired: native (needs a native speech module
 * that isn't installed yet) and web browsers without the Web Speech API. Rejects
 * rather than inserting text, so the mic never lies about listening.
 */
export class UnavailableVoiceService implements VoiceService {
  isAvailable(): boolean {
    return false;
  }
  capture(): Promise<string> {
    return Promise.reject(new Error('Voice input is not available on this device yet.'));
  }
}

/** Pick the real web recognizer when the platform supports it, else the
 * unavailable fallback. */
export function createVoiceService(): VoiceService {
  return WebVoiceService.isSupported() ? new WebVoiceService() : new UnavailableVoiceService();
}

/** Canned transcript — used in tests/demos, never wired in the real app. */
export class MockVoiceService implements VoiceService {
  isAvailable(): boolean {
    return true;
  }

  async capture(): Promise<string> {
    await new Promise((r) => setTimeout(r, 600));
    return 'I keep reaching for the phone to call, and then remembering.';
  }
}
