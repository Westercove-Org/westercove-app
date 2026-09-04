import { TONE_OPTIONS } from '@/features/auth/fourDoorsModel';
import { TONE_LABELS } from '@/services/companionPrompt';

/**
 * The gate offers five tones (fourDoorsModel TONE_OPTIONS, incl. "Direct and
 * tactful", Dr. Carter's fifth). The tone a person picks is stored as its label
 * and looked up in companionPrompt's TONE_MAP; a label with no entry silently
 * reverts the companion to gentle-warm and cannot be reached by the profile's
 * change-anytime control (which cycles TONE_LABELS). This test pins the gate and
 * TONE_MAP together so that drift can never recur.
 */
describe('gate tones ↔ companion TONE_MAP', () => {
  it('every gate tone has a companion instruction (no silent gentle-warm revert)', () => {
    for (const { label } of TONE_OPTIONS) {
      expect(TONE_LABELS).toContain(label);
    }
  });

  it('exposes all five tones, including Direct and tactful', () => {
    expect(TONE_LABELS).toHaveLength(5);
    expect(TONE_LABELS).toContain('Direct and tactful');
    expect(TONE_LABELS).toContain('Spiritual');
  });
});
