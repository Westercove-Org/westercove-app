import { Redirect } from 'expo-router';

/**
 * Canonical signup route is /sign-up (hyphen). This alias catches /signup (from
 * marketing/email/doc links) and forwards to it. Lives in (auth) so the auth
 * guard doesn't bounce an unauthenticated visitor to /launch before the
 * redirect resolves (the group is transparent to the URL → this is /signup).
 */
export default function SignupAliasRedirect() {
  return <Redirect href="/sign-up" />;
}
