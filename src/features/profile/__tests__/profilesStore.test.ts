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
  it('createNew keeps existing profiles and activates the new blank one', async () => {
    await useProfilesStore.getState().createNew();
    const { profiles, activeId } = useProfilesStore.getState();
    expect(profiles).toHaveLength(2);
    expect(profiles[0]).toEqual({ id: 'p-1', name: 'Alice' }); // old one untouched
    expect(activeId).not.toBe('p-1');
    expect(profiles.find((p) => p.id === activeId)?.name).toBe(''); // new = blank
  });

  it('setActiveName labels the active profile', () => {
    useProfilesStore.getState().setActiveName('Bob');
    expect(useProfilesStore.getState().profiles.find((p) => p.id === 'p-1')?.name).toBe('Bob');
  });

  it('remove drops a non-active profile', async () => {
    await useProfilesStore.getState().createNew();
    const active = useProfilesStore.getState().activeId;
    useProfilesStore.getState().remove('p-1');
    const { profiles, activeId } = useProfilesStore.getState();
    expect(profiles.some((p) => p.id === 'p-1')).toBe(false);
    expect(activeId).toBe(active);
  });
});
