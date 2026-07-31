import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useProfilesStore } from '@/features/profiles/profilesStore';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

/**
 * Welcome / sign-in. This is browser-level: any name and password continue (it
 * is a demo, nothing is saved anywhere real). Both "Sign in" and "Create an
 * account" do the same thing — sign in and drop into the day-zero gate for the
 * first test profile.
 */
export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signIn = useProfilesStore((s) => s.signIn);
  const createProfile = useProfilesStore((s) => s.createProfile);
  const switchProfile = useProfilesStore((s) => s.switchProfile);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = name.trim().length > 0 && password.length > 0;

  const onContinue = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    signIn({ email: name.trim(), firstName: name.trim() });
    const { profiles, activeId } = useProfilesStore.getState();
    // First time in this browser: begin the first test profile. Returning after
    // a sign-out: land on the existing (or last active) profile.
    if (profiles.length === 0) {
      await createProfile();
    } else if (!activeId) {
      await switchProfile(profiles[0].id);
    }
    // The guard redirects to the gate or the tab shell from here.
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader
        variant="greeting"
        image="valley"
        title={copy.signIn.title}
        subtitle={copy.signIn.subtitle}
      />
      <View style={styles.form}>
        <View style={[styles.field, { borderColor: colors.line }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={copy.signIn.namePlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            accessibilityLabel={copy.signIn.name}
            style={[styles.input, { color: colors.textPrimary }]}
          />
        </View>

        <View style={[styles.field, { borderColor: colors.line }]}>
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
          >
            <Text variant="bodySmall" color="forest">
              {showPw ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: remember }}
          accessibilityLabel={copy.signIn.rememberMe}
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
          <Text variant="cardTitle">{copy.signIn.rememberMe}</Text>
        </Pressable>

        <Button
          label={copy.signIn.signIn}
          variant="primary"
          loading={busy}
          disabled={!canSubmit}
          onPress={onContinue}
        />

        <Pressable accessibilityRole="button" style={styles.center} onPress={() => {}}>
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
          loading={busy}
          disabled={!canSubmit}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, paddingHorizontal: spacing.screen, paddingTop: spacing.xl, gap: spacing.md },
  field: {
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  line: { flex: 1, height: 1 },
});
