import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/tokens';
import { Text } from './ui/Text';

export interface HeroHeaderProps {
  /** Tall greeting hero (Home) vs. compact screen-title header (other tabs). */
  variant?: 'greeting' | 'compact';
  title: string;
  subtitle?: string;
}

/**
 * The landscape hero at the top of every tab: an amethyst sky over grey hills
 * and green fields, with the wordmark and title/greeting overlaid. A
 * stylized SVG placeholder for the supplied day/night hero imagery (swapped
 * in Phase 4). The dark-mode moonlit variant lands with that imagery.
 */
export function HeroHeader({ variant = 'compact', title, subtitle }: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const height = (variant === 'greeting' ? 260 : 150) + insets.top;

  // Day palette (amethyst dusk over green fields) vs. dark-mode moonlit night.
  const night = scheme === 'dark';
  const skyTop = night ? '#0B0A1A' : '#241640';
  const skyBottom = night ? '#1A1730' : '#443363';
  const hills = night ? '#2A3140' : '#4C5563';
  const fields = night ? '#14351A' : '#2F6B33';
  const base = night ? '#0E260F' : '#1F4D22';

  return (
    <View style={[styles.container, { height }]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 390 300"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="300" fill="url(#sky)" />
        {night ? <Circle cx="300" cy="70" r="26" fill="#E9E6D0" opacity={0.9} /> : null}
        {/* distant hills */}
        <Path
          d="M0 205 C 90 178 150 214 240 198 S 360 186 390 202 L390 300 L0 300 Z"
          fill={hills}
          opacity={0.9}
        />
        {/* fields */}
        <Path
          d="M0 238 C 100 222 180 252 260 236 S 360 232 390 242 L390 300 L0 300 Z"
          fill={fields}
        />
        <Rect x="0" y="278" width="390" height="22" fill={base} />
      </Svg>

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        <Text
          color="#FFFFFF"
          style={styles.wordmark}
          accessibilityRole="header"
        >
          {copy.wordmark}
        </Text>
        <View style={styles.titleBlock}>
          <Text
            variant={variant === 'greeting' ? 'display' : 'screenTitle'}
            color="#FFFFFF"
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" color="rgba(255,255,255,0.92)" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  wordmark: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '700' },
  titleBlock: {},
  subtitle: { marginTop: 4 },
});
