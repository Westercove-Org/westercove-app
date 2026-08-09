import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';

const photo = require('../../../assets/images/westercove_hero_valley.jpg');
const icon = require('../../../assets/images/westercove_icon.png');
const wordmark = require('../../../assets/images/westercove_wordmark.png');

// The launch scene is always the bright valley photo, so its text/CTA are fixed
// dark amethyst regardless of the app's light/dark theme.
const AMETHYST = '#190933';
const PARCHMENT = '#F6F1E7';

/** Launch: a full-bleed valley at sunrise; logo, tagline, and Begin anchored to
 * the upper portion, matching the demo. */
export default function LaunchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(246,241,231,0.3)', 'rgba(246,241,231,0)', 'rgba(246,241,231,0.15)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 64 }]}>
        <View
          style={styles.brand}
          accessibilityRole="header"
          accessibilityLabel="Westercove"
        >
          <Image source={icon} style={styles.icon} contentFit="contain" />
          <Image source={wordmark} style={styles.wordmark} contentFit="contain" />
        </View>

        <Text variant="screenTitle" color={AMETHYST} style={styles.tagline}>
          {copy.launch.tagline}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.launch.begin}
          onPress={() => router.push('/disclaimer')}
          style={({ pressed }) => [styles.begin, pressed && { opacity: 0.9 }]}
        >
          <Text color={PARCHMENT} style={styles.beginText}>
            {copy.launch.begin}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  brand: { alignItems: 'center' },
  icon: { width: 84, height: 84 },
  wordmark: { width: 190, height: 34, marginTop: 16 },
  tagline: {
    textAlign: 'center',
    fontSize: 21,
    lineHeight: 29,
    maxWidth: 300,
    marginTop: 16,
  },
  begin: {
    backgroundColor: AMETHYST,
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  beginText: { fontSize: 17, fontWeight: '500' },
});
