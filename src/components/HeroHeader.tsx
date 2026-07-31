import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/tokens';
import { Text } from './ui/Text';

/** Named photographic scene for the hero (the real Westercove imagery). */
type HeroImage = 'valley' | 'hills' | 'wildflowers' | 'dusk' | 'meadow';

export interface HeroHeaderProps {
  /** Tall greeting hero (Home) vs. compact screen-title header (other tabs). */
  variant?: 'greeting' | 'compact';
  title: string;
  subtitle?: string;
  image?: HeroImage;
}

// Static requires so the bundler picks up each asset (Metro asset modules).
const HERO_SOURCES: Record<HeroImage, number> = {
  valley: require('../../assets/images/heroes/valley.jpg'),
  hills: require('../../assets/images/heroes/hills.jpg'),
  wildflowers: require('../../assets/images/heroes/wildflowers.jpg'),
  dusk: require('../../assets/images/heroes/dusk.jpg'),
  meadow: require('../../assets/images/heroes/meadow.jpg'),
};

const MARK = require('../../assets/images/westercove-mark.png');

/**
 * The photographic landscape hero at the top of every screen, with the
 * Westercove mark + serif wordmark and the title/greeting overlaid. A soft
 * top-and-bottom scrim keeps white text legible over any photo.
 */
export function HeroHeader({ variant = 'compact', title, subtitle, image = 'valley' }: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const height = (variant === 'greeting' ? 260 : 170) + insets.top;
  const dark = scheme === 'dark';

  return (
    <View style={[styles.container, { height }]}>
      <Image
        source={HERO_SOURCES[image]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        accessibilityIgnoresInvertColors
      />
      {/* Legibility scrim: darker at the very top (wordmark) and bottom (title). */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={dark ? 0.5 : 0.38} />
            <Stop offset="0.4" stopColor="#000000" stopOpacity={dark ? 0.28 : 0.12} />
            <Stop offset="1" stopColor="#000000" stopOpacity={dark ? 0.62 : 0.5} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
      </Svg>

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          <Image source={MARK} style={styles.mark} contentFit="contain" />
          <Text color="#FFFFFF" style={styles.wordmark} accessibilityRole="header">
            {copy.wordmark}
          </Text>
        </View>
        <View style={styles.titleBlock}>
          <Text
            variant={variant === 'greeting' ? 'display' : 'screenTitle'}
            color="#FFFFFF"
            accessibilityRole="header"
            style={styles.title}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" color="rgba(255,255,255,0.94)" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', backgroundColor: '#1B2A22' },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 26, height: 24 },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 6,
  },
  titleBlock: {},
  title: { textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8 },
  subtitle: { marginTop: 4, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
});
