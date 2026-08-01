import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { DEMO_PERSONAS } from '@/features/auth/demoPersonas';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signIn = useSessionStore((s) => s.signIn);
  const signInDemo = useSessionStore((s) => s.signInDemo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saveEmail, setSaveEmail] = useState(true);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const onSignIn = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    await signIn(email.trim(), password);
    // Guard redirects to the tab shell once the session is ready.
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader
        variant="greeting"
        title={copy.signIn.title}
        subtitle={copy.signIn.subtitle}
      />
      <View style={styles.form}>
        <View style={[styles.field, { borderColor: colors.line }]}>
          <Text variant="cardTitle" style={styles.fieldLabel}>
            {copy.signIn.email}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={copy.signIn.emailPlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel={copy.signIn.email}
            style={[styles.input, { color: colors.textPrimary }]}
          />
        </View>

        <View style={[styles.field, { borderColor: colors.line }]}>
          <Text variant="cardTitle" style={styles.fieldLabel}>
            {copy.signIn.password}
          </Text>
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
          accessibilityState={{ checked: saveEmail }}
          accessibilityLabel={copy.signIn.saveEmail}
          onPress={() => setSaveEmail((v) => !v)}
          style={styles.saveRow}
        >
          <View
            style={[
              styles.switch,
              { backgroundColor: saveEmail ? colors.forest : colors.line },
            ]}
          >
            <View style={[styles.knob, saveEmail && styles.knobOn]} />
          </View>
          <Text variant="cardTitle">{copy.signIn.saveEmail}</Text>
        </Pressable>

        <Button
          label={copy.signIn.signIn}
          variant="amethyst"
          loading={busy}
          disabled={!canSubmit}
          onPress={onSignIn}
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
          onPress={() => router.push('/disclaimer')}
        />
        <Text variant="bodySmall" color="textMuted" style={styles.center}>
          {copy.signIn.createHint}
        </Text>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.line }]} />
          <Text variant="bodySmall" color="textMuted">
            {copy.signIn.demo}
          </Text>
          <View style={[styles.line, { backgroundColor: colors.line }]} />
        </View>
        {DEMO_PERSONAS.map((persona) => (
          <Button
            key={persona.id}
            label={`Continue as ${persona.fullName}`}
            variant="secondary"
            onPress={() => signInDemo(persona.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, gap: spacing.md },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  fieldLabel: {},
  input: { flex: 1, fontSize: 15, minHeight: 48 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  knobOn: { alignSelf: 'flex-end' },
  center: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  line: { flex: 1, height: 1 },
});
