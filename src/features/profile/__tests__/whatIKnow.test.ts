jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useSessionStore } from '@/features/auth/sessionStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';

function seedSession() {
  useSessionStore.setState({
    hydrated: true,
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
});
