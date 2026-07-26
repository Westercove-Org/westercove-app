import { View, type DimensionValue } from 'react-native';

import { useTheme } from '@/theme';
import { radii } from '@/theme/tokens';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/**
 * Static placeholder box for loading states. Deliberately un-animated: the
 * app honors reduce-motion and avoids anything auto-playing, and a still
 * skeleton is calmer than a shimmer for a grieving user.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = radii.chip,
}: SkeletonProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt }}
    />
  );
}
