import type { Entitlement, EntryPath } from '@/features/auth/types';

/**
 * The GoHighLevel-style CRM contact. At signup we create ONE contact carrying
 * only the entry path and entitlement state (and optionally a first name /
 * sponsor). No journal content, profile answers, or safety data ever reaches
 * it — the hard privacy fence from the journey map (§5).
 */
export interface CrmContact {
  email: string;
  firstName?: string;
  entryPath: EntryPath;
  entitlement: Entitlement;
  sponsorOrganization?: string;
}

export interface CrmService {
  createContact(contact: CrmContact): Promise<void>;
  updateEntitlement(email: string, entitlement: Entitlement): Promise<void>;
}

/** Mock CRM — records lifecycle facts in memory. Real impl calls GoHighLevel. */
export class MockCrmService implements CrmService {
  readonly contacts: CrmContact[] = [];

  async createContact(contact: CrmContact): Promise<void> {
    this.contacts.push(contact);
  }

  async updateEntitlement(email: string, entitlement: Entitlement): Promise<void> {
    const c = this.contacts.find((x) => x.email === email);
    if (c) c.entitlement = entitlement;
  }
}
