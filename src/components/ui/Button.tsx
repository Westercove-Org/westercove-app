import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';

import { useTheme } from '@/theme';
import { radii } from '@/theme/tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'amethyst';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Primary: emerald fill, white label. Secondary: transparent, 1.5pt emerald
 * border. Amethyst: the deep-amethyst pre-auth Sign in button. Height 44,
 * radius 12; pressed dims 8% with no bounce; disabled 40% opacity; loading
 * shows an inline spinner with the label hidden (handoff §5.1–5.2).
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const fill =
    variant === 'primary'
      ? colors.emerald
      : variant === 'amethyst'
        ? colors.amethystText
        : 'transparent';
  const labelColor = variant === 'secondary' ? colors.emerald : colors.onAccent;
  const border =
    variant === 'secondary'
      ? { borderWidth: 1.5, borderColor: colors.emerald }
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        border,
        { backgroundColor: fill, borderRadius: radii.button },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View>
          <Text variant="cardTitle" color={labelColor} style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontWeight: '600' },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.4 },
});
