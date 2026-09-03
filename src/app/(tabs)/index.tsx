import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { GentleQuestionCard } from '@/components/GentleQuestionCard';
import { RecoveryBanner } from '@/components/RecoveryBanner';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { Screen } from '@/components/Screen';
import { Chip } from '@/components/ui/Chip';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { ENTRY_TYPES } from '@/features/journal/entryTypes';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';
import { spacing } from '@/theme/tokens';

/** Home quick-access command chips, below the gentle-question card. Every
 *  category gets a button (spec v7 Item 9 / R-28): all ten entry types, in
 *  canonical order, so none is reachable only from inside compose. */
const HOME_CHIPS = ENTRY_TYPES;

function greeting(now: Date, name?: string): string {
  const h = now.getHours();
  const part =
    h < 5 ? 'Late tonight' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name?.trim() || 'friend'}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const now = new Date();
  const callName = useSessionStore((s) => s.session?.gateAnswers.callName);
  const entries = useEntriesStore((s) => s.entries);
  const planLimit = useEntriesStore((s) => s.planLimit);
  const clearPlanLimit = useEntriesStore((s) => s.clearPlanLimit);

  const compose = (type?: string) =>
    router.push(type ? { pathname: '/entry/new', params: { type } } : '/entry/new');

  return (
    <Screen
      header={{
        variant: 'greeting',
        title: greeting(now, callName),
        label: 'Home',
        subtitle: formatHeaderDateTime(now),
      }}
    >
      <RecoveryBanner />

      <ComposeCard onPressPrompt={() => compose()} onPressMic={() => compose()} />

      <GentleQuestionCard />

      {planLimit ? (
        <View style={styles.promptWrap}>
          <UpgradePrompt
            limit={planLimit}
            onSeePlans={() => router.push('/subscription')}
            onDismiss={clearPlanLimit}
          />
        </View>
      ) : null}

      <View style={styles.chips}>
        {HOME_CHIPS.map((label) => (
          <Chip key={label} label={label} onPress={() => compose(label)} />
        ))}
      </View>

      <View style={styles.searchWrap}>
        <SearchPill
          placeholder="Search your entries, books, memories"
          onPress={() => router.push({ pathname: '/search', params: { scope: 'global' } })}
        />
      </View>

      <SectionLabel>{copy.home.recent}</SectionLabel>
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          type={entry.type}
          headline={entry.headline}
          timestamp={formatEntryTimestamp(new Date(entry.createdAt))}
          onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
  promptWrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  searchWrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.xl },
});
