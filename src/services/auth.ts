// The crypto polyfill must load before the Cognito SRP client constructs a pool.
import '@/features/auth/cryptoPolyfill';

import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

import { setAuthToken, clearAuthToken } from '@/lib/http';
import { secureStorage } from '@/lib/secureStorage';
import type { AuthUser, Entitlement, EntryPath } from '@/features/auth/types';

export interface AuthResult {
  user: AuthUser;
  entitlement: Entitlement;
  entryPath: EntryPath;
  sponsorOrganization?: string;
}

export interface AuthService {
  /** SRP sign-in for an invited user. Throws `NewPasswordRequiredError` on a
   * first login (temp password) so the caller can collect a permanent one. */
  signIn(email: string, password: string): Promise<AuthResult>;
  /** Finish a first login: set the permanent password after signIn threw
   * `NewPasswordRequiredError`. */
  completeNewPassword(email: string, newPassword: string): Promise<AuthResult>;
  /** Start a password reset — emails a code. */
  forgotPassword(email: string): Promise<void>;
  /** Complete a password reset with the emailed code and a new password. */
  confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void>;
  /** Exchange the stored refresh token for a fresh access token. Returns false
   * when no valid refresh token is available (caller should sign out). */
  refresh(): Promise<boolean>;
  signOut(): Promise<void>;
  isBiometricAvailable(): Promise<boolean>;
}

/** A human-readable auth failure; `.code` is the underlying Cognito code. */
export class AuthError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Signals an invited user's first login: they must set a permanent password. */
export class NewPasswordRequiredError extends Error {
  constructor(readonly email: string) {
    super('NEW_PASSWORD_REQUIRED');
    this.name = 'NewPasswordRequiredError';
  }
}

// --------------------------------------------------------------------------- //
// Cognito config + helpers
// --------------------------------------------------------------------------- //

const REFRESH_KEY = 'westercove.cognito.refresh';
const USERNAME_KEY = 'westercove.cognito.username';

let poolCache: CognitoUserPool | undefined;

/** Lazily build the user pool from env, with a clear error if it's unset. */
function userPool(): CognitoUserPool {
  if (poolCache) return poolCache;
  const UserPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
  const ClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
  if (!UserPoolId || !ClientId) {
    throw new AuthError(
      'Sign-in is not configured yet. Set EXPO_PUBLIC_COGNITO_USER_POOL_ID and EXPO_PUBLIC_COGNITO_CLIENT_ID.',
    );
  }
  poolCache = new CognitoUserPool({ UserPoolId, ClientId });
  return poolCache;
}

function cognitoUser(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: userPool() });
}

/** Map a Cognito error to a friendly, non-enumerating message. */
function toAuthError(err: unknown): AuthError {
  const code = (err as { code?: string; name?: string })?.code ?? (err as { name?: string })?.name;
  const map: Record<string, string> = {
    NotAuthorizedException: 'Incorrect email or password.',
    UserNotFoundException: 'Incorrect email or password.',
    UserNotConfirmedException: 'Your account is not confirmed yet. Check your email.',
    CodeMismatchException: 'That code is incorrect. Please try again.',
    ExpiredCodeException: 'That code has expired. Request a new one.',
    InvalidPasswordException:
      'That password does not meet the requirements. Use at least 8 characters with a mix of cases, a number, and a symbol.',
    LimitExceededException: 'Too many attempts. Please wait a moment and try again.',
    TooManyRequestsException: 'Too many attempts. Please wait a moment and try again.',
    PasswordResetRequiredException: 'You need to reset your password. Use “Forgot password”.',
  };
  const message =
    (code && map[code]) ||
    (err instanceof Error && err.message) ||
    'Something went wrong signing in. Please try again.';
  return new AuthError(message, code);
}

/** Persist the access token (apiClient bearer) + refresh token from a session. */
async function applySession(email: string, session: CognitoUserSession): Promise<void> {
  await setAuthToken(session.getAccessToken().getJwtToken());
  const refreshToken = session.getRefreshToken().getToken();
  if (refreshToken) {
    await secureStorage.setItem(REFRESH_KEY, refreshToken);
    await secureStorage.setItem(USERNAME_KEY, email);
  }
}

/** Default identity fields for a fresh session; entitlement is reconciled from
 * the subscription/CRM services after sign-in, not from the token. */
function resultFor(email: string): AuthResult {
  return { user: { email }, entryPath: 'consumer_trial', entitlement: 'trial_active' };
}

// Holds the CognitoUser mid-challenge between signIn (NEW_PASSWORD_REQUIRED) and
// completeNewPassword — that call must reuse the same session object.
let pendingChallenge: { email: string; user: CognitoUser } | null = null;

/**
 * Real auth against AWS Cognito using client-side SRP (the backend validates
 * the resulting access token; it never sees the password). The pool is
 * invite-only + SRP-only, so there is no self-signup and no USER_PASSWORD_AUTH.
 */
export class CognitoAuthService implements AuthService {
  signIn(email: string, password: string): Promise<AuthResult> {
    const user = cognitoUser(email);
    const details = new AuthenticationDetails({ Username: email, Password: password });
    return new Promise<AuthResult>((resolve, reject) => {
      user.authenticateUser(details, {
        onSuccess: (session) => {
          applySession(email, session).then(() => resolve(resultFor(email)), reject);
        },
        onFailure: (err) => reject(toAuthError(err)),
        newPasswordRequired: () => {
          // First login with the emailed temp password: keep the challenged
          // user so completeNewPassword can finish it.
          pendingChallenge = { email, user };
          reject(new NewPasswordRequiredError(email));
        },
      });
    });
  }

  completeNewPassword(email: string, newPassword: string): Promise<AuthResult> {
    const pending = pendingChallenge;
    if (!pending || pending.email !== email) {
      return Promise.reject(
        new AuthError('Your sign-in session expired. Please sign in again.'),
      );
    }
    return new Promise<AuthResult>((resolve, reject) => {
      // No required attributes: email is already set on the invited user.
      pending.user.completeNewPasswordChallenge(
        newPassword,
        {},
        {
          onSuccess: (session) => {
            pendingChallenge = null;
            applySession(email, session).then(() => resolve(resultFor(email)), reject);
          },
          onFailure: (err) => reject(toAuthError(err)),
        },
      );
    });
  }

  forgotPassword(email: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      cognitoUser(email).forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(toAuthError(err)),
      });
    });
  }

  confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      cognitoUser(email).confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(toAuthError(err)),
      });
    });
  }

  async refresh(): Promise<boolean> {
    const [token, email] = await Promise.all([
      secureStorage.getItem(REFRESH_KEY),
      secureStorage.getItem(USERNAME_KEY),
    ]);
    if (!token || !email) return false;
    const user = cognitoUser(email);
    return new Promise<boolean>((resolve) => {
      user.refreshSession(new CognitoRefreshToken({ RefreshToken: token }), (err, session) => {
        if (err || !session) {
          resolve(false);
          return;
        }
        applySession(email, session).then(
          () => resolve(true),
          () => resolve(false),
        );
      });
    });
  }

  async signOut(): Promise<void> {
    pendingChallenge = null;
    await Promise.all([
      clearAuthToken(),
      secureStorage.removeItem(REFRESH_KEY),
      secureStorage.removeItem(USERNAME_KEY),
    ]);
  }

  async isBiometricAvailable(): Promise<boolean> {
    // Native biometric unlock is a later pass (expo-local-authentication).
    return false;
  }
}
