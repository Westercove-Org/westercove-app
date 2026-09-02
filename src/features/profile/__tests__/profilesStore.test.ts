jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useProfilesStore } from '@/features/profile/profilesStore';

beforeEach(() => {
  useProfilesStore.setState({ profiles: [{ id: 'p-1', name: 'Alice' }], activeId: 'p-1' });
});

describe('profilesStore', () => {
  it('addProfile appends a roster entry, activates it, and returns its id (sv7-premium-second-profile)', () => {
    const id = useProfilesStore.getState().addProfile('Mum');
    const { profiles, activeId } = useProfilesStore.getState();
    expect(profiles).toHaveLength(2);
    expect(activeId).toBe(id);
    expect(profiles.find((p) => p.id === id)?.name).toBe('Mum');
  });

  it('addProfile labels a self-door (empty name) as "Profile N"', () => {
    const id = useProfilesStore.getState().addProfile('   ');
    expect(useProfilesStore.getState().profiles.find((p) => p.id === id)?.name).toBe('Profile 2');
  });

  it('switchProfile changes the active profile', () => {
    const id = useProfilesStore.getState().addProfile('Mum');
    expect(useProfilesStore.getState().activeId).toBe(id);
    useProfilesStore.getState().switchProfile('p-1');
    expect(useProfilesStore.getState().activeId).toBe('p-1');
  });

  it('setActiveName labels the active profile', () => {
    useProfilesStore.getState().setActiveName('Bob');
    expect(useProfilesStore.getState().profiles.find((p) => p.id === 'p-1')?.name).toBe('Bob');
  });

  it('setActiveName falls back to a neutral "Profile N" for a self door (no loved-one)', () => {
    useProfilesStore.getState().setActiveName('   ');
    expect(useProfilesStore.getState().profiles.find((p) => p.id === 'p-1')?.name).toBe('Profile 1');
  });

  it('startRealUser collapses to the single default profile and runs once', async () => {
    useProfilesStore.setState({
      profiles: [
        { id: 'demo-a', name: 'A' },
        { id: 'demo-b', name: 'B' },
      ],
      activeId: 'demo-b',
      initialized: ['demo-a', 'demo-b'],
      realSignInDone: false,
    });

    useProfilesStore.getState().startRealUser();

    let s = useProfilesStore.getState();
    expect(s.profiles).toEqual([{ id: 'p-1', name: '' }]);
    expect(s.activeId).toBe('p-1');
    expect(s.realSignInDone).toBe(true);

    // Idempotent: a second call after some drift is a no-op.
    useProfilesStore.setState({ profiles: [{ id: 'x', name: 'later' }] });
    useProfilesStore.getState().startRealUser();
    s = useProfilesStore.getState();
    expect(s.profiles).toEqual([{ id: 'x', name: 'later' }]);
  });
});
