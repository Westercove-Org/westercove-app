import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { formatFirstChargeDate } from '@/constants/billing';
import { isEmail } from '@/features/auth/email';
import { ResendEmailButton } from '@/features/auth/ResendEmailButton';
import { getWelcomeAcceptance } from '@/features/auth/welcomeAcceptance';
import { services, type PlanId, type PlanTier, type PricingResult } from '@/services';
import { HttpError } from '@/lib/http';
import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH, radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_hero_valley.jpg');

const MIN_PASSWORD = 12;

type Step = 'entry' | 'orgCode' | 'confirm' | 'payCheckEmail';

/** Enumeration-safe signup error copy: never reveal account existence. 429 =
 * rate limit; otherwise a neutral fallback (the server detail, when present, is
 * safe — invalid code / weak password). */
function signupErrorMessage(e: unknown): string {
  const c = copy.signUp;
  if (e instanceof HttpError) {
    if (e.status === 429) return c.rateLimited;
    if (e.message) return e.message;
  }
  return c.genericError;
}

/** Checkout error copy. 503 = payments off, 429 = rate limit. No 409: an
 * already-registered email returns a generic 200 with checkoutUrl:null. */
function checkoutErrorMessage(e: unknown): string {
  const c = copy.signUp;
  if (e instanceof HttpError) {
    if (e.status === 503) return c.checkoutUnavailable;
    if (e.status === 429) return c.rateLimited;
  }
  return c.checkoutError;
}

/**
 * Signup v2 (self-serve), final Option-A flow. Linked from sign-in
 * ("Create an account"). Same backend contract as the retired QuietRoom SPA;
 * Stripe uses the hosted-checkout redirect (works on Expo web, the deploy target).
 *
 * One screen collects email + password + confirm (fe-signup-merge-password);
 * the two join methods are the cards below the form. Pay starts checkout
 * straight from here; the org-code path just needs its one code field next.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const c = copy.signUp;
  // Per-org sign-up link pre-fills the access code (R-17): the link and the
  // typed code are two doors into the same org-code path. We only pre-fill the
  // field — the member still enters their email/password and taps Join, so a
  // link never auto-submits anything.
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();

  const [step, setStep] = useState<Step>('entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState(codeParam ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trial pricing for the pre-card disclosure — fetched live (Stripe test/live
  // differ, so it is never hardcoded). `undefined` = still loading; `null` = the
  // endpoint failed (503, no fallback by design) → show no price and block the
  // paid path. The org-code path is unaffected.
  const [pricing, setPricing] = useState<PricingResult | null | undefined>(undefined);
  // Which plan the user is paying for. Defaults to monthly, matching the server's
  // default, so an untouched selector and the checkout agree.
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('standard_monthly');

  // Return-key focus chaining across the merged form (email -> password -> confirm).
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    let alive = true;
    services.signup
      .getPricing()
      .then((p) => alive && setPricing(p))
      .catch(() => alive && setPricing(null));
    return () => {
      alive = false;
    };
  }, []);

  const emailValid = isEmail(email);
  const passwordValid = password.length >= MIN_PASSWORD;
  const passwordsMatch = password === confirmPassword;
  // Both join methods need a valid email + matching password before proceeding.
  const canProceed = emailValid && passwordValid && passwordsMatch && !busy;
  const canJoin = canProceed && code.trim().length > 0;

  /** Guard shared by both paths before leaving the merged form. */
  const validateForm = (): boolean => {
    if (!emailValid) return setError(c.invalidEmail), false;
    if (!passwordValid) return setError(c.passwordHint), false;
    if (!passwordsMatch) return setError(c.passwordMismatch), false;
    return true;
  };

  const goOrgCode = () => {
    setError(null);
    if (!validateForm()) return;
    setStep('orgCode');
  };

  // Paid path collects the password up front (mirrors org-code); the checkout
  // POST sets it in Cognito, and the emailed link only verifies. Checkout starts
  // straight from the merged form — no intermediate password screen.
  const goPay = async () => {
    setError(null);
    // Never start checkout without live pricing on screen (the card is already
    // disabled in this state; this is a belt-and-braces guard).
    if (!pricing) return;
    if (!validateForm()) return;
    setBusy(true);
    try {
      const { checkoutUrl } = await services.signup.startPaymentCheckout({
        email: email.trim(),
        password,
        plan: selectedPlan,
        // Carry the S0 welcome-notice acceptance so the server records it against
        // the new account (optional + fail-soft; re-asked in-app if absent).
        acceptedNoticeVersion: (await getWelcomeAcceptance())?.version,
      });
      if (checkoutUrl === null) {
        // Already-registered (enumeration-safe): generic check-email, no redirect.
        setStep('payCheckEmail');
        setBusy(false);
        return;
      }
      // Hosted-checkout redirect. On web, same-tab navigation (Linking.openURL
      // maps to window.open → a NEW tab, so Stripe's return would land in a
      // detached tab and the app tab would stay stale). Stripe returns to
      // /signup/return?status=&pending_signup_id= (Stripe return URL, #55).
      if (Platform.OS === 'web') {
        window.location.assign(checkoutUrl);
      } else {
        await Linking.openURL(checkoutUrl);
      }
    } catch (e) {
      setError(checkoutErrorMessage(e));
      setBusy(false);
    }
  };

  const onJoin = async () => {
    setError(null);
    if (!validateForm()) return;
    if (!code.trim()) return setError(c.codeRequired);
    setBusy(true);
    try {
      await services.signup.orgCode({
        email: email.trim(),
        password,
        code: code.trim(),
        acceptedNoticeVersion: (await getWelcomeAcceptance())?.version,
      });
      setStep('confirm');
    } catch (e) {
      setError(signupErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const subtitle =
    step === 'orgCode' ? c.orgCodeSubtitle : step === 'entry' ? c.entrySubtitle : undefined;

  const field = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    placeholder: string,
    extra?: object,
    trailing?: React.ReactNode,
  ) => (
    <View style={styles.fieldBlock}>
      <Text variant="cardTitle">{label}</Text>
      <View style={[styles.inputBox, { borderColor: colors.line }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          accessibilityLabel={label}
          style={[styles.input, { color: colors.textPrimary }]}
          {...extra}
        />
        {trailing}
      </View>
    </View>
  );

  /** Show/hide eye toggle, one per password field (independent state). */
  const eyeToggle = (shown: boolean, onToggle: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shown ? 'Hide password' : 'Show password'}
      onPress={onToggle}
      hitSlop={8}
    >
      {shown ? (
        <EyeOffIcon size={20} color={colors.textMuted} />
      ) : (
        <EyeIcon size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );

  const pathCard = (label: string, hint: string, onPress: () => void, extraDisabled = false) => {
    const disabled = !canProceed || extraDisabled;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        style={[styles.pathCard, { borderColor: colors.line }, disabled && styles.disabled]}
      >
        <Text variant="cardTitle">{label}</Text>
        <Text variant="bodySmall" color="textMuted">
          {hint}
        </Text>
      </Pressable>
    );
  };

  /** Plan grid, shown once pricing has loaded (all four plans present on a 200).
   * Grouped by tier, monthly before annual within each; monthly is preselected
   * so a grieving person is never defaulted into the larger annual charge (R-2).
   * Renders each plan's server-formatted `display` verbatim — no computed price —
   * with a static annual framing caption. */
  const planSelector = () => {
    if (!pricing) return null;
    const tiers: { tier: PlanTier; label: string }[] = [
      { tier: 'standard', label: c.planStandard },
      { tier: 'premium', label: c.planPremium },
    ];
    return (
      <View style={styles.fieldBlock}>
        <Text variant="cardTitle">{c.choosePlan}</Text>
        {tiers.map(({ tier, label }) => {
          // Monthly before annual within the tier.
          const plans = pricing.plans
            .filter((p) => p.tier === tier)
            .sort(
              (a, b) => (a.interval === 'month' ? -1 : 1) - (b.interval === 'month' ? -1 : 1),
            );
          if (plans.length === 0) return null;
          return (
            <View key={tier} style={styles.tierGroup}>
              <Text variant="sectionLabel" color="textMuted">
                {label}
              </Text>
              <View style={styles.planRow}>
                {plans.map((p) => {
                  const active = p.plan === selectedPlan;
                  const annual = p.interval === 'year';
                  const intervalLabel = annual ? c.planAnnual : c.planMonthly;
                  return (
                    <Pressable
                      key={p.plan}
                      onPress={() => setSelectedPlan(p.plan)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${label} ${intervalLabel}, ${p.display}${
                        annual ? `, ${c.annualCaption}` : ''
                      }`}
                      style={[
                        styles.planCard,
                        {
                          borderColor: active ? colors.forest : colors.line,
                          backgroundColor: colors.card,
                        },
                        active && styles.planCardActive,
                      ]}
                    >
                      <Text variant="cardTitle" color={active ? 'forest' : 'textPrimary'}>
                        {intervalLabel}
                      </Text>
                      <Text variant="bodySmall" color="textMuted">
                        {p.display}
                      </Text>
                      {annual ? (
                        <Text variant="bodySmall" color="forest">
                          {c.annualCaption}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  /** Trial disclosure shown above the pay card, before card entry (the card is
   * entered on Stripe's hosted page). The amount tracks the SELECTED plan; the
   * trial length and first-charge date are plan-independent and shown once. On a
   * pricing failure we show no number and the pay card is disabled (never a
   * guessed price on a pre-charge screen). */
  const trialDisclosure = () => {
    if (pricing === undefined) return null; // still loading
    if (pricing === null) {
      return (
        <View style={[styles.trialBox, { borderColor: colors.line, backgroundColor: colors.card }]}>
          <Text variant="bodySmall" color="textPrimary">
            {c.trialUnavailable}
          </Text>
        </View>
      );
    }
    // Key off the plan field, not index, so a server reorder can't swap what the
    // user is agreeing to. Fallback to the first plan is defensive only.
    const sel = pricing.plans.find((p) => p.plan === selectedPlan) ?? pricing.plans[0];
    return (
      <View style={[styles.trialBox, { borderColor: colors.line, backgroundColor: colors.card }]}>
        <Text variant="cardTitle">{`Free for ${pricing.trialDays} days`}</Text>
        <Text variant="bodySmall" color="textMuted">
          {`You will not be charged today. After your ${pricing.trialDays}-day free trial, Westercove is ${sel.display}. Your card will first be charged on ${formatFirstChargeDate(pricing.firstChargeDate)}. Cancel any time before then and you will not be charged.`}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={c.title} subtitle={subtitle} image={heroImage} />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {step === 'entry' ? (
          <>
            {/* Entry fields inlined (not via field()) so the return-key focus
                handlers read refs as trusted JSX event handlers. */}
            <View style={styles.fieldBlock}>
              <Text variant="cardTitle">{c.email}</Text>
              <View style={[styles.inputBox, { borderColor: colors.line }]}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={c.emailPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoFocus
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel={c.email}
                  style={[styles.input, { color: colors.textPrimary }]}
                />
              </View>
            </View>
            <View style={styles.fieldBlock}>
              <Text variant="cardTitle">{c.password}</Text>
              <View style={[styles.inputBox, { borderColor: colors.line }]}>
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={c.passwordPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  secureTextEntry={!showPw}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  accessibilityLabel={c.password}
                  style={[styles.input, { color: colors.textPrimary }]}
                />
                {eyeToggle(showPw, () => setShowPw((v) => !v))}
              </View>
            </View>
            <Text variant="bodySmall" color="textMuted">
              {c.passwordHint}
            </Text>
            <View style={styles.fieldBlock}>
              <Text variant="cardTitle">{c.confirmPassword}</Text>
              <View style={[styles.inputBox, { borderColor: colors.line }]}>
                <TextInput
                  ref={confirmRef}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={c.confirmPasswordPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  accessibilityLabel={c.confirmPassword}
                  style={[styles.input, { color: colors.textPrimary }]}
                />
                {eyeToggle(showConfirm, () => setShowConfirm((v) => !v))}
              </View>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch ? (
              <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
                {c.passwordMismatch}
              </Text>
            ) : null}
            <Text variant="body" color="textMuted">
              {c.howToJoin}
            </Text>
            {pathCard(c.orgCodeOption, c.orgCodeOptionHint, goOrgCode)}
            {planSelector()}
            {trialDisclosure()}
            {/* Pay is blocked until pricing loads (or if it failed) so the user
                never reaches card entry without the trial terms in front of them. */}
            {pathCard(busy ? c.payStarting : c.payOption, c.payOptionHint, goPay, pricing == null)}
          </>
        ) : null}

        {step === 'orgCode' ? (
          <>
            {field(c.code, code, setCode, c.codePlaceholder, {
              autoCapitalize: 'characters',
              autoFocus: true,
              returnKeyType: 'go',
              onSubmitEditing: () => {
                if (canJoin) onJoin();
              },
            })}
            <Button
              label={busy ? c.joining : c.join}
              variant="amethyst"
              loading={busy}
              disabled={!canJoin}
              onPress={onJoin}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={c.back}
              onPress={() => {
                setError(null);
                setStep('entry');
              }}
              style={styles.center}
            >
              <Text variant="body" color="textMuted">
                {c.back}
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === 'confirm' || step === 'payCheckEmail' ? (
          <>
            <Text variant="body">
              {step === 'confirm' ? c.confirmBody : c.payCheckEmailBody}
            </Text>
            <ResendEmailButton email={email} />
            <Button
              label={c.goToSignIn}
              variant="amethyst"
              onPress={() => router.replace('/sign-in')}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    // One consistent desktop width: the same centered 640 column the tab app
    // uses (components/Screen.tsx), so signup no longer stretches edge-to-edge.
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.lg,
  },
  fieldBlock: { gap: spacing.sm },
  trialBox: {
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
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
  pathCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  disabled: { opacity: 0.45 },
  center: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  tierGroup: { gap: spacing.sm, marginTop: spacing.sm },
  planRow: { flexDirection: 'row', gap: spacing.sm },
  planCard: {
    flex: 1,
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  // Active plan reads as selected without shifting layout (border already 1px).
  planCardActive: { borderWidth: 2, paddingHorizontal: spacing.lg - 1, paddingVertical: spacing.md - 1 },
});
