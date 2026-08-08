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
// dark amethyst on white regardless of the app's light/dark theme.
const AMETHYST = '#190933';

/** Launch: a full-bleed valley at sunrise, the wordmark, and a single Begin path. */
export default function LaunchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(246,241,231,0.3)', 'rgba(246,241,231,0)', 'rgba(246,241,231,0.2)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Westercove">
          <Image source={icon} style={styles.icon} contentFit="contain" />
          <Image source={wordmark} style={styles.wordmark} contentFit="contain" />
          <Text variant="display" color={AMETHYST} style={styles.tagline}>
            {copy.launch.tagline}
          </Text>
        </View>

        <View style={styles.beginWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.launch.begin}
            onPress={() => router.push('/disclaimer')}
            style={({ pressed }) => [styles.begin, pressed && { opacity: 0.9 }]}
          >
            <Text variant="cardTitle" color="#FFFFFF">
              {copy.launch.begin}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    paddingHorizontal: 32,
  },
  brand: { alignItems: 'center', gap: 16 },
  icon: { width: 72, height: 64 },
  wordmark: { width: 200, height: 36 },
  tagline: { textAlign: 'center', maxWidth: 320 },
  beginWrap: { alignSelf: 'stretch', paddingHorizontal: 24 },
  begin: {
    backgroundColor: AMETHYST,
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
