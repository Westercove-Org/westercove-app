import { useRouter } from 'expo-router';

import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/constants/copy';
import { ENTRY_TYPES } from '@/features/journal/entryTypes';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';

export default function JournalScreen() {
  const router = useRouter();
  const now = new Date();
  const entries = useEntriesStore((s) => s.entries);

  const compose = (type?: string) =>
    router.push(type ? { pathname: '/entry/new', params: { type } } : '/entry/new');

  return (
    <Screen header={{ title: 'Journal', subtitle: formatHeaderDateTime(now) }}>
      <ComposeCard
        chips={ENTRY_TYPES}
        onPressPrompt={() => compose()}
        onPressMic={() => compose()}
        onPressChip={(label) => compose(label)}
      />
      <SectionLabel>{copy.journal.entries}</SectionLabel>
      {entries.length === 0 ? (
        <EmptyState message={copy.journal.empty} />
      ) : (
        entries.map((entry) => (
          <EntryCard
            key={entry.id}
            type={entry.type}
            headline={entry.headline}
            timestamp={formatEntryTimestamp(new Date(entry.createdAt))}
            onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
          />
        ))
      )}
    </Screen>
  );
}
