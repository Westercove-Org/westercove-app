import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import type { Book } from '@/features/discover/mockBooks';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

/**
 * Tap-to-fetch book summary: a bottom sheet with a loading state, then the
 * fetched summary so the companion's responses can meet the reader inside that
 * book's framework (journey map §4).
 */
export function BookSummarySheet({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (book) {
      setSummary(null);
      services.content.fetchBookSummary(book.id).then((s) => {
        if (active) setSummary(s);
      });
    }
    return () => {
      active = false;
    };
  }, [book]);

  return (
    <Modal visible={!!book} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close">
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.xl },
          ]}
          onPress={() => {}}
        >
          {book ? (
            <>
              <Text variant="screenTitle">{book.title}</Text>
              <Text variant="bodySmall" color="textMuted" style={styles.author}>
                {book.author}
              </Text>
              {summary === null ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.forest} />
                  <Text variant="bodySmall" color="textMuted">
                    Fetching summary…
                  </Text>
                </View>
              ) : (
                <Text variant="body" style={styles.summary}>
                  {summary}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.close}
              >
                <Text variant="body" color="forest">
                  Close
                </Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  author: {},
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  summary: { marginTop: spacing.sm },
  close: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm },
});
