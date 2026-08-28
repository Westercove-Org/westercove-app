import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { ResendEmailButton } from '@/features/auth/ResendEmailButton';
import { services } from '@/services';
import { HttpError } from '@/lib/http';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../../assets/images/westercove_hero_valley.jpg');

const MIN_PASSWORD = 12;

type View_ = 'checking' | 'form' | 'done' | 'expired' | 'already' | 'error';

/**
 * Paid-path onboarding landing (/welcome/:token). The emailed deep link carries
 * a single-use token in the path (Dwight's /auth/onboarding contract). We verify
 * it, then let the user set a password — POST /complete sets the Cognito password
 * AND flips email_verified, after which they can sign in. Lives in (auth) so the
 * auth guard keeps it reachable while unauthenticated.
 */
export default function WelcomeTokenScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const c = copy.onboarding;
  const { token } = useLocalSearchParams<{ token: string }>();

  const [view, setView] = useState<View_>(token ? 'checking' : 'error');
  const [emailHint, setEmailHint] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const { emailHint: hint } = await services.signup.verifyOnboardingToken(token);
        if (!active) return;
        setEmailHint(hint);
        setView('form');
      } catch (e) {
        if (!active) return;
        setView(e instanceof HttpError && e.status === 410 ? 'expired' : 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const onSetPassword = async () => {
    if (!token || password.length < MIN_PASSWORD || busy) return;
    if (!passwordsMatch) return setError(c.passwordMismatch);
    setError(null);
    setBusy(true);
    try {
      await services.signup.completeOnboarding(token, password);
      setView('done');
    } catch (e) {
      if (e instanceof HttpError && e.status === 410) return setView('expired');
      if (e instanceof HttpError && e.status === 409) return setView('already');
      // 400 = weak password: surface the server policy message and stay on the form.
      setError(e instanceof HttpError && e.message ? e.message : c.errorBody);
    } finally {
      setBusy(false);
    }
  };

  if (view === 'checking') {
    return (
      <Shell colors={colors} title={c.checkingTitle}>
        <Text variant="body" color="textMuted" accessibilityRole="alert">
          {c.checkingBody}
        </Text>
      </Shell>
    );
  }

  if (view === 'form') {
    return (
      <Shell colors={colors} title={c.setPasswordTitle}>
        <Text variant="body" color="textMuted">
          {c.settingUpFor} {emailHint}
        </Text>
        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <View style={styles.fieldBlock}>
          <Text variant="cardTitle">{c.password}</Text>
          <View style={[styles.inputBox, { borderColor: colors.line }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={c.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel={c.password}
              style={[styles.input, { color: colors.textPrimary }]}
            />
          </View>
          <Text variant="bodySmall" color="textMuted">
            {c.passwordHint}
          </Text>
        </View>
        <View style={styles.fieldBlock}>
          <Text variant="cardTitle">{c.confirmPassword}</Text>
          <View style={[styles.inputBox, { borderColor: colors.line }]}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={c.confirmPasswordPlaceholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel={c.confirmPassword}
              style={[styles.input, { color: colors.textPrimary }]}
            />
          </View>
          {confirmPassword.length > 0 && !passwordsMatch ? (
            <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
              {c.passwordMismatch}
            </Text>
          ) : null}
        </View>
        <Button
          label={busy ? c.setting : c.setPassword}
          variant="amethyst"
          loading={busy}
          disabled={password.length < MIN_PASSWORD || !passwordsMatch || busy}
          onPress={onSetPassword}
        />
      </Shell>
    );
  }

  const terminal =
    view === 'done'
      ? { title: c.doneTitle, body: c.doneBody, label: c.goToSignIn, to: '/sign-in' as const }
      : view === 'already'
        ? { title: c.alreadyTitle, body: c.alreadyBody, label: c.goToSignIn, to: '/sign-in' as const }
        : view === 'expired'
          ? { title: c.expiredTitle, body: c.expiredBody, label: c.backToSignUp, to: '/sign-up' as const }
          : { title: c.errorTitle, body: c.errorBody, label: c.backToSignUp, to: '/sign-up' as const };

  return (
    <Shell colors={colors} title={terminal.title}>
      <Text variant="body" color="textMuted">
        {terminal.body}
      </Text>
      {view === 'expired' || view === 'error' ? <ResendEmailButton /> : null}
      <Button label={terminal.label} variant="amethyst" onPress={() => router.replace(terminal.to)} />
    </Shell>
  );
}

function Shell({
  colors,
  title,
  children,
}: {
  colors: { background: string };
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={title} image={heroImage} />
      <ScrollView contentContainerStyle={styles.form}>{children}</ScrollView>
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
});
