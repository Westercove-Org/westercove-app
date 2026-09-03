import { legalGateHandled, markLegalGateHandled, resetLegalGate } from '../legalGate';

describe('legal launch gate (R-36 session guard)', () => {
  beforeEach(resetLegalGate);

  it('presents once per session: handled after the first mark', () => {
    expect(legalGateHandled()).toBe(false);
    markLegalGateHandled();
    expect(legalGateHandled()).toBe(true);
    // A second mark is idempotent — still handled, still one presentation.
    markLegalGateHandled();
    expect(legalGateHandled()).toBe(true);
  });

  it('reset (on sign-out) re-arms the gate for the next session', () => {
    markLegalGateHandled();
    expect(legalGateHandled()).toBe(true);
    resetLegalGate();
    expect(legalGateHandled()).toBe(false);
  });
});
