import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { QUESTION_INTERVAL_MS } from '@/constants/questions';
import { spacing } from '@/theme/tokens';
import { activeDays, dueDayIndex, useQuestionsStore } from './questionsStore';

/**
 * Demo-only cadence controls (Profile). Each "journaling session" advances the
 * talk-time by one interval, unlocking the next gentle-question set on Home.
 * Mirrors the reference demo's Demo Controls block.
 */
export function DemoControls() {
  const talkMs = useQuestionsStore((s) => s.talkMs);
  const simulateSession = useQuestionsStore((s) => s.simulateSession);
  const resetProgress = useQuestionsStore((s) => s.resetProgress);

  const total = activeDays().length;
  const unlocked = Math.max(0, dueDayIndex(talkMs, total) + 1);
  const stage = Math.min(unlocked + 1, total);
  const totalMin = (talkMs / 60000).toFixed(1);
  const perSessionMin = (QUESTION_INTERVAL_MS / 60000).toFixed(0);

  return (
    <View style={styles.wrap}>
      <SectionLabel>DEMO CONTROLS</SectionLabel>
      <Card>
        <Text variant="bodySmall" color="textMuted">
          For the demo only. Each journaling session of about {perSessionMin} min unlocks the
          next set of questions.
        </Text>

        <View style={styles.stat}>
          <Text variant="bodySmall" color="textMuted">
            Cadence stage
          </Text>
          <Text variant="cardTitle">
            {stage} of {total}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="bodySmall" color="textMuted">
            This session
          </Text>
          <Text variant="cardTitle">
            {totalMin} min total
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label="Simulate a journaling session" onPress={simulateSession} />
          <Button label="Reset progress" variant="secondary" onPress={resetProgress} />
        </View>

        <Text variant="meta" color="textMuted" style={styles.note}>
          Check Home for the next gentle question.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  note: { marginTop: spacing.md },
});
