import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { copy } from '@/constants/copy';
import { Text } from './ui/Text';

/** Deep-plum crisis fill, fixed across themes (matches the v6 demo banner). */
const EMERALD = '#2A1B3D';
const SAFFRON = '#EDC531';

/**
 * The persistent crisis banner: a rounded plum pill, white text at AAA
 * contrast, never dismissible and never gated by subscription. Tapping it goes
 * straight to the full-screen `/crisis` interface where the person chooses to
 * call or text — no inline panel. Rendered above the tab bar on primary
 * screens (`bottomInset={false}`) and at the bottom edge of the gate / new-entry
 * screens (default `bottomInset`, which adds the safe-area gap).
 */
export function CrisisBanner({ bottomInset = true }: { bottomInset?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="In crisis? Crisis resources. Tap to call or text."
      onPress={() => router.push('/crisis')}
      style={({ pressed }) => [
        styles.pill,
        { marginBottom: (bottomInset ? insets.bottom : 0) + 8 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text color="#FFFFFF" style={styles.text}>
        {copy.crisis.bannerLine}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: EMERALD,
    borderTopWidth: 2,
    borderTopColor: SAFFRON,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '600', fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
