jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      delete store[k];
    }),
  };
});

import {
  getWelcomeAcceptance,
  hasAcceptedWelcome,
  recordWelcomeAcceptance,
} from '@/features/auth/welcomeAcceptance';

describe('welcome acceptance', () => {
  it('records the version + timestamp and reads it back', async () => {
    await recordWelcomeAcceptance('welcome-v1');
    const stored = await getWelcomeAcceptance();
    expect(stored?.version).toBe('welcome-v1');
    expect(typeof stored?.acceptedAt).toBe('string');
    expect(await hasAcceptedWelcome('welcome-v1')).toBe(true);
  });

  it('re-asks when the current version differs from what was accepted', async () => {
    await recordWelcomeAcceptance('welcome-v1');
    expect(await hasAcceptedWelcome('welcome-v2')).toBe(false);
  });
});
