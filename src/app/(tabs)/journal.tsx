import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ComposeCard } from '@/components/ComposeCard';
import { EntryCard } from '@/components/EntryCard';
import { Screen } from '@/components/Screen';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Skeleton } from '@/components/ui/Skeleton';
import { copy } from '@/constants/copy';
import { ENTRY_PLACEHOLDERS, ENTRY_TYPES, type EntryType } from '@/features/journal/entryTypes';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';
import { spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_meadow_white.jpg');

/** Filter chips over the journal list: "All" plus every entry type. */
const FILTERS = ['All', ...ENTRY_TYPES] as const;

export default function JournalScreen() {
  const router = useRouter();
  const now = new Date();
  const entries = useEntriesStore((s) => s.entries);
  const refreshServerSessions = useEntriesStore((s) => s.refreshServerSessions);
  const [filter, setFilter] = useState<string>('All');
  // Whether the first server load has resolved, so the empty-state only shows
  // when the journal is genuinely empty — not in the gap before entries hydrate.
  const [loaded, setLoaded] = useState(false);

  // Load this profile's server entries when the journal opens (no-op until the
  // survey submit has stashed a backend profile id).
  useEffect(() => {
    let active = true;
    void refreshServerSessions().finally(() => {
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [refreshServerSessions]);

  const shown = filter === 'All' ? entries : entries.filter((e) => e.type === filter);

  // The compose card follows the active filter, so tapping it starts the kind of
  // entry the reader is already looking at rather than always a plain Journal.
  const composeType: EntryType = filter === 'All' ? 'Journal' : (filter as EntryType);
  const compose = () => router.push({ pathname: '/entry/new', params: { type: composeType } });

  return (
    <Screen header={{ title: 'Journal', subtitle: formatHeaderDateTime(now), image: heroImage }}>
      <ComposeCard
        placeholder={ENTRY_PLACEHOLDERS[composeType]}
        attach
        onPressPrompt={compose}
        onPressMic={compose}
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>

      <SectionLabel>{copy.journal.entries}</SectionLabel>
      {!loaded && shown.length === 0 ? (
        <View style={styles.loading} accessibilityLabel="Loading your journal">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} />
          ))}
        </View>
      ) : shown.length === 0 ? (
        <EmptyState
          message={copy.journal.empty}
          action={{ label: `Start a new ${composeType} entry`, onPress: compose }}
        />
      ) : (
        shown.map((entry) => (
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

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
  loading: { paddingHorizontal: spacing.screen, paddingTop: spacing.cardGap, gap: spacing.cardGap },
});
