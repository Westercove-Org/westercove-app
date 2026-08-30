import { apiClient } from '@/lib/http';

/** The server's journal entry_type enum (QuietRoom `JournalEntryType`). The app
 * maps its compose-picker labels onto these via `entryTypeEnum` (entryTypes.ts). */
export type JournalEntryType =
  | 'journal'
  | 'memory'
  | 'struggle'
  | 'practice'
  | 'grief_question'
  | 'anniversary'
  | 'community'
  | 'letter'
  | 'sign'
  | 'rage'
  | 'forgive'
  | 'emotions';

/** A persisted journal entry as stored server-side (`JournalResponse`). `entry`,
 * `title`, and `reflection` are encrypted at rest (AES-256-GCM); the server
 * decrypts on read, so the app only ever sees plaintext over TLS. Entries are
 * CREATED via the companion chat flow (which keeps the crisis-safety block and
 * 4-Doors); this record is the read/edit view of that same row, reachable by the
 * `entry_id` the chat's `journal_created` effect returns. */
export interface JournalRecord {
  id: number;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM:SS`. */
  time: string;
  title: string;
  entry: string;
  reflection: string | null;
  entryType: JournalEntryType;
  profileId: number | null;
  /** UTC ISO, trailing `Z`. */
  createdAt: string;
}

export interface ListJournalOptions {
  sort?: 'created_at' | 'entry_type';
  entryType?: JournalEntryType;
}

/** Fields editable via PATCH. Omit a field to leave it; pass `reflection: null`
 * to clear the reflection explicitly. */
export interface JournalPatch {
  date?: string;
  time?: string;
  title?: string;
  entry?: string;
  reflection?: string | null;
  entryType?: JournalEntryType;
}

export interface JournalService {
  /** A profile's entries, newest-first by default. */
  list(profileId: number, options?: ListJournalOptions): Promise<JournalRecord[]>;
  get(id: number): Promise<JournalRecord>;
  update(id: number, patch: JournalPatch): Promise<JournalRecord>;
  remove(id: number): Promise<void>;
}

interface RawJournal {
  id: number;
  date: string;
  time: string;
  title: string;
  entry: string;
  reflection?: string | null;
  entry_type: JournalEntryType;
  profile_id?: number | null;
  created_at: string;
}

function toRecord(r: RawJournal): JournalRecord {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    title: r.title,
    entry: r.entry,
    reflection: r.reflection ?? null,
    entryType: r.entry_type,
    profileId: r.profile_id ?? null,
    createdAt: r.created_at,
  };
}

/**
 * Server-authoritative journal read/edit layer (QuietRoom `/api/journal`). This
 * is the full path — the shared `apiClient` base does not prepend `/api`.
 * Creation is NOT here: entries are created through the companion chat flow so
 * they keep the crisis-safety tier and the 4-Doors question; this service reads,
 * edits, and deletes the persisted rows that flow produces.
 */
export class ApiJournalService implements JournalService {
  async list(profileId: number, options: ListJournalOptions = {}): Promise<JournalRecord[]> {
    const q = new URLSearchParams({ profile_id: String(profileId) });
    if (options.sort) q.set('sort', options.sort);
    if (options.entryType) q.set('entry_type', options.entryType);
    const res = await apiClient.get<RawJournal[]>(`/api/journal?${q.toString()}`);
    return res.map(toRecord);
  }

  async get(id: number): Promise<JournalRecord> {
    return toRecord(await apiClient.get<RawJournal>(`/api/journal/${id}`));
  }

  async update(id: number, patch: JournalPatch): Promise<JournalRecord> {
    const body: Record<string, unknown> = {};
    if (patch.date !== undefined) body.date = patch.date;
    if (patch.time !== undefined) body.time = patch.time;
    if (patch.title !== undefined) body.title = patch.title;
    if (patch.entry !== undefined) body.entry = patch.entry;
    // reflection is nullable-settable: include it when present even if null.
    if (patch.reflection !== undefined) body.reflection = patch.reflection;
    if (patch.entryType !== undefined) body.entry_type = patch.entryType;
    return toRecord(await apiClient.patch<RawJournal>(`/api/journal/${id}`, body));
  }

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/api/journal/${id}`);
  }
}
