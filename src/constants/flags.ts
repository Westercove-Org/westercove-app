/** Client feature flags. `USE_FOUR_DOORS` mirrors the backend's USE_FOUR_DOORS
 * so the new 4-Doors gate can ship dark and be flipped on in lockstep with the
 * backend, without disturbing the current flat day-zero wizard. Set
 * `EXPO_PUBLIC_USE_FOUR_DOORS=true` to enable. */
export const USE_FOUR_DOORS = process.env.EXPO_PUBLIC_USE_FOUR_DOORS === 'true';
