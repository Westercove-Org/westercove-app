import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { HardDateCard } from '@/components/HardDateCard';
import { Screen } from '@/components/Screen';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { HomeQuestionCard } from '@/features/questions/HomeQuestionCard';
import { nextUpcoming, useHardDatesStore } from '@/features/dates/hardDatesStore';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';
import { spacing } from '@/theme/tokens';

/** Home quick-access command chips, as shown on the Home hero screen. */
const HOME_CHIPS = [
  'Memory',
  'Struggle',
  'Journal',
  'Letter',
  'Anniversary',
  'Question',
] as const;

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
  const hardDates = useHardDatesStore((s) => s.dates);
  const upcoming = nextUpcoming(hardDates, now);

  const compose = (type?: string) =>
    router.push(type ? { pathname: '/entry/new', params: { type } } : '/entry/new');

  return (
    <Screen
      header={{
        variant: 'greeting',
        image: 'wildflowers',
        title: greeting(now, callName),
        subtitle: formatHeaderDateTime(now),
      }}
    >
      <HomeQuestionCard />

      <ComposeCard
        chips={HOME_CHIPS}
        onPressPrompt={() => compose()}
        onPressMic={() => compose()}
        onPressAttach={() => compose()}
        onPressChip={(label) => compose(label)}
      />

      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.xl }}>
        <SearchPill
          placeholder={copy.home.search}
          onPress={() => router.push({ pathname: '/search', params: { scope: 'global' } })}
        />
      </View>

      <SectionLabel>{copy.home.recent}</SectionLabel>
      {entries.slice(0, 3).map((entry) => (
        <EntryCard
          key={entry.id}
          type={entry.type}
          headline={entry.headline}
          timestamp={formatEntryTimestamp(new Date(entry.createdAt))}
          onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
        />
      ))}

      {upcoming ? (
        <HardDateCard
          label={`${upcoming.label} is coming up`}
          detail={`${upcoming.when.toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
          })} · ${
            upcoming.daysAway === 0
              ? 'today'
              : upcoming.daysAway === 1
                ? 'tomorrow'
                : `in ${upcoming.daysAway} days`
          }`}
          onPrepare={() => compose('Anniversary')}
        />
      ) : null}
    </Screen>
  );
}
