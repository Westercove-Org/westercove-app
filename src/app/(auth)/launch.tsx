import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/** Launch: a calming landscape, the wordmark, and a single Begin path. */
export default function LaunchScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="greeting" title={copy.launch.tagline} />
      <View style={styles.body}>
        <Button label={copy.launch.begin} onPress={() => router.push('/disclaimer')} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sign-in')}
          style={styles.link}
        >
          <Text variant="body" color="forest">
            {copy.launch.haveAccount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.huge,
    gap: spacing.lg,
  },
  link: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
