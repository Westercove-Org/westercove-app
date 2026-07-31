import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/** Disclaimer: wellness-companion-not-therapy. No blocking checkbox — continuing
 * confirms the 18+ / terms acknowledgment (matches the demo). */
export default function DisclaimerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={copy.disclaimerScreen.title} image="hills" />
      <View style={styles.content}>
        <Text variant="body" style={styles.para}>
          {copy.disclaimerScreen.body}
        </Text>
        <Text variant="body" style={styles.para}>
          {copy.disclaimerScreen.crisis}
        </Text>
        <Text variant="body" color="textMuted" style={styles.para}>
          {copy.disclaimerScreen.terms}
        </Text>

        <View style={styles.footer}>
          <Button
            label={copy.disclaimerScreen.continue}
            variant="primary"
            onPress={() => router.push('/sign-in')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.disclaimerScreen.goBack}
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text variant="bodySmall" color="textMuted">
              {copy.disclaimerScreen.goBack}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  para: {},
  footer: { marginTop: spacing.xl, gap: spacing.sm },
  back: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
