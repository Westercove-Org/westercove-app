import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CheckIcon, PadlockIcon } from '@/components/icons';
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

function BookRow({
  book,
  onOpen,
  trailing,
}: {
  book: LibraryBook;
  onOpen: () => void;
  trailing: React.ReactNode;
}) {
  return (
    <View style={styles.bookRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} by ${book.author}. Read summary.`}
        onPress={onOpen}
        style={styles.bookMain}
      >
        <View style={[styles.cover, { backgroundColor: book.spine }]} />
        <View style={styles.bookText}>
          <Text variant="meta" color="textMuted" style={styles.brandTag}>
            {book.source === 'own' ? 'YOUR BOOK' : 'WESTERCOVE'}
          </Text>
          <Text variant="cardTitle">{book.title}</Text>
          <Text variant="bodySmall" color="textMuted">
            by {book.author}
          </Text>
        </View>
      </Pressable>
      {trailing}
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
          </Text>
        </Card>
      </View>

      {myLibrary.map((book) => (
        <View key={book.id} style={styles.blockWrap}>
          <Card padded={false}>
            <BookRow
              book={book}
              onOpen={() => setSelected(book)}
              trailing={<CheckIcon size={20} color={colors.forest} />}
            />
          </Card>
        </View>
      ))}

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
          <View style={styles.addBtn}>
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
      {recommended.map((book) => (
        <View key={book.id} style={styles.blockWrap}>
          <Card padded={false}>
            <BookRow
              book={book}
              onOpen={() => setSelected(book)}
              trailing={
                inLibrary(book.id) ? (
                  <CheckIcon size={20} color={colors.forest} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${book.title} to my library`}
                    onPress={() => addToLibrary(book.id)}
                    hitSlop={8}
                    style={styles.addToLib}
                  >
                    <Text variant="bodySmall" color="forest">
                      Add
                    </Text>
                  </Pressable>
                )
              }
            />
          </Card>
        </View>
      ))}

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
  addBtn: { flexDirection: 'row', marginTop: spacing.md },
  recHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.screen,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.cardInner,
  },
  bookMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cover: { width: 36, height: 52, borderRadius: 4 },
  bookText: { flex: 1 },
  brandTag: { letterSpacing: 0.6, marginBottom: 2 },
  addToLib: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
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
