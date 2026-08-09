import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useTheme } from '@/theme';
import { DownloadIcon } from './icons';
import { Text } from './ui/Text';

const defaultPhoto = require('../../assets/images/westercove_sunrise_mountains.jpg');
const icon = require('../../assets/images/westercove_icon.png');
const wordmark = require('../../assets/images/westercove_wordmark.png');

export interface HeroHeaderProps {
  /** Tall greeting hero (Home) vs. compact screen-title header (other tabs). */
  variant?: 'greeting' | 'compact';
  title: string;
  /** Small label under the title (e.g. "Home" on the greeting hero). */
  label?: string;
  subtitle?: string;
  /** Hero photo (require()'d asset). Defaults to the sunrise image. */
  image?: number;
}

/**
 * The photographic hero at the top of every tab: a sunrise-over-the-mountains
 * photo with a parchment gradient fading into the page, the Westercove
 * icon + wordmark top-left, and the title/greeting overlaid. Title text is
 * dark amethyst over the bright photo (light) / cream over a darkened overlay
 * (dark mode).
 */
export function HeroHeader({
  variant = 'compact',
  title,
  label,
  subtitle,
  image = defaultPhoto,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scheme, colors } = useTheme();
  // Download journal is a signed-in action; hide it on the pre-auth screens.
  const signedIn = useSessionStore((s) => !!s.session);
  const height = (variant === 'greeting' ? 280 : 170) + insets.top;

  // Fade the photo into the page: mostly transparent at the top, solid
  // background at the bottom edge so content below blends seamlessly.
  const fade =
    scheme === 'dark'
      ? (['rgba(26,23,18,0.35)', 'rgba(26,23,18,0.72)', 'rgba(26,23,18,0.96)'] as const)
      : (['rgba(246,241,231,0.18)', 'rgba(246,241,231,0.55)', 'rgba(246,241,231,0.96)'] as const);

  return (
    <View style={[styles.container, { height, backgroundColor: colors.background }]}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={fade} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Westercove">
            <Image source={icon} style={styles.icon} contentFit="contain" />
            <Image source={wordmark} style={styles.wordmark} contentFit="contain" />
          </View>
          {signedIn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download journal"
              onPress={() => router.push('/export')}
              style={[styles.download, { backgroundColor: colors.emerald }]}
            >
              <DownloadIcon size={16} color={colors.onAccent} />
              <Text variant="tag" color="onAccent" style={styles.downloadText}>
                Download journal
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View>
          <Text
            variant={variant === 'greeting' ? 'display' : 'screenTitle'}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {label ? (
            <Text variant="screenTitle" color="heading" style={styles.label}>
              {label}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="body" color="textMuted" style={styles.subtitle}>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 24, height: 22 },
  wordmark: { width: 84, height: 15 },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  downloadText: { textTransform: 'none' },
  label: { marginTop: 2 },
  subtitle: { marginTop: 4 },
});
