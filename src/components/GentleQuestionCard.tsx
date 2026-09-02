import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { USE_FOUR_DOORS } from '@/constants/flags';
import { lovedOneName, useSessionStore } from '@/features/auth/sessionStore';
import { useCadenceStore } from '@/features/cadence/cadenceStore';
import { services } from '@/services';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { hasCheckin, nextQuestion, questionsFor, type CadenceQuestion, type CadenceState } from '@/features/questions/cadence';
import { cadenceState, useQuestionsStore } from '@/features/questions/questionsStore';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/** What a question card does when the user answers / defers / skips. Lets the
 * same form render for either cadence source without knowing which one it is. */
interface QuestionActions {
  onAnswer: (q: CadenceQuestion, value: string) => void;
  /** "Not now". */
  onDefer: () => void;
  /** "Skip this one" (and the library "Skip" branch). */
  onSkip: (q: CadenceQuestion) => void;
}

/**
 * The Home "gentle question" card. Behind USE_FOUR_DOORS it is driven by the
 * server-owned cadence (features/cadence: `pendingQuestionIds`, which the
 * backend pre-orders — the card renders them in order and never re-sorts, and
 * deferred questions re-enter at the tail server-side). With the flag dark it
 * keeps the legacy client engine (features/questions) untouched, so prod is
 * unchanged until the 4-Doors flag flips in lockstep with the backend — the
 * same ship-dark pattern the onboarding gate uses (app/gate.tsx).
 */
export function GentleQuestionCard() {
  return USE_FOUR_DOORS ? <ServerQuestionCard /> : <LegacyQuestionCard />;
}

/** System A (legacy): client-side `journalStage` + `nextQuestion` selection. */
function LegacyQuestionCard() {
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
  if (!q) return null;
  // Keyed on the question: a new question gets a new form, rather than an
  // effect racing to clear the last answer out of the inputs.
  return (
    <QuestionForm key={q.id} q={q} state={state} onAnswer={recordAnswer} onDefer={dismissCheckin} onSkip={skip} />
  );
}

/** System B (server): render the first server-ordered pending question. The
 *  list is pre-ordered by the backend; we take `pendingQuestionIds[0]` and never
 *  re-sort. The catalog (features/questions) supplies the input/options for each
 *  id; the PROMPT STRING is the server's resolved copy (fetched below) so the
 *  cause-of-death wording matches what the companion speaks — falling back to the
 *  catalog's `q.prompt()` if the server has none. Selection and recording are
 *  server-owned. */
function ServerQuestionCard() {
  useSessionStore((s) => s.session);
  const pendingIds = useCadenceStore((s) => s.state?.pendingQuestionIds);
  const answerQuestion = useCadenceStore((s) => s.answerQuestion);
  const deferQuestion = useCadenceStore((s) => s.deferQuestion);
  const skipQuestion = useCadenceStore((s) => s.skipQuestion);

  const state = cadenceState();
  const firstId = pendingIds?.[0];

  // The server-resolved prompt, tagged with the question id it belongs to. We
  // render it only when it matches the current question, so a stale fetch (the
  // question advanced before the request returned) falls back instead of showing
  // the wrong copy — no effect-time reset needed.
  const [fetched, setFetched] = useState<{ id: string; prompt: string } | null>(null);
  useEffect(() => {
    if (!firstId) return;
    const profileId = useSessionStore.getState().session?.backendProfileId;
    if (profileId == null) return;
    let alive = true;
    void services.cadence
      .getNextQuestion(profileId)
      .then((nq) => {
        if (alive && nq) setFetched({ id: nq.id, prompt: nq.prompt });
      })
      .catch(() => {}); // 404 (flag off / not caller's profile) / offline → fallback
    return () => {
      alive = false;
    };
  }, [firstId]);
  // Ids share the pendingQuestionIds space; only trust the prompt for the id we
  // are actually rendering.
  const serverPrompt = fetched && fetched.id === firstId ? fetched.prompt : undefined;

  const q = firstId ? questionsFor(state.module).find((x) => x.id === firstId) ?? null : null;
  if (!q) return null;

  const onAnswer = (question: CadenceQuestion, value: string) => {
    void answerQuestion(question.id, value);
    // Keep the "What I Know" panel fed, as recording did under System A.
    useWhatIKnowStore.getState().addLearnedLine(question.toLine(value.trim(), lovedOneName()));
  };
  return (
    <QuestionForm
      key={q.id}
      q={q}
      state={state}
      promptText={serverPrompt}
      onAnswer={onAnswer}
      onDefer={() => void deferQuestion(q.id)}
      onSkip={(question) => void skipQuestion(question.id)}
    />
  );
}

function QuestionForm({
  q,
  state,
  promptText,
  onAnswer,
  onDefer,
  onSkip,
}: { q: CadenceQuestion; state: CadenceState; promptText?: string } & QuestionActions) {
  const { colors } = useTheme();
  const router = useRouter();

  // The server-resolved prompt wins when present (cause-of-death wording matches
  // the companion's reply); otherwise the catalog's own prompt. Legacy passes
  // none, so its wording is unchanged.
  const prompt = promptText ?? q.prompt(state.name, state);

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
    if (q.input === 'text') onAnswer(q, text);
    else if (q.input === 'choice' && choice) onAnswer(q, choice);
    else if (q.input === 'multi' && multi.length) onAnswer(q, multi.join(', '));
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
                <Button label="Okay" onPress={() => onSkip(q)} />
              </View>
            </>
          ) : (
            <>
              <Text variant="screenTitle" style={styles.prompt}>
                A quiet room of your own
              </Text>
              <Text variant="bodySmall" color="textMuted">
                {prompt}
              </Text>
              <View style={styles.actions}>
                <Button
                  label="Create your library"
                  onPress={() => {
                    onAnswer(q, 'chose to build their library');
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
              {prompt}
            </Text>

            {q.input === 'text' ? (
              <TextInput
                value={text}
                onChangeText={onChangeText}
                placeholder="Only if you would like to. There is no hurry."
                placeholderTextColor={colors.textMuted}
                multiline
                accessibilityLabel={prompt}
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
              <Button label="Not now" variant="secondary" onPress={onDefer} />
              {q.optional ? (
                <Button label="Skip this one" variant="secondary" onPress={() => onSkip(q)} />
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
