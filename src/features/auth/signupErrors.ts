import { HttpError } from '@/lib/http';

/**
 * Deliberate, grief-safe mapping from a signup HTTP failure to a human sentence.
 * Extracted from the screen so it is unit-tested (the screen pulls in the
 * reanimated HeroHeader and can't render under jest) and so every signup catch
 * routes through ONE mapper — a raw "Request failed with status N" must never
 * reach the user.
 *
 * The org-code / sponsored endpoints reject with the contract envelope
 * `{ detail: { code, message } }` (hive/shared/org_code_error_contract.md):
 * `message` is already written for a grieving user (no HTTP nouns, no blame), so
 * we render it VERBATIM. `code_invalid` is deliberately uniform for
 * unknown/used/expired codes (privacy) — we never sub-classify it. The transport
 * layer's own fallback (GENERIC_ERROR_MESSAGE) still guarantees a calm sentence
 * for any error this mapper doesn't recognise.
 */

/** The grief-safe `detail.message` from the reject envelope, or null. */
export function detailMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (detail && typeof detail === 'object' && 'message' in detail) {
      const message = (detail as { message: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }
  return null;
}

export interface SignupErrorCopy {
  rateLimited: string;
  genericError: string;
}

/** Message for a failed org-code / sponsored signup. Rate-limit first, then the
 * server's verbatim grief-safe copy, else a neutral fallback — never a status. */
export function signupErrorMessage(e: unknown, c: SignupErrorCopy): string {
  if (e instanceof HttpError) {
    if (e.status === 429) return c.rateLimited;
    const detail = detailMessage(e.data);
    if (detail) return detail;
  }
  return c.genericError;
}

export interface CheckoutErrorCopy {
  checkoutUnavailable: string;
  rateLimited: string;
  checkoutError: string;
}

/** Message for a failed checkout. 503 = payments off, 429 = rate limit. No 409:
 * an already-registered email returns a generic 200 with checkoutUrl:null. */
export function checkoutErrorMessage(e: unknown, c: CheckoutErrorCopy): string {
  if (e instanceof HttpError) {
    if (e.status === 503) return c.checkoutUnavailable;
    if (e.status === 429) return c.rateLimited;
  }
  return c.checkoutError;
}
