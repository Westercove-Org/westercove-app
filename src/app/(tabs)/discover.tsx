import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PadlockIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { BookSummarySheet } from '@/features/discover/BookSummarySheet';
import { MOCK_BOOKS, type Book } from '@/features/discover/mockBooks';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [selected, setSelected] = useState<Book | null>(null);

  return (
    <Screen header={{ title: 'Discover', subtitle: formatHeaderDateTime(now) }}>
      <View style={styles.searchWrap}>
        <SearchPill placeholder={copy.discover.search} />
      </View>

      <SectionLabel>BOOKS</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.booksRow}
      >
        {MOCK_BOOKS.map((book) => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`${book.title} by ${book.author}. Tap to fetch its summary.`}
            onPress={() => setSelected(book)}
            style={styles.book}
          >
            <View style={[styles.spine, { backgroundColor: book.spine }]}>
              <Text color="#FFFFFF" style={styles.spineTitle}>
                {book.title}
              </Text>
              <View style={styles.spineBase} />
            </View>
            <Text variant="bodySmall" color="textMuted" style={styles.author}>
              {book.author}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text variant="bodySmall" color="textMuted" style={styles.tapHint}>
        {copy.discover.tapBook}
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
  booksRow: { paddingHorizontal: spacing.screen, gap: spacing.md },
  book: { width: 132 },
  spine: {
    height: 176,
    borderRadius: radii.avatar,
    padding: spacing.md,
    justifyContent: 'flex-start',
  },
  spineTitle: { fontSize: 18, lineHeight: 22, fontWeight: '700' },
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
