import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { isEmail } from '@/features/auth/email';
import { HttpError } from '@/lib/http';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const COOLDOWN_MS = 30_000; // debounce re-sends against the shared 429 limiter.

/**
 * Resend-onboarding-email affordance for the "check your email" screens. The
 * resend endpoint is enumeration-safe (always 200, no account-exists signal),
 * so we only ever show a generic confirmation. When the email is already known
 * (org-code confirm / paid check-email screens) pass it as a prop and we render
 * just the button; on the token/return screens the user has no email in hand,
 * so we collect one. Post-send cooldown avoids tripping the rate limiter.
 */
export function ResendEmailButton({ email }: { email?: string }) {
  const { colors } = useTheme();
  const c = copy.resend;
  const knownEmail = email?.trim() ?? '';
  const hasEmail = isEmail(knownEmail);

  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooling, setCooling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const target = hasEmail ? knownEmail : value.trim();

  const onResend = async () => {
    if (busy || cooling) return;
    if (!isEmail(target)) return setError(c.invalidEmail);
    setError(null);
    setBusy(true);
    try {
      await services.signup.resendOnboardingEmail(target);
      setSent(true);
      setCooling(true);
      timer.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
    } catch (e) {
      setError(e instanceof HttpError && e.status === 429 ? c.rateLimited : c.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="bodySmall" color="textMuted">
        {c.prompt}
      </Text>

      {hasEmail ? null : (
        <View style={[styles.inputBox, { borderColor: colors.line }]}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={c.emailPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            accessibilityLabel={c.email}
            style={[styles.input, { color: colors.textPrimary }]}
          />
        </View>
      )}

      {sent ? (
        <Text variant="bodySmall" color="textMuted" accessibilityRole="alert">
          {c.sent}
        </Text>
      ) : null}
      {error ? (
        <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Button
        label={busy ? c.sending : c.button}
        variant="secondary"
        loading={busy}
        disabled={busy || cooling || (!hasEmail && !isEmail(value))}
        onPress={onResend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
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
