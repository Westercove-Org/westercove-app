import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';
import { cardElevation, radii, spacing } from '@/theme/tokens';

export interface CardProps extends ViewProps {
  /** Use the amethyst-tint reflective fill (hard-date card, locked card). */
  reflective?: boolean;
  padded?: boolean;
}

/** Card: card fill, 1px line + soft shadow (light) / border-only (dark), radius 14. */
export function Card({
  reflective = false,
  padded = true,
  style,
  ...rest
}: CardProps) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: reflective ? colors.amethystTint : colors.card,
          borderRadius: radii.card,
          padding: padded ? spacing.cardInner : 0,
        },
        cardElevation(scheme),
        style,
      ]}
      {...rest}
    />
  );
}
