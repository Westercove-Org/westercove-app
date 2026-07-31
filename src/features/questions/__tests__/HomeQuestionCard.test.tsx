jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { HomeQuestionCard } from '@/features/questions/HomeQuestionCard';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useCadenceStore } from '@/features/questions/demoCadenceStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';
import { act, fireEvent, renderWithProviders, waitFor } from '@/test-utils';

function seed() {
  useSessionStore.setState({
    session: {
      user: { email: 'a@b.com' },
      entryPath: 'consumer_trial',
      entitlement: 'trial_active',
      disclaimerAcked: true,
      gateComplete: true,
      gateAnswers: { mode: 'human', skipped: [], callName: 'Corinne', lovedOneName: 'Lily' },
    },
  });
  useCadenceStore.setState({ stage: 0, sessionMinutes: 0, totalMinutes: 0 });
  useQuestionsStore.setState({ answers: {}, skipped: [], daysShown: 0, talkMs: 0, pending: null, deferAfterNo: false });
}

describe('HomeQuestionCard', () => {
  beforeEach(seed);

  it('surfaces the first question about the loved one by name', async () => {
    const { getByText } = await renderWithProviders(<HomeQuestionCard />);
    expect(getByText(/Tell me about Lily/)).toBeTruthy();
  });

  it('renders a text field for the opening question and advances when answered', async () => {
    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <HomeQuestionCard />,
    );
    // The opening question offers a free-text field.
    expect(getByPlaceholderText('Say as much or as little as you want…')).toBeTruthy();

    // Recording the answer advances the card to the next Day 1 question.
    await act(async () => {
      useQuestionsStore.getState().recordAnswer('h0', 'She drew foxes on everything.');
    });
    await waitFor(() => expect(queryByText(/Tell me about Lily/)).toBeNull());
    expect(getByText(/add a photo of Lily/)).toBeTruthy();
  });

  it('"Not right now" skips and advances to the next question in the bucket', async () => {
    const { getByLabelText, getByText } = await renderWithProviders(<HomeQuestionCard />);
    fireEvent.press(getByLabelText('Not right now'));
    // h0 recorded as skipped; the next Day 1 question (photo offer) surfaces.
    await waitFor(() => expect(useQuestionsStore.getState().skipped).toContain('h0'));
    await waitFor(() => expect(getByText(/add a photo of Lily/)).toBeTruthy());
  });

  it('renders nothing once the unlocked bucket is exhausted', async () => {
    // Mark Day 1 done so no bucket is due at stage 0.
    useQuestionsStore.setState({ daysShown: 1 });
    const { queryByText } = await renderWithProviders(<HomeQuestionCard />);
    expect(queryByText(/Tell me about Lily/)).toBeNull();
  });
});
