import { apiClient } from '@/lib/http';

/**
 * Legal-disclaimer gate (spec v7 §2 / R-34-R-36). The server owns the versioned
 * copy AND the acknowledgement log: the client renders whatever `content` the
 * status endpoint returns and never hardcodes the disclaimer text, so a copy or
 * version change on the backend (Dwight's R-32/R-33) flows through without a
 * client release. Re-acceptance (R-36) is driven by `required`: the server sets
 * it when the current version differs from what this member last acknowledged.
 * Both routes require an authenticated member.
 */

/** Which legal document: the wellness disclaimer, or Terms & Privacy. The
 * same endpoints serve both, discriminated by this param (R-25). Omitted =
 * the disclaimer (the server default). */
export type LegalDocument = 'disclaimer' | 'terms';

/** Server-rendered legal content — the app displays this verbatim. */
/** A linkable reference inside the consent copy: `label` is an exact substring
 * of a summary line, `document` the /legal-disclaimer/content target it opens.
 * The server only sends links for documents it actually serves. */
export interface LegalLink {
  label: string;
  document: string;
}

export interface DisclaimerContent {
  version: string;
  title: string;
  /** Plain-language intro paragraphs shown above the full text. Versioned
   * legal copy (not chrome), so it is server-owned like everything else here. */
  summary: string[];
  paragraphs: string[];
  bullets: string[];
  /** One required checkbox per entry (e.g. 18+, read-and-understood). */
  acknowledgementChecks: string[];
  /** Label for the accept action. */
  acknowledgementLabel: string;
  /** Label for the non-blocking "save and read later" action. */
  saveAndReadLaterLabel: string;
  communityGuidelinesUrl: string | null;
  /** Server-supplied links to legal documents named inline in the summary
   * (e.g. Terms). Only documents the server actually serves are included. */
  links: LegalLink[];
  /** Plain last-updated date, when the server sends one (Terms & Privacy). */
  lastUpdated: string | null;
}

export interface DisclaimerStatus {
  /** True when the member must (re-)acknowledge before it is considered done. */
  required: boolean;
  /** Why it is required (e.g. never acknowledged, version changed), or null. */
  reason: string | null;
  currentVersion: string;
  content: DisclaimerContent;
}

export interface LegalService {
  /** The document content + whether this member/device must acknowledge it. */
  getStatus(deviceId: string, document?: LegalDocument): Promise<DisclaimerStatus>;
  /** Record acceptance of the current version for this device (append-only). */
  acknowledge(deviceId: string, document?: LegalDocument): Promise<DisclaimerStatus>;
  /** PUBLIC, no-auth content for the pre-account gate: version + copy only, no
   * ack/user state (#183). The pre-auth screen displays this and records the
   * acknowledgement via `acknowledge` once the account exists. */
  getContent(document?: LegalDocument): Promise<DisclaimerContent>;
}

interface ContentWire {
  version: string;
  title: string;
  summary?: string[];
  paragraphs: string[];
  bullets: string[];
  acknowledgement_checks: string[];
  acknowledgement_label: string;
  save_and_read_later_label: string;
  community_guidelines_url: string | null;
  links?: LegalLink[];
  last_updated?: string | null;
}

interface StatusWire {
  required: boolean;
  reason: string | null;
  current_version: string;
  content: ContentWire;
}

function toContent(c: ContentWire): DisclaimerContent {
  return {
    version: c.version,
    title: c.title,
    summary: c.summary ?? [],
    paragraphs: c.paragraphs,
    bullets: c.bullets,
    acknowledgementChecks: c.acknowledgement_checks,
    acknowledgementLabel: c.acknowledgement_label,
    saveAndReadLaterLabel: c.save_and_read_later_label,
    communityGuidelinesUrl: c.community_guidelines_url,
    links: c.links ?? [],
    lastUpdated: c.last_updated ?? null,
  };
}

function toStatus(r: StatusWire): DisclaimerStatus {
  return {
    required: r.required,
    reason: r.reason,
    currentVersion: r.current_version,
    content: toContent(r.content),
  };
}

export class ApiLegalService implements LegalService {
  async getStatus(deviceId: string, document?: LegalDocument): Promise<DisclaimerStatus> {
    return toStatus(
      await apiClient.get('/legal-disclaimer/status', {
        query: { device_id: deviceId, ...(document ? { document } : {}) },
      }),
    );
  }

  async acknowledge(deviceId: string, document?: LegalDocument): Promise<DisclaimerStatus> {
    return toStatus(
      await apiClient.post('/legal-disclaimer/acknowledge', {
        device_id: deviceId,
        ...(document ? { document } : {}),
      }),
    );
  }

  async getContent(document?: LegalDocument): Promise<DisclaimerContent> {
    return toContent(
      await apiClient.get('/legal-disclaimer/content', {
        auth: false,
        query: document ? { document } : {},
      }),
    );
  }
}
