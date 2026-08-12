import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { GentleQuestionCard } from '@/components/GentleQuestionCard';
import { Screen } from '@/components/Screen';
import { Chip } from '@/components/ui/Chip';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import type { EntryType } from '@/features/journal/entryTypes';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';
import { spacing } from '@/theme/tokens';

/** Home quick-access command chips, below the gentle-question card. Every one
 *  is a real entry type: a chip that is not lands the writer in a Journal entry
 *  they did not ask for. */
const HOME_CHIPS = [
  'Memory',
  'Struggle',
  'Journal',
  'Letter',
  'Anniversary',
  'Grief Question',
] as const satisfies readonly EntryType[];

function greeting(now: Date, name?: string): string {
  const h = now.getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name?.trim() || 'friend'}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const now = new Date();
  const callName = useSessionStore((s) => s.session?.gateAnswers.callName);
  const entries = useEntriesStore((s) => s.entries);

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
      <ComposeCard onPressPrompt={() => compose()} onPressMic={() => compose()} />

      <GentleQuestionCard />

      <View style={styles.chips}>
        {HOME_CHIPS.map((label) => (
          <Chip key={label} label={label} onPress={() => compose(label)} />
        ))}
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
});
