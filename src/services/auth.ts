import type {
  AuthUser,
  Entitlement,
  EntryPath,
} from '@/features/auth/types';

export interface CreateAccountInput {
  entryPath: EntryPath;
  email?: string;
  licenseCode?: string;
  sponsorOrganization?: string;
}

export interface AuthResult {
  user: AuthUser;
  entitlement: Entitlement;
  entryPath: EntryPath;
  sponsorOrganization?: string;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<AuthResult>;
  createAccount(input: CreateAccountInput): Promise<AuthResult>;
  isBiometricAvailable(): Promise<boolean>;
}

/**
 * Mock auth. Accepts any credentials and mints a session; the real service
 * authenticates against the FastAPI/AWS backend behind the same interface.
 * Entitlement is derived from the entry path.
 */
export class MockAuthService implements AuthService {
  async signIn(email: string): Promise<AuthResult> {
    return {
      user: { email },
      entitlement: 'trial_active',
      entryPath: 'consumer_trial',
    };
  }

  async createAccount(input: CreateAccountInput): Promise<AuthResult> {
    const entitlement: Entitlement =
      input.entryPath === 'partner_license' ? 'license_active' : 'trial_active';
    return {
      user: { email: input.email ?? 'you@westercove.app' },
      entitlement,
      entryPath: input.entryPath,
      sponsorOrganization: input.sponsorOrganization,
    };
  }

  async isBiometricAvailable(): Promise<boolean> {
    // Native biometric availability is checked via expo-local-authentication
    // in a later pass; the pre-auth screen shows the Face ID affordance
    // conditionally. Mock returns false so web/simulator hide it.
    return false;
  }
}
