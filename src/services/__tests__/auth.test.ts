jest.mock('expo-crypto', () => ({ getRandomValues: (a: Uint8Array) => a }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { AuthError, CognitoAuthService, NewPasswordRequiredError } from '@/services/auth';

describe('CognitoAuthService', () => {
  const svc = new CognitoAuthService();

  it('rejects createAccount — the pool is invite-only', async () => {
    await expect(svc.createAccount()).rejects.toBeInstanceOf(AuthError);
  });

  it('NewPasswordRequiredError carries the email for the challenge flow', () => {
    expect(new NewPasswordRequiredError('a@b.com').email).toBe('a@b.com');
  });

  it('refresh returns false when no refresh token is stored', async () => {
    await expect(svc.refresh()).resolves.toBe(false);
  });
});
