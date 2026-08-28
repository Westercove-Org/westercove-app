import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { GentleQuestionCard } from '@/components/GentleQuestionCard';
import { ChevronRightIcon, DownloadIcon, MicIcon, SendIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { EntryTag } from '@/components/ui/EntryTag';
import { Text } from '@/components/ui/Text';
import { USE_FOUR_DOORS } from '@/constants/flags';
import { useSafetyRouter } from '@/features/safety/useSafetyRouter';
import { InlineResourceCard } from '@/features/safety/InlineResourceCard';
import { ServerResources } from '@/features/safety/ServerResources';
import { useCadenceStore } from '@/features/cadence/cadenceStore';
import { QuickReplyChips } from '@/features/cadence/QuickReplyChips';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useQuestionTimer } from '@/features/questions/useQuestionTimer';
import { useCadenceJournalingTimer } from '@/features/cadence/useCadence';
import { formatEntryTimestamp } from '@/lib/dateFormat';
import { services } from '@/services';
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
  const clearPendingQuestion = useEntriesStore((s) => s.clearPendingQuestion);
  const routeSafety = useSafetyRouter();

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Accumulate talk-time while this conversation screen is focused.
  useQuestionTimer();
  useCadenceJournalingTimer();

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="body" color="textMuted">
          This entry is no longer here.
        </Text>
      </View>
    );
  }

  const onMic = async () => {
    setListening(true);
    setMicError(null);
    try {
      const transcript = await services.voice.capture();
      setText((t) => (t ? `${t} ${transcript}` : transcript));
    } catch {
      // A denied mic permission (or a failing real voice impl) rejects here;
      // tell the user rather than letting the rejection go unhandled.
      setMicError('Could not capture audio. Check microphone access and try again.');
    } finally {
      setListening(false);
    }
  };

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download journal"
              onPress={() => router.push('/export')}
              style={[styles.download, { backgroundColor: colors.emerald }]}
            >
              <DownloadIcon size={16} color={colors.onAccent} />
              <Text variant="tag" color="onAccent" style={styles.downloadText}>
                Download journal
              </Text>
            </Pressable>
          </View>
          <Text variant="meta" style={styles.stamp}>
            {formatEntryTimestamp(new Date(entry.createdAt))}
          </Text>
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
            <Card key={t.id} reflective>
              <Text variant="meta" color="amethystText" style={styles.companionLabel}>
                WESTERCOVE
              </Text>
              <Text variant="body" color="amethystText">
                {t.text}
              </Text>
              {USE_FOUR_DOORS && t.pendingQuestion ? (
                <View style={styles.chips}>
                  <QuickReplyChips
                    options={t.pendingQuestion.options}
                    onSelect={(value) => {
                      const qid = t.pendingQuestion!.questionId;
                      void useCadenceStore.getState().answerQuestion(qid, value);
                      clearPendingQuestion(entry.id, t.id);
                    }}
                    onDefer={() => {
                      void useCadenceStore.getState().deferQuestion(t.pendingQuestion!.questionId);
                      clearPendingQuestion(entry.id, t.id);
                    }}
                    onSkip={() => {
                      void useCadenceStore.getState().skipQuestion(t.pendingQuestion!.questionId);
                      clearPendingQuestion(entry.id, t.id);
                    }}
                  />
                </View>
              ) : null}
            </Card>
          ),
        )}

        {/* A companion reply is being written. Saying so in the thread keeps the
            wait from reading as silence. */}
        {busy ? (
          <Card reflective>
            <Text variant="body" color="amethystText">
              Thinking with you…
            </Text>
          </Card>
        ) : null}

        {entry.safetyLevel === SafetyLevel.Elevated ? <InlineResourceCard /> : null}
        {/* The backend's crisis-resource card, whenever it sent one (self-hides
            when there are no server resources). */}
        {entry.safetyLevel >= SafetyLevel.Elevated ? <ServerResources /> : null}

        {/* The same gentle question Home offers: writing here is exactly when a
            person is most likely to have an answer for it. */}
        <GentleQuestionCard />
      </ScrollView>

      {micError ? (
        <Text
          variant="bodySmall"
          color="textMuted"
          accessibilityRole="alert"
          style={styles.micError}
        >
          {micError}
        </Text>
      ) : null}

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
          accessibilityLabel={listening ? 'Listening' : 'Speak'}
          disabled={listening}
          onPress={onMic}
          style={[
            styles.send,
            { backgroundColor: colors.forest },
            listening && { opacity: 0.6 },
          ]}
        >
          <MicIcon size={22} color={colors.onAccent} />
        </Pressable>
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
  stamp: { marginTop: spacing.xs },
  headline: { marginTop: spacing.sm },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  downloadText: { textTransform: 'none' },
  thread: { paddingHorizontal: spacing.screen, paddingTop: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  userTurn: {},
  companionLabel: { marginBottom: spacing.xs, letterSpacing: 0.6 },
  chips: { marginTop: spacing.md },
  micError: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xs },
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
