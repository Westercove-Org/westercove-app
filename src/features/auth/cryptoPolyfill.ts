import * as Crypto from 'expo-crypto';

/**
 * amazon-cognito-identity-js runs SRP client-side and needs
 * `crypto.getRandomValues`. Hermes (native) ships no global WebCrypto, so seed
 * one from expo-crypto (bundled in Expo Go). Web already has a native
 * `crypto.getRandomValues`, so this is a no-op there. Import once, before the
 * Cognito user pool is constructed.
 */
const g = globalThis as unknown as { crypto?: { getRandomValues?: unknown } };

if (!g.crypto) g.crypto = {};
if (typeof g.crypto.getRandomValues !== 'function') {
  g.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T =>
    Crypto.getRandomValues(array as never) as T;
}
