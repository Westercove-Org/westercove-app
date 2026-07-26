jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { DayZeroGate } from '@/features/auth/DayZeroGate';
import { sessionStatus, useSessionStore } from '@/features/auth/sessionStore';
import { fireEvent, renderWithProviders } from '@/test-utils';

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

  it('shows the first question and NO progress bar or percentage (firm rule)', async () => {
    const { queryByRole, queryByText, getByText } = await renderWithProviders(
      <DayZeroGate />,
    );
    expect(getByText('What would you like me to call you?')).toBeTruthy();
    expect(queryByRole('progressbar')).toBeNull();
    expect(queryByText(/%/)).toBeNull();
    expect(queryByText(/step \d+ of \d+/i)).toBeNull();
  });

  it('"Save and continue later" completes the gate and makes the session ready', async () => {
    const { getByLabelText } = await renderWithProviders(<DayZeroGate />);
    fireEvent.press(getByLabelText(/save and continue later/i));
    expect(sessionStatus(useSessionStore.getState().session)).toBe('ready');
  });
});
