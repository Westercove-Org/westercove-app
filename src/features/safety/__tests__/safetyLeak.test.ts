jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { reloadSafetyForActiveProfile, useSafetyStore } from '@/features/safety/safetyStore';
import { setActiveId } from '@/features/profile/activeProfile';

describe('crisis context isolation across a profile switch (#102 send-back)', () => {
  afterEach(() => {
    useSafetyStore.getState().clear();
    setActiveId('p-1');
  });

  it("does not carry profile A's crisis tier/resources into a fresh profile B", async () => {
    // Profile A is in a standing crisis.
    setActiveId('A');
    useSafetyStore.setState({ tier: 'tier_3', resources: undefined });
    expect(useSafetyStore.getState().tier).toBe('tier_3');

    // Switch to B (no stored safety): the singleton must reset, not leak A's crisis.
    setActiveId('B');
    await reloadSafetyForActiveProfile();

    expect(useSafetyStore.getState().tier).toBe('none');
    expect(useSafetyStore.getState().resources).toBeUndefined();
  });
});
