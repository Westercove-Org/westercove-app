import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon, SendIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { EntryTag } from '@/components/ui/EntryTag';
import { Text } from '@/components/ui/Text';
import { useSafetyRouter } from '@/features/safety/useSafetyRouter';
import { InlineResourceCard } from '@/features/safety/InlineResourceCard';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useQuestionTimer } from '@/features/questions/useQuestionTimer';
import { formatEntryTimestamp } from '@/lib/dateFormat';
import { SafetyLevel } from '@/services/safety';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function EntryDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntriesStore((s) => s.entries.find((e) => e.id === id));
  const continueEntry = useEntriesStore((s) => s.continueEntry);
  const routeSafety = useSafetyRouter();

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  // Accumulate talk-time while this conversation screen is focused.
  useQuestionTimer();

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="body" color="textMuted">
          This entry is no longer here.
        </Text>
      </View>
    );
  }

  const onContinue = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const level = await continueEntry(entry.id, text.trim());
    setText('');
    setBusy(false);
    if (level >= SafetyLevel.High) routeSafety({ level });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronRightIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <View style={styles.tagRow}>
            <EntryTag label={entry.type} />
            <Text variant="meta">{formatEntryTimestamp(new Date(entry.createdAt))}</Text>
          </View>
          <Text variant="screenTitle" style={styles.headline}>
            {entry.headline}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.thread}>
        {entry.turns.map((t) =>
          t.role === 'user' ? (
            <Text key={t.id} variant="body" style={styles.userTurn}>
              {t.text}
            </Text>
          ) : (
            <Card key={t.id} reflective style={styles.companionTurn}>
              <Text variant="meta" color="amethystText" style={styles.companionLabel}>
                WESTERCOVE
              </Text>
              <Text variant="body" color="amethystText">
                {t.text}
              </Text>
            </Card>
          ),
        )}

        {entry.safetyLevel === SafetyLevel.Elevated ? <InlineResourceCard /> : null}
      </ScrollView>

      <View style={styles.composeRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Continue the conversation…"
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel="Continue the conversation"
          style={[
            styles.input,
            { color: colors.textPrimary, backgroundColor: colors.surfaceAlt },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!text.trim() || busy}
          onPress={onContinue}
          style={[
            styles.send,
            { backgroundColor: colors.emerald },
            (!text.trim() || busy) && { opacity: 0.4 },
          ]}
        >
          <SendIcon size={22} color={colors.onAccent} />
        </Pressable>
      </View>

      <CrisisBanner compact />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  back: {
    transform: [{ rotate: '180deg' }],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, paddingTop: spacing.sm },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headline: { marginTop: spacing.sm },
  thread: { paddingHorizontal: spacing.screen, paddingTop: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  userTurn: {},
  companionTurn: {},
  companionLabel: { marginBottom: spacing.xs, letterSpacing: 0.6 },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
