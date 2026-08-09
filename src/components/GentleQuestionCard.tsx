import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { hasCheckin, nextQuestion } from '@/features/questions/cadence';
import { cadenceState, useQuestionsStore } from '@/features/questions/questionsStore';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * The Home "gentle question" card, driven by the cadence engine
 * (features/questions/cadence.ts). Shows one eligible question at a time by
 * input type, records the answer, and lets the user set it aside or skip.
 */
export function GentleQuestionCard() {
  const { colors } = useTheme();
  const router = useRouter();

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
  const recordAnswer = useQuestionsStore((s) => s.recordAnswer);
  const skip = useQuestionsStore((s) => s.skip);
  const dismissCheckin = useQuestionsStore((s) => s.dismissCheckin);

  const state = cadenceState();
  const q = hasCheckin(state) ? nextQuestion(state) : null;

  const [text, setText] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [librarySkipped, setLibrarySkipped] = useState(false);

  useEffect(() => {
    setText('');
    setChoice(null);
    setMulti([]);
    setLibrarySkipped(false);
  }, [q?.id]);

  if (!q) return null;

  const isLibrary = q.input === 'library';
  const canSave =
    q.input === 'text' ? text.trim().length > 0 : q.input === 'choice' ? choice !== null : multi.length > 0;

  const onSave = () => {
    if (q.input === 'text') recordAnswer(q, text);
    else if (q.input === 'choice' && choice) recordAnswer(q, choice);
    else if (q.input === 'multi' && multi.length) recordAnswer(q, multi.join(', '));
  };

  const toggleMulti = (opt: string) =>
    setMulti((m) => (m.includes(opt) ? m.filter((x) => x !== opt) : [...m, opt]));

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
                onChangeText={setText}
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
                    onPress={() => setChoice(opt)}
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
              <Button label="Save" onPress={onSave} disabled={!canSave} />
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
