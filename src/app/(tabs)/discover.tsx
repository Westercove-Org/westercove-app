import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CheckIcon, PadlockIcon, PlusIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { BookSummarySheet } from '@/features/discover/BookSummarySheet';
import { useLibraryStore, type LibraryBook } from '@/features/discover/libraryStore';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const trainingPhoto = require('../../../assets/images/westercove_valley_green.jpg');

/** Light text that reads on the dark cover blocks. */
const COVER_TEXT = '#F6F1E7';

/** A book cover card (2-up grid): colored cover with the wordmark + serif title,
 *  author below, and an add/added control. */
function BookCoverCard({
  book,
  inLibrary,
  onOpen,
  onAdd,
}: {
  book: LibraryBook;
  inLibrary: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.gridItem}>
      <View style={styles.coverWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${book.title} by ${book.author}. Read summary.`}
          onPress={onOpen}
          style={[styles.cover, { backgroundColor: book.spine }]}
        >
          <Text variant="meta" color={COVER_TEXT} style={styles.coverBrand}>
            {book.source === 'own' ? 'YOUR BOOK' : 'WESTERCOVE'}
          </Text>
          <Text variant="cardTitle" color={COVER_TEXT} style={styles.coverTitle}>
            {book.title}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            inLibrary ? `${book.title} in your library` : `Add ${book.title} to my library`
          }
          onPress={onAdd}
          hitSlop={6}
          style={[
            styles.coverAdd,
            inLibrary
              ? { backgroundColor: colors.forest }
              : { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 },
          ]}
        >
          {inLibrary ? (
            <CheckIcon size={16} color={colors.onAccent} />
          ) : (
            <PlusIcon size={16} color={colors.textPrimary} />
          )}
        </Pressable>
      </View>
      <Text variant="meta" color="textMuted" style={styles.byLabel}>
        by
      </Text>
      <Text variant="bodySmall">{book.author}</Text>
      {!inLibrary ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${book.title} to my library`}
          onPress={onAdd}
          style={[styles.addBtn, { borderColor: colors.forest }]}
        >
          <PlusIcon size={14} color={colors.forest} />
          <Text variant="bodySmall" color="forest">
            Add to my library
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const now = new Date();

  const recommended = useLibraryStore((s) => s.recommended);
  const myLibrary = useLibraryStore((s) => s.myLibrary);
  const addToLibrary = useLibraryStore((s) => s.addToLibrary);
  const addAll = useLibraryStore((s) => s.addAll);
  const addOwnBook = useLibraryStore((s) => s.addOwnBook);

  const [selected, setSelected] = useState<LibraryBook | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);

  const inLibrary = (id: string) => myLibrary.some((b) => b.id === id);
  const notAdded = recommended.filter((b) => !inLibrary(b.id));

  const onAddOwn = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await addOwnBook(title, author);
      setTitle('');
      setAuthor('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={{ title: 'Discover', subtitle: formatHeaderDateTime(now) }}>
      <View style={styles.searchWrap}>
        <SearchPill
          placeholder={copy.discover.search}
          onPress={() => router.push({ pathname: '/search', params: { scope: 'discover' } })}
        />
      </View>

      <SectionLabel>YOUR LIBRARY</SectionLabel>
      <View style={styles.blockWrap}>
        <Card>
          <Text variant="body" color="textMuted">
            A thoughtfully chosen library is a wonderful way to provide evidence based support
            for your grief wellness journey. You may build your own personal library by adding
            books that have been meaningful to you, use the curated Westercove library, or
            combine both. Your companion will gently draw from these resources during your
            conversations, and relevant insights may also appear in your downloaded journal.
            Which would you prefer?
            {myLibrary.length > 0 ? (
              <Text variant="body" color="forest">
                {'\n'}
                {myLibrary.length} in your library.
              </Text>
            ) : null}
          </Text>
        </Card>
      </View>

      {myLibrary.length > 0 ? (
        <View style={[styles.blockWrap, styles.grid]}>
          {myLibrary.map((book) => (
            <BookCoverCard
              key={book.id}
              book={book}
              inLibrary
              onOpen={() => setSelected(book)}
              onAdd={() => {}}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.blockWrap}>
        <Card>
          <Text variant="cardTitle">Add your own book</Text>
          <Text variant="bodySmall" color="textMuted" style={styles.addSub}>
            Enter the title and author, and your companion will write a short summary. It
            joins your library, labeled as your own.
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Book title"
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.line }]}
          />
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Author"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Book author"
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.line }]}
          />
          <View style={styles.addOwnBtn}>
            <Button label="Add book" onPress={onAddOwn} loading={busy} disabled={!title.trim()} />
          </View>
        </Card>
      </View>

      <View style={styles.recHead}>
        <SectionLabel>RECOMMENDED LIBRARY</SectionLabel>
        <Pressable accessibilityRole="button" accessibilityLabel="Add all" onPress={addAll} hitSlop={8}>
          <Text variant="tag" color="forest">
            Add all
          </Text>
        </Pressable>
      </View>
      <View style={[styles.blockWrap, styles.grid]}>
        {notAdded.map((book) => (
          <BookCoverCard
            key={book.id}
            book={book}
            inLibrary={false}
            onOpen={() => setSelected(book)}
            onAdd={() => addToLibrary(book.id)}
          />
        ))}
      </View>

      <SectionLabel>TRAINING / DEVELOPMENT</SectionLabel>
      <View style={styles.blockWrap}>
        <Card padded={false} style={styles.trainingCard}>
          <View style={styles.trainingBanner}>
            <Image source={trainingPhoto} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['rgba(25,9,51,0.15)', 'rgba(25,9,51,0.45)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.trainingText}>
            <Text variant="screenTitle" style={styles.trainingTitle}>
              {copy.discover.trainingTitle}
            </Text>
            <Text variant="bodySmall" color="textMuted">
              {copy.discover.trainingSub}
            </Text>
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
  blockWrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm },
  addSub: { marginTop: spacing.xs },
  input: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
  },
  addOwnBtn: { flexDirection: 'row', marginTop: spacing.md },
  recHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.screen,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.lg,
  },
  gridItem: { width: '48%' },
  coverWrap: { position: 'relative' },
  cover: {
    aspectRatio: 1.15,
    borderRadius: radii.card,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  coverBrand: { letterSpacing: 1.4 },
  coverTitle: { fontSize: 15, lineHeight: 19 },
  coverAdd: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  byLabel: { marginTop: spacing.sm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  trainingCard: { overflow: 'hidden' },
  trainingBanner: { height: 112, width: '100%' },
  trainingText: { padding: spacing.cardInner },
  trainingTitle: { fontSize: 18, lineHeight: 24, marginBottom: 2 },
  communityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  communityText: { flex: 1 },
  badge: {
    borderRadius: radii.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { fontWeight: '700' },
});
