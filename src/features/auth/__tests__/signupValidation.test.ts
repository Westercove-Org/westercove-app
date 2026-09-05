import { collectSignupErrors } from '@/features/auth/signupValidation';

const copy = {
  invalidEmail: 'Enter a valid email address.',
  passwordHint: 'At least 12 characters, with a mix of cases, a number, and a symbol.',
  passwordMismatch: 'Passwords don’t match.',
};

describe('collectSignupErrors', () => {
  it('returns no errors when every field is valid', () => {
    expect(
      collectSignupErrors({ emailValid: true, passwordValid: true, passwordsMatch: true }, copy),
    ).toEqual([]);
  });

  it('surfaces EVERY failing field at once, in field order', () => {
    expect(
      collectSignupErrors(
        { emailValid: false, passwordValid: false, passwordsMatch: false },
        copy,
      ),
    ).toEqual([copy.invalidEmail, copy.passwordHint, copy.passwordMismatch]);
  });

  it('reports only the fields that fail', () => {
    expect(
      collectSignupErrors({ emailValid: true, passwordValid: false, passwordsMatch: true }, copy),
    ).toEqual([copy.passwordHint]);
    expect(
      collectSignupErrors({ emailValid: true, passwordValid: true, passwordsMatch: false }, copy),
    ).toEqual([copy.passwordMismatch]);
  });
});
