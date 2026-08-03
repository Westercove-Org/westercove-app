import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckIcon, PadlockIcon, PlusIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { BookSummarySheet } from '@/features/discover/BookSummarySheet';
import { useLibraryStore } from '@/features/discover/libraryStore';
import { type Book } from '@/features/discover/mockBooks';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const now = new Date();
  const [selected, setSelected] = useState<Book | null>(null);
  const [catalog, setCatalog] = useState<Book[]>([]);
  const bookIds = useLibraryStore((s) => s.bookIds);
  const toggle = useLibraryStore((s) => s.toggle);
  const addAll = useLibraryStore((s) => s.addAll);

  useEffect(() => {
    let active = true;
    services.content.listCatalog().then((books) => {
      if (active) setCatalog(books);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen header={{ title: 'Discover', subtitle: formatHeaderDateTime(now), image: 'meadow' }}>
      <View style={styles.searchWrap}>
        <SearchPill
          placeholder={copy.discover.search}
          onPress={() => router.push({ pathname: '/search', params: { scope: 'discover' } })}
        />
      </View>

      <View style={styles.libraryHeader}>
        <SectionLabel>{copy.library.label}</SectionLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.library.addAll}
          onPress={() => addAll(catalog.map((b) => b.id))}
          hitSlop={8}
        >
          <Text variant="cardTitle" color="forest">
            {copy.library.addAll}
          </Text>
        </Pressable>
      </View>
      <View style={styles.blockWrap}>
        <Card>
          <Text variant="bodySmall" color="textMuted">
            {copy.library.intro}
          </Text>
        </Card>
      </View>

      <View style={styles.grid}>
        {catalog.map((book) => {
          const added = bookIds.includes(book.id);
          return (
            <View key={book.id} style={styles.gridItem}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${book.title} by ${book.author}. Tap to read its summary.`}
                onPress={() => setSelected(book)}
              >
                <View style={[styles.spine, { backgroundColor: book.spine }]}>
                  <Text variant="meta" color="rgba(255,255,255,0.7)" style={styles.spineBrand}>
                    WESTERCOVE
                  </Text>
                  <Text color="#FFFFFF" style={styles.spineTitle}>
                    {book.title}
                  </Text>
                  <View style={styles.spineBase} />
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: added }}
                accessibilityLabel={`${added ? copy.library.added : copy.library.add}: ${book.title}`}
                onPress={() => toggle(book.id)}
                hitSlop={6}
                style={[
                  styles.addBtn,
                  { backgroundColor: added ? colors.forest : 'rgba(255,255,255,0.9)' },
                ]}
              >
                {added ? (
                  <CheckIcon size={18} color="#FFFFFF" />
                ) : (
                  <PlusIcon size={18} color={book.spine} />
                )}
              </Pressable>
              <Text variant="bodySmall" color="textMuted" style={styles.author}>
                {book.author}
              </Text>
            </View>
          );
        })}
      </View>
      <Text variant="bodySmall" color="textMuted" style={styles.tapHint}>
        {copy.library.tapHint}
      </Text>

      <SectionLabel>TRAINING / DEVELOPMENT</SectionLabel>
      <View style={styles.blockWrap}>
        <Card>
          <View style={styles.trainingRow}>
            <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.thumbSky} />
              <View style={styles.thumbHills} />
            </View>
            <View style={styles.trainingText}>
              <Text variant="cardTitle">{copy.discover.trainingTitle}</Text>
              <Text variant="bodySmall" color="textMuted" style={styles.trainingSub}>
                {copy.discover.trainingSub}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <SectionLabel>COMMUNITY</SectionLabel>
      <View style={styles.blockWrap}>
        <Card reflective>
          <View style={styles.communityRow}>
            <PadlockIcon size={22} color={colors.amethystText} />
            <View style={styles.communityText}>
              <Text variant="cardTitle" color="amethystText">
                {copy.discover.communityTitle}
              </Text>
              <Text variant="bodySmall" color="textMuted">
                {copy.discover.communitySub}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.card }]}>
              <Text variant="meta" color="amethystText" style={styles.badgeText}>
                {copy.discover.communityPhase}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <BookSummarySheet book={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.xl },
  blockWrap: { paddingHorizontal: spacing.screen },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  gridItem: { width: '47%', flexGrow: 1 },
  addBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spine: {
    height: 188,
    borderRadius: radii.avatar,
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  spineBrand: { letterSpacing: 1, marginBottom: spacing.sm },
  spineTitle: { fontSize: 17, lineHeight: 21, fontWeight: '700' },
  spineBase: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  author: { marginTop: spacing.sm },
  tapHint: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    fontStyle: 'italic',
  },
  trainingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.avatar,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  thumbSky: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, backgroundColor: '#9DB4C0' },
  thumbHills: { height: 26, backgroundColor: '#2F6B33' },
  trainingText: { flex: 1 },
  trainingSub: { marginTop: 2 },
  communityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  communityText: { flex: 1 },
  badge: {
    borderRadius: radii.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { fontWeight: '700' },
});
