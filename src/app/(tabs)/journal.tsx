import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { copy } from '@/constants/copy';
import { ENTRY_TYPES } from '@/features/journal/entryTypes';
import { MOCK_ENTRIES } from '@/features/journal/mockEntries';
import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';

export default function JournalScreen() {
  const now = new Date();
  return (
    <Screen header={{ title: 'Journal', subtitle: formatHeaderDateTime(now) }}>
      <ComposeCard chips={ENTRY_TYPES} />
      <SectionLabel>{copy.journal.entries}</SectionLabel>
      {MOCK_ENTRIES.map((entry) => (
        <EntryCard
          key={entry.id}
          type={entry.type}
          headline={entry.headline}
          timestamp={formatEntryTimestamp(entry.date)}
        />
      ))}
    </Screen>
  );
}
