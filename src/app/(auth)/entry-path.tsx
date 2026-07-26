import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import type { EntryPath } from '@/features/auth/types';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

export default function EntryPathScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const beginAccount = useSessionStore((s) => s.beginAccount);
  const [path, setPath] = useState<EntryPath | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const canContinue =
    path === 'consumer_trial' || (path === 'partner_license' && code.trim().length > 0);

  const onContinue = async () => {
    if (!path || busy) return;
    setBusy(true);
    // The auth guard redirects to the day-zero gate once the session exists.
    await beginAccount({
      entryPath: path,
      licenseCode: path === 'partner_license' ? code.trim() : undefined,
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.huge }]}>
      <View style={styles.content}>
        <Text variant="display" accessibilityRole="header">
          {copy.entryPath.title}
        </Text>

        <Option
          title={copy.entryPath.consumer}
          subtitle={copy.entryPath.consumerSub}
          selected={path === 'consumer_trial'}
          onPress={() => setPath('consumer_trial')}
        />
        <Option
          title={copy.entryPath.license}
          subtitle={copy.entryPath.licenseSub}
          selected={path === 'partner_license'}
          onPress={() => setPath('partner_license')}
        />

        {path === 'partner_license' ? (
          <View style={styles.licenseBlock}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={copy.entryPath.licensePlaceholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              accessibilityLabel={copy.entryPath.licensePlaceholder}
              style={[
                styles.input,
                { borderColor: colors.line, color: colors.textPrimary },
              ]}
            />
            <Text variant="bodySmall" color="textMuted" style={styles.privacy}>
              {copy.entryPath.licensePrivacy}
            </Text>
          </View>
        ) : null}
      </View>

      <Button
        label={copy.entryPath.continue}
        disabled={!canContinue}
        loading={busy}
        onPress={onContinue}
      />
    </View>
  );
}

function Option({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: selected ? colors.forest : colors.line },
        selected && { borderWidth: 2 },
      ]}
    >
      <Text variant="cardTitle">{title}</Text>
      <Text variant="bodySmall" color="textMuted" style={styles.optionSub}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  content: { gap: spacing.md },
  option: {
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.cardInner,
    minHeight: 44,
  },
  optionSub: { marginTop: 2 },
  licenseBlock: { gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    fontSize: 15,
  },
  privacy: { paddingHorizontal: spacing.xs },
});
