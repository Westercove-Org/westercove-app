import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/** Disclaimer: wellness-companion-not-therapy; continuing confirms 18+ and terms. */
export default function DisclaimerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={copy.disclaimerScreen.title} image={heroImage} />

      <ScrollView contentContainerStyle={styles.body}>
        <Text variant="body">{copy.disclaimerScreen.body1}</Text>
        <Text variant="body">{copy.disclaimerScreen.body2}</Text>
        <Text variant="body" color="textMuted">
          {copy.disclaimerScreen.body3}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={copy.disclaimerScreen.continue}
          variant="amethyst"
          onPress={() => router.push('/entry-path')}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.disclaimerScreen.goBack}
          onPress={() => router.back()}
          style={styles.goBack}
        >
          <Text variant="body" color="textMuted">
            {copy.disclaimerScreen.goBack}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    // Clear the floating crisis pill overlaid at the bottom.
    paddingBottom: 64,
    gap: spacing.sm,
  },
  goBack: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
