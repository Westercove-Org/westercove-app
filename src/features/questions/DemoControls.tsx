import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { spacing } from '@/theme/tokens';
import { MAX_STAGE } from './cadence';
import { useQuestionsStore } from './questionsStore';

/**
 * Demo-only cadence controls (Profile). Each "journaling session" advances the
 * cadence one stage, unlocking the next gentle-question set on Home. Mirrors the
 * reference demo.
 */
export function DemoControls() {
  const stage = useQuestionsStore((s) => s.journalStage);
  const journalSeconds = useQuestionsStore((s) => s.journalSeconds);
  const sessionJournalSeconds = useQuestionsStore((s) => s.sessionJournalSeconds);
  const simulateSession = useQuestionsStore((s) => s.simulateSession);
  const resetProgress = useQuestionsStore((s) => s.resetProgress);
  const module = useSessionStore((s) => s.session?.gateAnswers.mode ?? 'pet');

  const sessionMin = (sessionJournalSeconds / 60).toFixed(1);
  const totalMin = (journalSeconds / 60).toFixed(0);

  return (
    <View style={styles.wrap}>
      <SectionLabel>DEMO CONTROLS</SectionLabel>
      <Card>
        <Text variant="bodySmall" color="textMuted">
          For the demo only. Each journaling session of about 1 min unlocks the next set of
          questions.
        </Text>

        <View style={styles.stat}>
          <Text variant="bodySmall" color="textMuted">
            Cadence stage
          </Text>
          <Text variant="cardTitle">
            {stage} of {MAX_STAGE}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="bodySmall" color="textMuted">
            This session
          </Text>
          <Text variant="cardTitle">
            {sessionMin} min · {totalMin} min total
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label="Simulate a journaling session" onPress={simulateSession} />
          <Button label="Reset progress" variant="secondary" onPress={resetProgress} />
        </View>

        <Text variant="meta" color="textMuted" style={styles.note}>
          Currently {module} module. Check Home for the next gentle question.
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
