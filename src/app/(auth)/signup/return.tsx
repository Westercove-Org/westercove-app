import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { TRIAL_DAYS, formatFirstChargeDate } from '@/constants/billing';
import { ResendEmailButton } from '@/features/auth/ResendEmailButton';
import { isSignupSuccessStatus, services, type PricingResult } from '@/services';
import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH, radii, spacing } from '@/theme/tokens';

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
  // Account email from the status poll (never from the URL — PII). Prefills and
  // locks the field on success so the user can just Resend or sign in.
  const [email, setEmail] = useState<string | null>(null);
  // Day-0 trial-end date, from the SAME server pricing endpoint the signup screen
  // uses (server-computed, never the device clock). Undefined until it loads / if
  // it fails — the confirmation then states the trial length without a date rather
  // than a client-clock estimate. (This screen is pre-auth, so it cannot read the
  // authoritative Stripe trial_end; that is the authed Settings screen's job.)
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const pollsRef = useRef(0);

  useEffect(() => {
    let alive = true;
    services.signup
      .getPricing()
      .then((p) => alive && setPricing(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (view !== 'polling' || !pendingSignupId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      pollsRef.current += 1;
      try {
        const { status: s, email: e } = await services.signup.getStatus(pendingSignupId);
        if (!active) return;
        if (e) setEmail(e);
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

  // On success the trial has started and NOTHING was charged — say so plainly,
  // instead of "your payment went through". Show the server day-0 trial-end date
  // when it loaded; otherwise state the length without a date (never a client
  // estimate). The price is shown at signup, not restated here.
  const trialDays = pricing?.trialDays ?? TRIAL_DAYS;
  const untilDate = pricing ? ` Your trial runs until ${formatFirstChargeDate(pricing.firstChargeDate)}.` : '';
  const body =
    view === 'success'
      ? `Your ${trialDays}-day free trial has started, and you have not been charged.${untilDate} We have sent a verification email to confirm your address — open it, then sign in.`
      : s.body;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={s.title} image={heroImage} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text variant="body" color="textMuted" accessibilityRole={view === 'polling' ? 'alert' : undefined}>
          {body}
        </Text>
        {email ? (
          <View style={styles.fieldBlock}>
            <Text variant="cardTitle">{c.emailLabel}</Text>
            <View style={[styles.inputBox, { borderColor: colors.line, backgroundColor: colors.card }]}>
              <TextInput
                value={email}
                editable={false}
                accessibilityLabel={c.emailLabel}
                style={[styles.input, { color: colors.textMuted }]}
              />
            </View>
          </View>
        ) : null}
        {view === 'success' || view === 'slow' || view === 'error' ? (
          <ResendEmailButton email={email ?? undefined} />
        ) : null}
        {view === 'polling' ? null : (
          <Button label={s.label} variant="amethyst" onPress={() => router.replace(s.to)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    // Consistent desktop width — the centered 640 column (see components/Screen.tsx).
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.lg,
  },
  fieldBlock: { gap: spacing.sm },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  input: { flex: 1, fontSize: 15, minHeight: 48 },
});
