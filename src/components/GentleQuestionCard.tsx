import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { lovedOneName } from '@/features/auth/sessionStore';
import { nextHomeQuestion, useQuestionsStore } from '@/features/questions/questionsStore';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * The inline "A gentle question" card on Home. Surfaces the next unlocked,
 * unanswered gentle question (gated by talk-time cadence — see Profile → Demo
 * Controls) with a soft textarea and Save / Not now. Renders nothing when no
 * question is unlocked or the user has set it aside for now.
 */
export function GentleQuestionCard() {
  const { colors } = useTheme();
  const talkMs = useQuestionsStore((s) => s.talkMs);
  const answers = useQuestionsStore((s) => s.answers);
  const skipped = useQuestionsStore((s) => s.skipped);
  const recordAnswer = useQuestionsStore((s) => s.recordAnswer);

  const [value, setValue] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const question = nextHomeQuestion(talkMs, answers, skipped);
  if (!question || dismissed.includes(question.id)) return null;

  const prompt = question.text.replace(/\[name\]/g, lovedOneName());

  const onSave = () => {
    if (!value.trim()) return;
    recordAnswer(question.id, value.trim());
    setValue('');
  };

  return (
    <View style={styles.wrap}>
      <Card style={{ borderTopWidth: 3, borderTopColor: colors.saffron }}>
        <Text variant="sectionLabel" color="textMuted">
          A gentle question, when you are ready
        </Text>
        <Text variant="screenTitle" style={styles.prompt}>
          {prompt}
        </Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Only if you would like to. There is no hurry."
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel={prompt}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.line }]}
        />
        <View style={styles.actions}>
          <Button label="Save" onPress={onSave} disabled={!value.trim()} />
          <Button label="Not now" variant="secondary" onPress={() => setDismissed((d) => [...d, question.id])} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  prompt: { marginTop: spacing.sm, fontSize: 19, lineHeight: 26 },
  input: {
    marginTop: spacing.md,
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
});
