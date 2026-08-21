import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { AuthError, services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_hero_valley.jpg');

/** Cognito forgot-password: request a reset code, then set a new password with
 * it. The two steps live in one screen, flipped by `sent`. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const c = copy.forgotPassword;

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messageFor = (e: unknown) => (e instanceof AuthError ? e.message : c.genericError);

  const onSend = async () => {
    if (email.trim().length === 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      await services.auth.forgotPassword(email.trim());
      setSent(true);
      setNotice(c.sent);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (code.trim().length === 0 || newPassword.length < 8 || busy) return;
    setError(null);
    setBusy(true);
    try {
      await services.auth.confirmForgotPassword(email.trim(), code.trim(), newPassword);
      setNotice(c.done);
      router.replace('/sign-in');
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    placeholder: string,
    extra?: object,
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
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader
        variant="compact"
        title={c.title}
        subtitle={sent ? c.confirmSubtitle : c.requestSubtitle}
        image={heroImage}
      />
      <ScrollView contentContainerStyle={styles.form}>
        {field(c.email, email, setEmail, c.emailPlaceholder, {
          editable: !sent,
          autoComplete: 'email',
          keyboardType: 'email-address',
        })}

        {sent ? (
          <>
            {field(c.code, code, setCode, c.codePlaceholder, { keyboardType: 'number-pad' })}
            {field(c.newPassword, newPassword, setNewPassword, c.newPasswordPlaceholder, {
              secureTextEntry: true,
            })}
            <Text variant="bodySmall" color="textMuted">
              {c.newPasswordHint}
            </Text>
          </>
        ) : null}

        {notice ? (
          <Text variant="bodySmall" color="textMuted" accessibilityRole="alert">
            {notice}
          </Text>
        ) : null}
        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Button
          label={sent ? c.submit : c.send}
          variant="amethyst"
          loading={busy}
          onPress={sent ? onSubmit : onSend}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={c.back}
          onPress={() => router.replace('/sign-in')}
          style={styles.center}
        >
          <Text variant="body" color="textMuted">
            {c.back}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: 88, gap: spacing.lg },
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
  center: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
