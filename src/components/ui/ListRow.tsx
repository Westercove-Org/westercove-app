import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface ListRowProps {
  label: string;
  subtitle?: string;
  leading?: React.ReactNode;
  /** Show a trailing chevron (list rows in Settings, Your Space, Reading). */
  chevron?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Hairline divider below (omit on the last row). */
  divider?: boolean;
}

/** List row: left label (body-small), optional subtitle, 44pt min, hairline divider. */
export function ListRow({
  label,
  subtitle,
  leading,
  chevron = true,
  trailing,
  onPress,
  divider = true,
}: ListRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.line, borderBottomWidth: divider ? 1 : 0 },
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.textCol}>
        <Text variant="cardTitle">{label}</Text>
        {subtitle ? (
          <Text variant="bodySmall" color="textMuted" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (chevron ? <ChevronRightIcon size={20} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.cardInner,
    gap: spacing.md,
  },
  leading: { width: 28, alignItems: 'center' },
  textCol: { flex: 1 },
  subtitle: { marginTop: 2 },
});
