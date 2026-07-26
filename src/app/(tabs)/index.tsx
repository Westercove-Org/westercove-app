import { useRouter } from 'expo-router';

import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { Screen } from '@/components/Screen';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { View } from 'react-native';
import { copy } from '@/constants/copy';
import { MOCK_ENTRIES } from '@/features/journal/mockEntries';
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

function greeting(now: Date): string {
  const h = now.getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, Dr. Carter`;
}

export default function HomeScreen() {
  const router = useRouter();
  const now = new Date();

  return (
    <Screen
      header={{
        variant: 'greeting',
        title: greeting(now),
        subtitle: formatHeaderDateTime(now),
      }}
    >
      <ComposeCard chips={HOME_CHIPS} />

      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.xl }}>
        <SearchPill placeholder={copy.home.search} />
      </View>

      <SectionLabel>{copy.home.recent}</SectionLabel>
      {MOCK_ENTRIES.slice(0, 3).map((entry) => (
        <EntryCard
          key={entry.id}
          type={entry.type}
          headline={entry.headline}
          timestamp={formatEntryTimestamp(entry.date)}
          onPress={() => router.push('/journal')}
        />
      ))}
    </Screen>
  );
}
