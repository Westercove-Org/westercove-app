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

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" style={styles.para}>
          {copy.disclaimerScreen.body1}
        </Text>
        <Text variant="body" style={styles.para}>
          {copy.disclaimerScreen.body2}
        </Text>
        <Text variant="body" color="textMuted" style={styles.para}>
          {copy.disclaimerScreen.body3}
        </Text>

        <View style={styles.actions}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.lg,
  },
  // Larger body copy, matching the demo (17px).
  para: { fontSize: 17, lineHeight: 27 },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  goBack: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
