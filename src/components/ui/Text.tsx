import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme';
import { typography, type ThemeColors, type TypographyVariant } from '@/theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  /** A theme color token, or an explicit color string. */
  color?: keyof ThemeColors | (string & {});
}

/** Default color per type variant (design system §3). */
const defaultColorFor: Record<TypographyVariant, keyof ThemeColors> = {
  display: 'textPrimary',
  screenTitle: 'textPrimary',
  sectionLabel: 'forest',
  cardTitle: 'textPrimary',
  body: 'textPrimary',
  bodySmall: 'textPrimary',
  meta: 'textMuted',
  tag: 'amethystText',
};

export function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const tokenKey = color ?? defaultColorFor[variant];
  const resolved =
    tokenKey in colors ? colors[tokenKey as keyof ThemeColors] : (tokenKey as string);

  return (
    <RNText
      style={[typography[variant], { color: resolved }, style]}
      {...rest}
    />
  );
}
