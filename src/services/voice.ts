export interface VoiceService {
  /**
   * Capture speech and return the transcript. The audio is never stored — only
   * the transcript is returned, which the user then edits before submitting.
   * The real service uses on-device speech recognition (native) or the Web
   * Speech API; this mock returns a canned transcript.
   */
  capture(): Promise<string>;
  isAvailable(): boolean;
}

export class MockVoiceService implements VoiceService {
  isAvailable(): boolean {
    return true;
  }

  async capture(): Promise<string> {
    // Simulate a brief listening period, then return a transcript to edit.
    await new Promise((r) => setTimeout(r, 600));
    return 'I keep reaching for the phone to call, and then remembering.';
  }
}
