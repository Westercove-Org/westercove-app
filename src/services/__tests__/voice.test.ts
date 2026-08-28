import { WebVoiceService, UnavailableVoiceService, createVoiceService } from '@/services/voice';

/** Fake Web Speech API recognizer whose lifecycle the test drives. */
class FakeSpeechRecognition {
  static last: FakeSpeechRecognition | null = null;
  lang = '';
  interimResults = true;
  maxAlternatives = 0;
  continuous = true;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  constructor() {
    FakeSpeechRecognition.last = this;
  }
  start() {
    this.started = true;
  }
  stop() {}
  abort() {}
}

const g = globalThis as unknown as { SpeechRecognition?: unknown };

function result(transcript: string) {
  return { resultIndex: 0, results: { length: 1, 0: { isFinal: true, 0: { transcript } } } };
}

describe('WebVoiceService', () => {
  afterEach(() => {
    delete g.SpeechRecognition;
    FakeSpeechRecognition.last = null;
  });

  it('resolves the final transcript, configured for a single auto-stopping utterance', async () => {
    g.SpeechRecognition = FakeSpeechRecognition;
    const p = new WebVoiceService().capture();
    const rec = FakeSpeechRecognition.last!;
    expect(rec.started).toBe(true);
    expect(rec.continuous).toBe(false);
    expect(rec.interimResults).toBe(false);

    rec.onresult!(result('I keep reaching for the phone'));
    rec.onend!();
    await expect(p).resolves.toBe('I keep reaching for the phone');
  });

  it('rejects with the error code when the mic is denied', async () => {
    g.SpeechRecognition = FakeSpeechRecognition;
    const p = new WebVoiceService().capture();
    FakeSpeechRecognition.last!.onerror!({ error: 'not-allowed' });
    await expect(p).rejects.toThrow('not-allowed');
  });

  it('rejects when nothing was said', async () => {
    g.SpeechRecognition = FakeSpeechRecognition;
    const p = new WebVoiceService().capture();
    FakeSpeechRecognition.last!.onend!();
    await expect(p).rejects.toThrow('no-speech');
  });

  it('isSupported / createVoiceService reflect the platform', () => {
    delete g.SpeechRecognition;
    expect(WebVoiceService.isSupported()).toBe(false);
    expect(createVoiceService()).toBeInstanceOf(UnavailableVoiceService);

    g.SpeechRecognition = FakeSpeechRecognition;
    expect(WebVoiceService.isSupported()).toBe(true);
    expect(createVoiceService()).toBeInstanceOf(WebVoiceService);
  });
});

describe('UnavailableVoiceService', () => {
  it('rejects rather than inserting placeholder text', async () => {
    await expect(new UnavailableVoiceService().capture()).rejects.toThrow('not available');
    expect(new UnavailableVoiceService().isAvailable()).toBe(false);
  });
});
