jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
// The header's decorative image/gradient carry a `placeholder` prop that
// interferes with getByPlaceholderText; stub them out.
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));

import { DayZeroGate, sequence } from '@/features/auth/DayZeroGate';
import { useSessionStore } from '@/features/auth/sessionStore';
import { renderWithProviders } from '@/test-utils';

function seedNeedsGateSession() {
  useSessionStore.setState({
    hydrated: true,
    session: {
      user: { email: 'a@b.com' },
      entryPath: 'consumer_trial',
      entitlement: 'trial_active',
      disclaimerAcked: true,
      gateComplete: false,
      gateAnswers: { mode: 'human', skipped: [] },
    },
  });
}

describe('DayZeroGate', () => {
  beforeEach(seedNeedsGateSession);

  it('shows the first question and a step counter', async () => {
    const { getByText } = await renderWithProviders(<DayZeroGate />);
    expect(getByText('What would you like me to call you?')).toBeTruthy();
    // Denominator is the fixed human-base count (4) and must not jump to 6 when
    // the pet branch is chosen (8130) — the pet species/breed cards are
    // un-numbered continuation steps.
    expect(getByText('Step 1 of 4')).toBeTruthy();
  });

  it('adapts the steps: the pet branch (kind + breed) appears only for a pet', () => {
    expect(sequence('human')).toEqual(['callName', 'lovedOneName', 'relationship', 'tone']);
    expect(sequence('pet')).toEqual([
      'callName',
      'lovedOneName',
      'relationship',
      'species',
      'breed',
      'tone',
    ]);
  });
});
