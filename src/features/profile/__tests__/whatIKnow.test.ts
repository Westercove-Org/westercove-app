jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useSessionStore } from '@/features/auth/sessionStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';

function seedSession() {
  useSessionStore.setState({
    session: {
      user: { email: 'a@b.com' },
      entryPath: 'consumer_trial',
      entitlement: 'trial_active',
      disclaimerAcked: true,
      gateComplete: true,
      gateAnswers: {
        mode: 'human',
        skipped: [],
        callName: 'Sam',
        lovedOneName: 'Alex',
        tone: 'Gentle and warm',
      },
    },
  });
}

describe('What I Know store', () => {
  beforeEach(() => {
    seedSession();
    useQuestionsStore.setState({ answers: {}, skipped: [], daysShown: 0, talkMs: 0 });
    useWhatIKnowStore.setState({ learned: [] });
    useWhatIKnowStore.getState().hydrateFromSession();
  });

  it('builds learned items from the gate answers', () => {
    const labels = useWhatIKnowStore.getState().learned.map((i) => i.value);
    expect(labels).toContain('Sam');
    expect(labels).toContain('Alex');
    expect(labels).toContain('Gentle and warm');
  });

  it('deleting a learned fact removes it immediately', () => {
    const first = useWhatIKnowStore.getState().learned[0];
    useWhatIKnowStore.getState().deleteItem(first.id);
    expect(useWhatIKnowStore.getState().learned.find((i) => i.id === first.id)).toBeUndefined();
  });

  it('editing updates the value', () => {
    const item = useWhatIKnowStore.getState().learned.find((i) => i.value === 'Sam')!;
    useWhatIKnowStore.getState().updateItem(item.id, 'Samuel');
    expect(useWhatIKnowStore.getState().learned.find((i) => i.id === item.id)!.value).toBe('Samuel');
  });

  it('surfaces conversational answers and retires answered prompts', () => {
    useQuestionsStore.setState({
      answers: { h12: 'Never say at least she is not suffering', h14: 'No survival statistics' },
    });
    useWhatIKnowStore.getState().hydrateFromSession();

    const labels = useWhatIKnowStore.getState().learned.map((i) => i.label);
    expect(labels).toContain('Never suggest');
    expect(labels).toContain('Topics to avoid');

    // The "topics you'd rather never see" prompt retires once h14 is answered.
    const prompts = useWhatIKnowStore.getState().unanswered.map((u) => u.prompt);
    expect(prompts.some((p) => /topics you would rather never see/i.test(p))).toBe(false);
    // The faith prompt is still open (h13 unanswered).
    expect(prompts.some((p) => /faith or spiritual/i.test(p))).toBe(true);
  });
});
