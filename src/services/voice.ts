export interface VoiceService {
  /**
   * Capture speech and return the final transcript. `onPartial` fires live as
   * words are recognized (interim results), so the UI can stream text while the
   * person is still speaking. The audio is never stored — only the transcript
   * is returned, which the user then edits before submitting.
   */
  capture(onPartial?: (text: string) => void): Promise<string>;
  isAvailable(): boolean;
}

export class MockVoiceService implements VoiceService {
  isAvailable(): boolean {
    return true;
  }

  async capture(onPartial?: (text: string) => void): Promise<string> {
    // Simulate streaming: emit a few interim chunks, then the final transcript.
    const full = 'I keep reaching for the phone to call, and then remembering.';
    const words = full.split(' ');
    for (let i = 1; i < words.length; i += 2) {
      await new Promise((r) => setTimeout(r, 200));
      onPartial?.(words.slice(0, i + 1).join(' '));
    }
    return full;
  }
}

/**
 * On-device speech-to-text via expo-speech-recognition (iOS Speech framework /
 * Android SpeechRecognizer). Streams interim results via `onPartial` as words
 * are recognized, and resolves with the final transcript when recognition ends.
 * Audio is never stored — only the transcript is returned.
 */
export class NativeVoiceService implements VoiceService {
  isAvailable(): boolean {
    return true;
  }

  async capture(onPartial?: (text: string) => void): Promise<string> {
    // Lazy import so the mock/web paths never pull the native module.
    const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');

    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return '';

    return new Promise<string>((resolve) => {
      let transcript = '';
      const subs: { remove: () => void }[] = [];
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        subs.forEach((s) => s.remove());
        resolve(transcript.trim());
      };

      subs.push(
        ExpoSpeechRecognitionModule.addListener('result', (e) => {
          const t = e.results?.[0]?.transcript;
          if (t) {
            transcript = t; // results are cumulative; keep the latest
            onPartial?.(t); // stream interim text to the UI as words arrive
          }
        }),
      );
      subs.push(ExpoSpeechRecognitionModule.addListener('end', finish));
      subs.push(ExpoSpeechRecognitionModule.addListener('error', finish));

      // interimResults streams partial transcripts word-by-word while speaking;
      // non-continuous auto-ends on a pause (there is no separate stop button).
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    });
  }
}
