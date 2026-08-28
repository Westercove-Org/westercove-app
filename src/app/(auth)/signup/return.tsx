import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { isSignupSuccessStatus, services } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const heroImage = require('../../../../assets/images/westercove_hero_valley.jpg');

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 24; // ~60s

type View_ = 'cancelled' | 'polling' | 'success' | 'expired' | 'error' | 'slow';

/**
 * Stripe Checkout return handler (paid path). Stripe redirects back to
 * /signup/return?status=success|cancelled&pending_signup_id=… (#55) — the path
 * must match the backend SIGNUP_CHECKOUT_SUCCESS_URL/_CANCEL_URL base. We read
 * the opaque pending_signup_id from the query and poll the status endpoint —
 * nothing depends on the pre-redirect screen state surviving. Poll while
 * "awaiting_payment" (webhook can lag the redirect), stop on "expired" (which
 * an unknown token also returns, #58) or any other terminal value (success).
 */
export default function SignUpReturnScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const c = copy.signUpReturn;
  const params = useLocalSearchParams<{ status?: string; pending_signup_id?: string }>();
  const status = params.status;
  const pendingSignupId = params.pending_signup_id;

  const [view, setView] = useState<View_>(
    status === 'cancelled' ? 'cancelled' : pendingSignupId ? 'polling' : 'error',
  );
  const pollsRef = useRef(0);

  useEffect(() => {
    if (view !== 'polling' || !pendingSignupId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      pollsRef.current += 1;
      try {
        const { status: s } = await services.signup.getStatus(pendingSignupId);
        if (!active) return;
        if (s === 'expired') return setView('expired');
        if (isSignupSuccessStatus(s)) return setView('success');
        // still awaiting_payment → keep polling until the cap.
      } catch {
        if (!active) return;
        if (pollsRef.current >= MAX_POLLS) return setView('error');
      }
      if (!active) return;
      if (pollsRef.current >= MAX_POLLS) return setView('slow');
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [view, pendingSignupId]);

  const screen: Record<
    View_,
    { title: string; body: string; label: string; to: '/sign-in' | '/sign-up' }
  > = {
    polling: { title: c.confirmingTitle, body: c.confirmingBody, label: c.goToSignIn, to: '/sign-in' },
    success: { title: c.successTitle, body: c.successBody, label: c.goToSignIn, to: '/sign-in' },
    cancelled: { title: c.cancelledTitle, body: c.cancelledBody, label: c.backToSignUp, to: '/sign-up' },
    expired: { title: c.expiredTitle, body: c.expiredBody, label: c.backToSignUp, to: '/sign-up' },
    slow: { title: c.slowTitle, body: c.slowBody, label: c.goToSignIn, to: '/sign-in' },
    error: { title: c.errorTitle, body: c.errorBody, label: c.backToSignUp, to: '/sign-up' },
  };
  const s = screen[view];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={s.title} image={heroImage} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text variant="body" color="textMuted" accessibilityRole={view === 'polling' ? 'alert' : undefined}>
          {s.body}
        </Text>
        {view === 'polling' ? null : (
          <Button label={s.label} variant="amethyst" onPress={() => router.replace(s.to)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.lg,
  },
});
