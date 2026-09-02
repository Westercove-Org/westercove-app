import * as Crypto from 'expo-crypto';

import { secureStorage } from '@/lib/secureStorage';

const KEY = 'westercove.device-id';
let cached: string | null = null;

/**
 * A stable per-install id for the legal-disclaimer acknowledgement log (R-34).
 * Generated once and persisted; it identifies the device, not the profile, so
 * it lives outside the per-profile scoped storage. UUID length (36) sits inside
 * the endpoint's 8–128 bound.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const existing = await secureStorage.getItem(KEY);
  if (existing) return (cached = existing);
  const id = Crypto.randomUUID();
  await secureStorage.setItem(KEY, id);
  return (cached = id);
}
