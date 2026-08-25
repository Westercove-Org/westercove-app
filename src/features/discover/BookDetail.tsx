import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { CheckIcon, ChevronRightIcon, PlusIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { BOOKS, guidanceFor } from '@/constants/books';
import { fromCatalog, useLibraryStore } from '@/features/discover/libraryStore';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const headerPhoto = require('../../../assets/images/westercove_wildflowers_purple.jpg');
const COVER_TEXT = '#F6F1E7';
const WAITING =
  'Your companion is writing a short summary for this book. It will appear here in a moment.';
const THROTTLED =
  'Your companion is caught up with summaries right now. Come back in a little while and this will be ready.';
const RESEARCHING =
  'Your companion is still researching this book. It will fill in here once the summary is ready.';
const FAILED =
  'This summary could not be written right now. Please try again in a little while.';

/** One book: its summary, the practices it offers, and whether it is shelved.
 *  Reached at `/book/:id` from Discover, the library, and search. */
export function BookDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const myLibrary = useLibraryStore((s) => s.myLibrary);
  const addToLibrary = useLibraryStore((s) => s.addToLibrary);
  const removeFromLibrary = useLibraryStore((s) => s.removeFromLibrary);
  const setSummary = useLibraryStore((s) => s.setSummary);
  const refreshBookSummary = useLibraryStore((s) => s.refreshBookSummary);

  const shelved = myLibrary.find((b) => b.id === id);
  const catalogBook = BOOKS.find((b) => b.id === id);
  const book = shelved ?? (catalogBook ? fromCatalog(catalogBook) : undefined);
  const isCustom = book?.source === 'own';
  const inLibrary = Boolean(shelved);

  // A book the user added themselves arrives without a summary. Ask for one
  // once, and write it back so the shelf and the export both pick it up.
  const needsSummary = Boolean(book && isCustom && !book.summary);
  const backendId = book?.backendId;
  const [throttled, setThrottled] = useState(false);
  const [researching, setResearching] = useState(false);
  const [failed, setFailed] = useState(false);

  const generateOnDemand = async (title: string, author: string, bookId: string) => {
    const { summary, rateLimited } = await services.content.generateBookSummary(title, author);
    if (summary) setSummary(bookId, summary);
    else if (rateLimited) setThrottled(true);
    // A real failure (no summary, not throttled) must surface instead of leaving
    // the "writing a summary" boilerplate up forever, which reads as masking.
    else setFailed(true);
  };

  useEffect(() => {
    if (!needsSummary || !book) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    setThrottled(false);
    setResearching(false);
    setFailed(false);

    if (backendId != null) {
      // Server-backed: poll the enrichment, bounded (max 4 tries, 6s apart) so a
      // "still researching" book fills in without a retry-storm.
      let attempts = 0;
      const poll = async () => {
        const status = await refreshBookSummary(book.id);
        if (!active) return;
        if (status === 'pending' || status === 'researching') {
          setResearching(true);
          if (++attempts < 4) timer = setTimeout(poll, 6000);
        } else {
          setResearching(false);
          // approved / needs_review already wrote the summary; failed → fall back.
          if (status === 'failed') void generateOnDemand(book.title, book.author, book.id);
        }
      };
      void poll();
    } else {
      // No backend id (offline / pre-profile): single on-demand request, no retry.
      void generateOnDemand(book.title, book.author, book.id);
    }

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSummary, book?.id, backendId]);

  if (!book) {
    return (
      <View style={styles.notFound}>
        <Text variant="body" color="textMuted">
          This book is not here.{' '}
          <Link href="/discover">
            <Text color="forest">Back to Discover</Text>
          </Link>
        </Text>
      </View>
    );
  }

  const guidance = isCustom ? [] : guidanceFor(book.id);
  const meta = [book.status, book.reader ? `for ${book.reader}` : null].filter(Boolean).join(' · ');

  const fade =
    scheme === 'dark'
      ? (['rgba(26,23,18,0.35)', 'rgba(26,23,18,0.72)', 'rgba(26,23,18,0.96)'] as const)
      : (['rgba(246,241,231,0.18)', 'rgba(246,241,231,0.55)', 'rgba(246,241,231,0.96)'] as const);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Image source={headerPhoto} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={fade} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <View style={styles.backChevron}>
            <ChevronRightIcon size={22} color={colors.amethystText} />
          </View>
          <Text color="amethystText">Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.top}>
          <View style={[styles.cover, { backgroundColor: book.spine }]}>
            <Text variant="meta" color={COVER_TEXT} style={styles.coverBrand}>
              {isCustom ? 'YOUR BOOK' : 'WESTERCOVE'}
            </Text>
          </View>
          <View style={styles.topText}>
            <Text variant="meta" color="textMuted">
              {isCustom ? 'ADDED BY YOU' : 'BOOK'}
            </Text>
            <Text variant="screenTitle" style={styles.title}>
              {book.title}
            </Text>
            <Text variant="bodySmall" color="textMuted">
              by {book.author}
            </Text>
            {meta ? (
              <Text variant="bodySmall" color="textMuted">
                {meta}
              </Text>
            ) : null}
          </View>
        </View>

        <Text variant="body" style={styles.summary}>
          {book.summary ??
            (researching ? RESEARCHING : throttled ? THROTTLED : failed ? FAILED : WAITING)}
        </Text>

        {guidance.length > 0 ? (
          <Card style={styles.guidance}>
            <Text variant="cardTitle">Ways this book might help</Text>
            {guidance.map((line) => (
              <Text key={line} variant="body" style={styles.guidanceLine}>
                {line}
              </Text>
            ))}
            {inLibrary ? (
              <Text variant="bodySmall" color="textMuted" style={styles.guidanceNote}>
                Because this is in your library, your companion may gently draw on these when it
                fits.
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (inLibrary) {
              removeFromLibrary(book.id);
              if (isCustom) router.replace('/discover');
            } else {
              addToLibrary(book.id);
            }
          }}
          style={[styles.action, { borderColor: inLibrary ? colors.line : colors.forest }]}
        >
          {inLibrary ? (
            <CheckIcon size={16} color={colors.forest} />
          ) : (
            <PlusIcon size={16} color={colors.forest} />
          )}
          <Text variant="body" color="forest">
            {isCustom
              ? 'Remove from your library'
              : inLibrary
                ? 'In your profile library'
                : 'Add to your profile library'}
          </Text>
        </Pressable>
      </ScrollView>

      <CrisisBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: {
    overflow: 'hidden',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44 },
  backChevron: { transform: [{ rotate: '180deg' }] },
  body: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg, paddingBottom: 140 },
  top: { flexDirection: 'row', gap: spacing.md },
  cover: { width: 112, height: 160, borderRadius: 12, padding: spacing.sm },
  coverBrand: { letterSpacing: 1.5 },
  topText: { flex: 1 },
  title: { marginTop: 2 },
  summary: { marginTop: spacing.lg },
  guidance: { marginTop: spacing.lg },
  guidanceLine: { marginTop: spacing.sm },
  guidanceNote: { marginTop: spacing.md },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingVertical: spacing.md,
  },
});
