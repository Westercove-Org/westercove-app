import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';
import type { Question } from '@/constants/questions';
import { activeDays, useQuestionsStore } from './questionsStore';

/**
 * Presents one Day bucket's questions one at a time, reusing the day-zero gate's
 * step style: a display-size prompt, a text field or Chip grid, and a
 * Continue/Skip footer. Answers are written to the questions store as the user
 * goes; the last question calls markDayShown() and closes the flow.
 */
export function DayQuestionFlow({ dayIndex, onDone }: { dayIndex: number; onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const recordAnswer = useQuestionsStore((s) => s.recordAnswer);
  const skipQuestion = useQuestionsStore((s) => s.skipQuestion);
  const markDayShown = useQuestionsStore((s) => s.markDayShown);
  const loved = useSessionStore((s) => s.session?.gateAnswers.lovedOneName)?.trim() || 'them';

  const days = activeDays();
  const bucket = days[dayIndex];

  const [qIndex, setQIndex] = useState(0);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  if (!bucket) {
    // Defensive: nothing to show — close immediately.
    return null;
  }

  const question = bucket.questions[qIndex];
  const isLast = qIndex === bucket.questions.length - 1;
  const withName = (s: string) => s.replace(/\[name\]/g, loved);

  const resetInputs = () => {
    setText('');
    setSelected([]);
  };

  const advance = () => {
    if (isLast) {
      markDayShown();
      onDone();
    } else {
      setQIndex((i) => i + 1);
      resetInputs();
    }
  };

  const onContinue = () => {
    const value =
      question.kind === 'chips' ? selected.join(', ') : text.trim();
    if (value) recordAnswer(question.id, value);
    else skipQuestion(question.id); // an offer left blank counts as skipped
    advance();
  };

  const onSkip = () => {
    skipQuestion(question.id);
    advance();
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
    question.kind === 'chips' ? selected.length > 0 : question.kind === 'info' || !!text.trim();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onSkip}>
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.xxl,
            paddingHorizontal: spacing.screen,
            paddingBottom: spacing.xxl,
            flexGrow: 1,
          }}
        >
          <Text variant="sectionLabel" color="forest" style={styles.dayLabel}>
            {bucket.label}
          </Text>

          <View style={styles.qBlock}>
            <QuestionStep
              question={question}
              text={text}
              selected={selected}
              onChangeText={setText}
              onToggleChip={toggleChip}
              withName={withName}
            />
          </View>

          <View style={styles.footer}>
            <Button
              label={isLast ? 'Done' : 'Continue'}
              disabled={!hasAnswer && question.kind !== 'info'}
              onPress={onContinue}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip"
              onPress={onSkip}
              style={styles.skip}
            >
              <Text variant="bodySmall" color="textMuted">
                Skip
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function QuestionStep({
  question,
  text,
  selected,
  onChangeText,
  onToggleChip,
  withName,
}: {
  question: Question;
  text: string;
  selected: string[];
  onChangeText: (t: string) => void;
  onToggleChip: (option: string) => void;
  withName: (s: string) => string;
}) {
  const { colors } = useTheme();

  return (
    <>
      <Text variant="display" accessibilityRole="header">
        {withName(question.text)}
      </Text>

      {question.kind === 'chips' ? (
        <View style={styles.chips}>
          {question.options?.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={selected.includes(option)}
              onPress={() => onToggleChip(option)}
            />
          ))}
        </View>
      ) : question.kind === 'text' ? (
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={question.placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel={withName(question.text)}
          style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  dayLabel: {},
  qBlock: { flex: 1, gap: spacing.lg, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    minHeight: 96,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { gap: spacing.sm, marginTop: spacing.xxl },
  skip: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
