/**
 * Storage-key helpers for the multi-profile demo harness. Every "test profile"
 * is a separate saved person; all of that person's per-profile stores persist
 * under keys namespaced by the profile id, so two people never mix.
 */
export function profileKey(base: string, id: string): string {
  return `westercove.p.${id}.${base}`;
}

/** Per-profile persisted store bases (see bindProfileStores). */
export const SESSION_BASE = 'session';
export const ENTRIES_BASE = 'entries';
export const QUESTIONS_BASE = 'questions';
export const LIBRARY_BASE = 'library';
export const CADENCE_BASE = 'cadence';
export const DATES_BASE = 'dates';
