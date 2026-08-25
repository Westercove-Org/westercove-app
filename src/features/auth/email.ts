/** Pragmatic client-side email-format check: one @, a dot in the domain, no
 * spaces. Cognito remains the authority — this only stops obviously malformed
 * addresses (and empty input) before a pointless network round-trip. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
