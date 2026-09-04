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

  it('shows the first question with no progress/step counter (S1)', async () => {
    const { getByText, queryByText } = await renderWithProviders(<DayZeroGate />);
    expect(getByText('What would you like me to call you?')).toBeTruthy();
    // S1: no progress language anywhere — the "Step X of N" counter is gone.
    expect(queryByText(/Step \d+ of \d+/)).toBeNull();
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
