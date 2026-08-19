jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useSessionStore } from '@/features/auth/sessionStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { services } from '@/services';
import type { ProfileSurveyData } from '@/services/survey';

const profileData = (answers: Record<string, string>): ProfileSurveyData => ({
  id: 3,
  answers,
  promptStatus: 'ready',
});

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

  describe('backend sync', () => {
    afterEach(() => jest.restoreAllMocks());

    it('syncFromBackend is a no-op without a backend profile id', async () => {
      const get = jest.spyOn(services.survey, 'getProfileAnswers');
      await useWhatIKnowStore.getState().syncFromBackend();
      expect(get).not.toHaveBeenCalled();
    });

    it('replaces gate facts with backend answers, keeping conversation items', async () => {
      useSessionStore.setState((s) => ({ session: { ...s.session!, backendProfileId: 3 } }));
      useWhatIKnowStore.setState({
        learned: [{ id: 'c1', label: 'A place', value: 'lake', source: 'conversation' }],
      });
      jest
        .spyOn(services.survey, 'getProfileAnswers')
        .mockResolvedValue(profileData({ user_name: 'Sam', relationship: 'sibling', blank: '  ' }));

      await useWhatIKnowStore.getState().syncFromBackend();
      const learned = useWhatIKnowStore.getState().learned;

      expect(learned.find((i) => i.questionId === 'user_name')).toMatchObject({
        label: 'What to call you',
        value: 'Sam',
      });
      expect(learned.find((i) => i.questionId === 'blank')).toBeUndefined(); // empty dropped
      expect(learned.find((i) => i.id === 'c1')).toBeDefined(); // conversation kept
    });

    it('edit/delete of a backend fact patches the profile answers', async () => {
      useSessionStore.setState((s) => ({ session: { ...s.session!, backendProfileId: 3 } }));
      useWhatIKnowStore.setState({
        learned: [
          { id: 'q-user_name', label: 'What to call you', value: 'Sam', source: 'gate', questionId: 'user_name' },
        ],
      });
      const patch = jest
        .spyOn(services.survey, 'updateProfileAnswers')
        .mockResolvedValue(profileData({ user_name: 'Samuel' }));

      useWhatIKnowStore.getState().updateItem('q-user_name', 'Samuel');
      expect(patch).toHaveBeenCalledWith(3, { user_name: 'Samuel' });

      useWhatIKnowStore.getState().deleteItem('q-user_name');
      expect(patch).toHaveBeenCalledWith(3, { user_name: '' }); // clear server-side
    });
  });
});
