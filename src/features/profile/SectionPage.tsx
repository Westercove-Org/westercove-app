import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon } from '@/components/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/** Metadata for each Profile / Settings section page. Content that a user
 * builds over time starts from a calm empty state that never nags. */
const SECTIONS: Record<string, { title: string; empty: string }> = {
  'loved-ones': {
    title: 'Loved-one profiles',
    empty: 'The people and pets you are grieving will live here, human or pet.',
  },
  memories: {
    title: 'Memories',
    empty: 'Nothing here yet. When you want to keep a memory, it will wait for you here.',
  },
  anniversaries: {
    title: 'Anniversaries and Hard Dates',
    empty: 'No dates saved yet. You can add one whenever you are ready.',
  },
  practices: {
    title: 'Stabilizing Practices',
    empty: 'Nothing here yet. The things that steady you will gather here.',
  },
  patterns: {
    title: 'Grief Patterns',
    empty: 'There is nothing to show yet. Patterns take time, and there is no rush.',
  },
  'custom-commands': {
    title: 'Custom commands',
    empty: 'Define your own ways to begin an entry. None yet.',
  },
  account: { title: 'Account', empty: 'Your account details will appear here.' },
  help: { title: 'Help', empty: 'Answers and support will appear here.' },
  legal: {
    title: 'Legal',
    empty: 'Terms of Service, Privacy Policy, and the wellness-companion disclaimer.',
  },
};

export function SectionPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const meta = SECTIONS[slug] ?? { title: 'Westercove', empty: 'Nothing here yet.' };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronRightIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="screenTitle">{meta.title}</Text>
      </View>
      <View style={styles.body}>
        <EmptyState message={meta.empty} />
      </View>
      <CrisisBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  back: {
    transform: [{ rotate: '180deg' }],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, justifyContent: 'center' },
});
