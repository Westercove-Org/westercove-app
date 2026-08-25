import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EyeIcon, EyeOffIcon, PadlockIcon, PersonIcon } from '@/components/icons';
import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { isEmail } from '@/features/auth/email';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useProfilesStore } from '@/features/profile/profilesStore';
import { AuthError, NewPasswordRequiredError } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_hero_valley.jpg');

/** Sign-in with real Cognito SRP. Invited users hit a NEW_PASSWORD_REQUIRED
 * challenge on first login, which flips this screen into "set a password". */
export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signIn = useSessionStore((s) => s.signIn);
  const completeNewPassword = useSessionStore((s) => s.completeNewPassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSignIn = isEmail(email) && password.length > 0;
  const canSetPassword = newPassword.length >= 12;

  const messageFor = (e: unknown) =>
    e instanceof AuthError ? e.message : copy.signIn.genericError;

  const onSignIn = async () => {
    if (!canSignIn || busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // First real sign-in wipes any leftover demo/seed data and starts clean.
      useProfilesStore.getState().startRealUser();
      // Guard redirects to the tab shell once the session is ready.
    } catch (e) {
      if (e instanceof NewPasswordRequiredError) {
        setNeedsNewPassword(true);
      } else {
        setError(messageFor(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const onSetPassword = async () => {
    if (!canSetPassword || busy) return;
    setError(null);
    setBusy(true);
    try {
      await completeNewPassword(email.trim(), newPassword);
      useProfilesStore.getState().startRealUser();
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader
        variant="compact"
        title={copy.signIn.title}
        subtitle={needsNewPassword ? copy.signIn.newPasswordSubtitle : copy.signIn.subtitle}
        image={heroImage}
      />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.fieldBlock}>
          <Text variant="cardTitle">{copy.signIn.email}</Text>
          <View style={[styles.inputBox, { borderColor: colors.line }]}>
            <PersonIcon size={18} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={!needsNewPassword}
              placeholder={copy.signIn.emailPlaceholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              accessibilityLabel={copy.signIn.email}
              style={[styles.input, { color: colors.textPrimary }]}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text variant="cardTitle">
            {needsNewPassword ? copy.signIn.newPassword : copy.signIn.password}
          </Text>
          <View style={[styles.inputBox, { borderColor: colors.line }]}>
            <PadlockIcon size={18} color={colors.textMuted} />
            <TextInput
              value={needsNewPassword ? newPassword : password}
              onChangeText={needsNewPassword ? setNewPassword : setPassword}
              placeholder={
                needsNewPassword
                  ? copy.signIn.newPasswordPlaceholder
                  : copy.signIn.passwordPlaceholder
              }
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              accessibilityLabel={needsNewPassword ? copy.signIn.newPassword : copy.signIn.password}
              style={[styles.input, { color: colors.textPrimary }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
              onPress={() => setShowPw((v) => !v)}
              hitSlop={8}
            >
              {showPw ? (
                <EyeOffIcon size={20} color={colors.textMuted} />
              ) : (
                <EyeIcon size={20} color={colors.textMuted} />
              )}
            </Pressable>
          </View>
          {needsNewPassword ? (
            <Text variant="bodySmall" color="textMuted">
              {copy.signIn.newPasswordHint}
            </Text>
          ) : null}
        </View>

        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {needsNewPassword ? (
          <Button
            label={copy.signIn.setPassword}
            variant="amethyst"
            loading={busy}
            disabled={!canSetPassword}
            onPress={onSetPassword}
          />
        ) : (
          <>
            <Button
              label={copy.signIn.signIn}
              variant="amethyst"
              loading={busy}
              disabled={!canSignIn}
              onPress={onSignIn}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.signIn.forgot}
              style={styles.center}
              onPress={() => router.push('/forgot-password' as never)}
            >
              <Text variant="bodySmall" color="textMuted">
                {copy.signIn.forgot}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: colors.line }]} />
              <Text variant="bodySmall" color="textMuted">
                {copy.signIn.newHere}
              </Text>
              <View style={[styles.line, { backgroundColor: colors.line }]} />
            </View>
            <Text variant="bodySmall" color="textMuted" style={styles.center}>
              {copy.signIn.inviteOnly}
            </Text>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.signIn.back}
          onPress={() => router.back()}
          style={styles.center}
        >
          <Text variant="body" color="textMuted">
            {copy.signIn.back}
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1 },
});
