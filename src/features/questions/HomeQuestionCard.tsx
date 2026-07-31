import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { pickImage } from '@/features/journal/attach';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useCadenceStore } from '@/features/questions/demoCadenceStore';
import { useHardDatesStore } from '@/features/dates/hardDatesStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';
import { activeDays, dueDayIndex, useQuestionsStore } from './questionsStore';

/**
 * The companion's current question, surfaced right on Home (matching the SOP:
 * "On the Home screen a gentle question appears"). The first question is
 * "Tell me about [name]"; answering advances within the day's bucket, and
 * "Simulate a journaling session" (Profile → Demo controls) unlocks the next.
 * When the current bucket is exhausted, the card gently waits.
 */
export function HomeQuestionCard() {
  const { colors } = useTheme();
  const loved = useSessionStore((s) => s.session?.gateAnswers.lovedOneName)?.trim() || 'them';
  const stage = useCadenceStore((s) => s.stage);
  const answers = useQuestionsStore((s) => s.answers);
  const skipped = useQuestionsStore((s) => s.skipped);
  const daysShown = useQuestionsStore((s) => s.daysShown);
  const recordAnswer = useQuestionsStore((s) => s.recordAnswer);
  const skipQuestion = useQuestionsStore((s) => s.skipQuestion);
  const markDayShown = useQuestionsStore((s) => s.markDayShown);

  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [ack, setAck] = useState<string | null>(null);

  const days = activeDays();
  const due = dueDayIndex(stage, days.length);

  // The bucket currently in play: the earliest unshown bucket that is unlocked.
  const bucket = due >= daysShown ? days[daysShown] : undefined;

  // First question in the bucket not already answered or skipped.
  const question = useMemo(() => {
    if (!bucket) return undefined;
    return bucket.questions.find((q) => !(q.id in answers) && !skipped.includes(q.id));
  }, [bucket, answers, skipped]);

  if (!bucket || !question) return null;

  const isPhotoOffer = question.kind === 'info' && (question.id === 'h9' || question.id === 'p9');
  const withName = (s: string) => s.replace(/\[name\]/g, loved);
  const isLastInBucket =
    bucket.questions.filter((q) => !(q.id in answers) && !skipped.includes(q.id)).length <= 1;

  const finishIfDone = () => {
    // If this was the last open question in the bucket, mark it shown so the
    // next bucket only appears after another simulated session.
    if (isLastInBucket) markDayShown();
  };

  const onSave = () => {
    const value = question.kind === 'chips' ? selected.join(', ') : text.trim();
    if (value) {
      recordAnswer(question.id, value);
      // Meaningful-dates answers seed the hard-date awareness on Home.
      if (question.id === 'h10' || question.id === 'p10') {
        useHardDatesStore.getState().captureFromText(value);
      }
      // Keep the What I Know transparency page in sync with new answers.
      useWhatIKnowStore.getState().hydrateFromSession();
    } else {
      skipQuestion(question.id);
    }
    setText('');
    setSelected([]);
    setAck('It is heard. It stays here.');
    finishIfDone();
  };

  const onSkip = () => {
    skipQuestion(question.id);
    setText('');
    setSelected([]);
    setAck(null);
    finishIfDone();
  };

  const toggleChip = (option: string) => {
    setSelected((cur) => {
      if (question.multi) {
        return cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option];
      }
      return cur.includes(option) ? [] : [option];
    });
  };

  const hasAnswer =
    question.kind === 'chips'
      ? selected.length > 0
      : question.kind === 'info' || !!text.trim();

  return (
    <View style={styles.wrap}>
      <Card reflective>
        <Text variant="sectionLabel" color="amethystText">
          A question from Westercove
        </Text>
        <Text variant="body" color="amethystText" style={styles.question}>
          {withName(question.text)}
        </Text>

        {question.kind === 'chips' ? (
          <View style={styles.chips}>
            {question.options?.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={selected.includes(option)}
                onPress={() => toggleChip(option)}
              />
            ))}
          </View>
        ) : question.kind === 'text' ? (
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={question.placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            accessibilityLabel={withName(question.text)}
            style={[styles.input, { borderColor: colors.line, color: colors.textPrimary, backgroundColor: colors.card }]}
          />
        ) : isPhotoOffer ? (
          <View style={styles.photoRow}>
            {answers[question.id] ? (
              <Image source={{ uri: answers[question.id] }} style={styles.photoThumb} contentFit="cover" />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a photo"
              onPress={async () => {
                const a = await pickImage();
                if (a) recordAnswer(question.id, a.uri);
              }}
              style={[styles.photoBtn, { borderColor: colors.forest }]}
            >
              <Text variant="cardTitle" color="forest">
                {answers[question.id] ? 'Change photo' : 'Add a photo'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Button
            label={question.kind === 'info' ? 'Okay' : 'Save'}
            variant="primary"
            fullWidth={false}
            disabled={!hasAnswer}
            onPress={onSave}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Not right now"
            onPress={onSkip}
            style={styles.skip}
          >
            <Text variant="bodySmall" color="textMuted">
              Not right now
            </Text>
          </Pressable>
        </View>

        {ack ? (
          <Text variant="bodySmall" color="amethystText" style={styles.ack}>
            {ack}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.xl },
  question: { marginTop: spacing.sm },
  input: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    minHeight: 88,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  photoThumb: { width: 56, height: 56, borderRadius: 12 },
  photoBtn: {
    borderWidth: 1.5,
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  skip: { minHeight: 44, justifyContent: 'center' },
  ack: { marginTop: spacing.md, fontStyle: 'italic' },
});
