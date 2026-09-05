/** Client feature flags. `USE_FOUR_DOORS` mirrors the backend's USE_FOUR_DOORS.
 * The 4-Doors gate is the shipped path at launch (Rohan D3: everyone gets four
 * doors). The flag is retained as launch-week rollback insurance — set
 * `EXPO_PUBLIC_USE_FOUR_DOORS=false` to fall back to the legacy day-zero wizard.
 * The legacy path stays present-but-dead until qs7-fe-questions-teardown. */
export const USE_FOUR_DOORS = process.env.EXPO_PUBLIC_USE_FOUR_DOORS !== 'false';
