/**
 * Pure signup-form validation for the merged entry screen. Extracted from the
 * screen so the "validate on submit, show every failing field at once" rule is
 * unit-testable (the screen itself pulls in the reanimated HeroHeader and can't
 * render under jest). The screen renders these strings together on Continue —
 * never per keystroke, so the form does not scold a user who is still typing.
 */
export interface SignupFieldState {
  emailValid: boolean;
  passwordValid: boolean;
  passwordsMatch: boolean;
}

export interface SignupErrorCopy {
  invalidEmail: string;
  passwordHint: string;
  passwordMismatch: string;
}

/** Every failing field, in field order (email → password rule → mismatch).
 * Empty array means the form is valid. */
export function collectSignupErrors(state: SignupFieldState, copy: SignupErrorCopy): string[] {
  const errors: string[] = [];
  if (!state.emailValid) errors.push(copy.invalidEmail);
  if (!state.passwordValid) errors.push(copy.passwordHint);
  if (!state.passwordsMatch) errors.push(copy.passwordMismatch);
  return errors;
}
