import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { isEmail } from '@/features/auth/email';
import { ResendEmailButton } from '@/features/auth/ResendEmailButton';
import { services } from '@/services';
import { HttpError } from '@/lib/http';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

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

  const [step, setStep] = useState<Step>('entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!validateForm()) return;
    setBusy(true);
    try {
      const { checkoutUrl } = await services.signup.startPaymentCheckout({
        email: email.trim(),
        password,
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
    if (!code.trim()) return setError(c.codePlaceholder);
    setBusy(true);
    try {
      await services.signup.orgCode({ email: email.trim(), password, code: code.trim() });
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

  const pathCard = (label: string, hint: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!canProceed}
      onPress={onPress}
      style={[styles.pathCard, { borderColor: colors.line }, !canProceed && styles.disabled]}
    >
      <Text variant="cardTitle">{label}</Text>
      <Text variant="bodySmall" color="textMuted">
        {hint}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={c.title} subtitle={subtitle} image={heroImage} />
      <ScrollView contentContainerStyle={styles.form}>
        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {step === 'entry' ? (
          <>
            {field(c.email, email, setEmail, c.emailPlaceholder, {
              autoComplete: 'email',
              keyboardType: 'email-address',
            })}
            {field(
              c.password,
              password,
              setPassword,
              c.passwordPlaceholder,
              { secureTextEntry: !showPw, autoComplete: 'new-password' },
              eyeToggle(showPw, () => setShowPw((v) => !v)),
            )}
            <Text variant="bodySmall" color="textMuted">
              {c.passwordHint}
            </Text>
            {field(
              c.confirmPassword,
              confirmPassword,
              setConfirmPassword,
              c.confirmPasswordPlaceholder,
              { secureTextEntry: !showConfirm, autoComplete: 'new-password' },
              eyeToggle(showConfirm, () => setShowConfirm((v) => !v)),
            )}
            {confirmPassword.length > 0 && !passwordsMatch ? (
              <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
                {c.passwordMismatch}
              </Text>
            ) : null}
            <Text variant="body" color="textMuted">
              {c.howToJoin}
            </Text>
            {pathCard(c.orgCodeOption, c.orgCodeOptionHint, goOrgCode)}
            {pathCard(busy ? c.payStarting : c.payOption, c.payOptionHint, goPay)}
          </>
        ) : null}

        {step === 'orgCode' ? (
          <>
            {field(c.code, code, setCode, c.codePlaceholder, { autoCapitalize: 'characters' })}
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
});
