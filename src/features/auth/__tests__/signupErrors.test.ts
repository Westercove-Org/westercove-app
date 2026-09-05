import { HttpError } from '@/lib/http';
import { checkoutErrorMessage, detailMessage, signupErrorMessage } from '@/features/auth/signupErrors';

const c = {
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  genericError: 'Could not complete signup. Please try again.',
  checkoutUnavailable: 'Payments are temporarily unavailable.',
  checkoutError: 'Could not start checkout. Please try again.',
};

// The org-code / sponsored reject envelope from the contract.
const reject = (code: string, message: string, status = 400) =>
  new HttpError(status, 'Something went wrong. Please try again.', { detail: { code, message } });

describe('detailMessage', () => {
  it('reads the verbatim grief-safe message from the reject envelope', () => {
    expect(detailMessage({ detail: { code: 'code_invalid', message: 'That code is not valid.' } })).toBe(
      'That code is not valid.',
    );
  });

  it('returns null when there is no usable detail message', () => {
    expect(detailMessage(null)).toBeNull();
    expect(detailMessage({})).toBeNull();
    expect(detailMessage({ detail: {} })).toBeNull();
    expect(detailMessage({ detail: { message: 42 } })).toBeNull();
    expect(detailMessage({ detail: { message: '   ' } })).toBeNull();
  });
});

describe('signupErrorMessage', () => {
  it('renders the contract detail.message verbatim (never a raw status)', () => {
    const msg = 'That code is not valid. Please check it and try again, or reach out to whoever shared it with you.';
    const out = signupErrorMessage(reject('code_invalid', msg), c);
    expect(out).toBe(msg);
    expect(out).not.toMatch(/status \d/i);
  });

  it('surfaces the server password-policy message for password_weak', () => {
    const msg = 'At least 12 characters, with a mix of cases, a number, and a symbol.';
    expect(signupErrorMessage(reject('password_weak', msg), c)).toBe(msg);
  });

  it('maps 429 to the rate-limit copy before reading detail', () => {
    expect(signupErrorMessage(reject('code_invalid', 'nope', 429), c)).toBe(c.rateLimited);
  });

  it('falls back to the neutral copy for an error with no detail (never a status string)', () => {
    // e.g. the transport-layer HttpError whose message is the generic fallback.
    const out = signupErrorMessage(new HttpError(400, 'Something went wrong. Please try again.', null), c);
    expect(out).toBe(c.genericError);
    expect(signupErrorMessage(new TypeError('Failed to fetch'), c)).toBe(c.genericError);
  });
});

describe('checkoutErrorMessage', () => {
  it('maps 503 → payments off, 429 → rate limit, else generic', () => {
    expect(checkoutErrorMessage(new HttpError(503, 'x', null), c)).toBe(c.checkoutUnavailable);
    expect(checkoutErrorMessage(new HttpError(429, 'x', null), c)).toBe(c.rateLimited);
    expect(checkoutErrorMessage(new HttpError(400, 'x', null), c)).toBe(c.checkoutError);
    expect(checkoutErrorMessage(new Error('boom'), c)).toBe(c.checkoutError);
  });
});
