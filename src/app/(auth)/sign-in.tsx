import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EyeIcon, EyeOffIcon, PadlockIcon, PersonIcon } from '@/components/icons';
import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { resolveDemoProfile } from '@/features/profile/demoProfiles';
import { useProfilesStore } from '@/features/profile/profilesStore';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_hero_valley.jpg');

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signIn = useSessionStore((s) => s.signIn);
  const setFullName = useSessionStore((s) => s.setFullName);
  const signInAs = useProfilesStore((s) => s.signInAs);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && password.length > 0;

  const onSignIn = async () => {
    if (!canSubmit || busy) return;
    // Sign-in is by test-profile name: it resumes that person's saved data, so
    // an unrecognized name must not silently open someone else's profile.
    const profile = resolveDemoProfile(name);
    if (!profile) {
      setError(copy.signIn.unknownName);
      return;
    }
    setError(null);
    setBusy(true);
    await signInAs(profile);
    await signIn(profile.name, password);
    setFullName(profile.fullName);
    // Guard redirects to the tab shell once the session is ready.
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader
        variant="compact"
        title={copy.signIn.title}
        subtitle={copy.signIn.subtitle}
        image={heroImage}
      />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.fieldBlock}>
          <Text variant="cardTitle">{copy.signIn.email}</Text>
          <View style={[styles.inputBox, { borderColor: colors.line }]}>
            <PersonIcon size={18} color={colors.textMuted} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={copy.signIn.emailPlaceholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              accessibilityLabel={copy.signIn.email}
              style={[styles.input, { color: colors.textPrimary }]}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text variant="cardTitle">{copy.signIn.password}</Text>
          <View style={[styles.inputBox, { borderColor: colors.line }]}>
            <PadlockIcon size={18} color={colors.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={copy.signIn.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPw}
              accessibilityLabel={copy.signIn.password}
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
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: remember }}
          accessibilityLabel={copy.signIn.saveEmail}
          onPress={() => setRemember((v) => !v)}
          style={styles.saveRow}
        >
          <View
            style={[
              styles.switch,
              { backgroundColor: remember ? colors.forest : colors.line },
            ]}
          >
            <View style={[styles.knob, remember && styles.knobOn]} />
          </View>
          <Text variant="cardTitle">{copy.signIn.saveEmail}</Text>
        </Pressable>

        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Button
          label={copy.signIn.signIn}
          variant="amethyst"
          loading={busy}
          disabled={!canSubmit}
          onPress={onSignIn}
        />

        {/* No password to recover yet: the demo signs in on a name, so this
            follows the same path rather than sitting dead under the finger. */}
        <Pressable accessibilityRole="button" style={styles.center} onPress={onSignIn}>
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

        <Button
          label={copy.signIn.create}
          variant="secondary"
          onPress={() => router.push('/entry-path')}
        />
        <Text variant="bodySmall" color="textMuted" style={styles.center}>
          {copy.signIn.createHint}
        </Text>

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
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  knobOn: { alignSelf: 'flex-end' },
  center: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1 },
});
