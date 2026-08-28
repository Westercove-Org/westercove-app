import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { hasCheckin, nextQuestion, type CadenceQuestion } from '@/features/questions/cadence';
import { cadenceState, useQuestionsStore } from '@/features/questions/questionsStore';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * The Home "gentle question" card, driven by the cadence engine
 * (features/questions/cadence.ts). Shows one eligible question at a time by
 * input type, records the answer, and lets the user set it aside or skip.
 */
export function GentleQuestionCard() {
  // Subscribe to the fields that affect which question shows, so the card
  // re-renders as the cadence changes.
  useQuestionsStore((s) => s.journalStage);
  useQuestionsStore((s) => s.answeredIds);
  useQuestionsStore((s) => s.sessionCount);
  useQuestionsStore((s) => s.checkinSnoozeSession);
  useQuestionsStore((s) => s.faithLanguage);
  useQuestionsStore((s) => s.faithTradition);
  useQuestionsStore((s) => s.causeOfDeath);
  useSessionStore((s) => s.session);
  const state = cadenceState();
  const q = hasCheckin(state) ? nextQuestion(state) : null;
  if (!q) return null;
  // Keyed on the question: a new question gets a new form, rather than an
  // effect racing to clear the last answer out of the inputs.
  return <QuestionForm key={q.id} q={q} />;
}

function QuestionForm({ q }: { q: CadenceQuestion }) {
  const { colors } = useTheme();
  const state = cadenceState();
  const router = useRouter();
  const recordAnswer = useQuestionsStore((s) => s.recordAnswer);
  const skip = useQuestionsStore((s) => s.skip);
  const dismissCheckin = useQuestionsStore((s) => s.dismissCheckin);

  const [text, setText] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [librarySkipped, setLibrarySkipped] = useState(false);
  // Recording the answer advances the card, but that re-render is async — so
  // without immediate feedback the Save button stays live and a second tap
  // fires a duplicate save before the card moves on. Latch on save: disable +
  // confirm, and reset if the user edits the answer (card lingering edge case).
  const [saved, setSaved] = useState(false);

  const isLibrary = q.input === 'library';
  const canSave =
    q.input === 'text' ? text.trim().length > 0 : q.input === 'choice' ? choice !== null : multi.length > 0;

  const onSave = () => {
    if (saved) return;
    setSaved(true);
    if (q.input === 'text') recordAnswer(q, text);
    else if (q.input === 'choice' && choice) recordAnswer(q, choice);
    else if (q.input === 'multi' && multi.length) recordAnswer(q, multi.join(', '));
  };

  const onChangeText = (t: string) => {
    setText(t);
    if (saved) setSaved(false);
  };
  const onChoose = (opt: string) => {
    setChoice(opt);
    if (saved) setSaved(false);
  };
  const toggleMulti = (opt: string) => {
    if (saved) setSaved(false);
    setMulti((m) => (m.includes(opt) ? m.filter((x) => x !== opt) : [...m, opt]));
  };

  return (
    <View style={styles.wrap}>
      <Card style={{ borderTopWidth: 3, borderTopColor: colors.saffron }}>
        <Text variant="sectionLabel" color="textMuted">
          {isLibrary ? 'A library of your own' : 'A gentle question, when you are ready'}
        </Text>

        {isLibrary ? (
          librarySkipped ? (
            <>
              <Text variant="body" style={styles.prompt}>
                That is completely alright. Whenever it feels more comfortable, you can build your
                library from Discover, and add to it any time.
              </Text>
              <View style={styles.actions}>
                <Button label="Okay" onPress={() => skip(q)} />
              </View>
            </>
          ) : (
            <>
              <Text variant="screenTitle" style={styles.prompt}>
                A quiet room of your own
              </Text>
              <Text variant="bodySmall" color="textMuted">
                {q.prompt(state.name, state)}
              </Text>
              <View style={styles.actions}>
                <Button
                  label="Create your library"
                  onPress={() => {
                    recordAnswer(q, 'chose to build their library');
                    router.push('/discover');
                  }}
                />
                <Button label="Skip" variant="secondary" onPress={() => setLibrarySkipped(true)} />
              </View>
            </>
          )
        ) : (
          <>
            <Text variant="screenTitle" style={styles.prompt}>
              {q.prompt(state.name, state)}
            </Text>

            {q.input === 'text' ? (
              <TextInput
                value={text}
                onChangeText={onChangeText}
                placeholder="Only if you would like to. There is no hurry."
                placeholderTextColor={colors.textMuted}
                multiline
                accessibilityLabel={q.prompt(state.name, state)}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.line }]}
              />
            ) : null}

            {q.input === 'choice' ? (
              <View style={styles.options}>
                {q.options?.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={choice === opt}
                    onPress={() => onChoose(opt)}
                  />
                ))}
              </View>
            ) : null}

            {q.input === 'multi' ? (
              <View style={styles.options}>
                {q.options?.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={multi.includes(opt)}
                    onPress={() => toggleMulti(opt)}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                label={saved ? 'Saved ✓' : 'Save'}
                onPress={onSave}
                disabled={!canSave || saved}
              />
              <Button label="Not now" variant="secondary" onPress={dismissCheckin} />
              {q.optional ? (
                <Button label="Skip this one" variant="secondary" onPress={() => skip(q)} />
              ) : null}
            </View>
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  prompt: { marginTop: spacing.sm, fontSize: 19, lineHeight: 26 },
  input: {
    marginTop: spacing.md,
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
