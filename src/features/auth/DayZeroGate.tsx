import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import type { GateAnswers, GateMode } from '@/features/auth/types';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

type StepId = 'callName' | 'lovedOneName' | 'relationship' | 'species' | 'tone';

const HUMAN_RELATIONSHIPS = [
  'Spouse or partner',
  'Child',
  'Parent',
  'Sibling',
  'Grandparent',
  'Grandchild',
  'Friend',
  'Someone else',
];
const PET_OPTION = 'A pet or animal';
const SPECIES = ['Dog', 'Cat', 'Bird', 'Horse', 'Other'];
const TONES = [
  'Gentle and warm',
  'Plain and direct',
  'Quiet and steady',
  'Encouraging and hopeful',
];

function sequence(mode: GateMode): StepId[] {
  return [
    'callName',
    'lovedOneName',
    'relationship',
    ...(mode === 'pet' ? (['species'] as StepId[]) : []),
    'tone',
  ];
}

/**
 * The day-zero gate: five questions, under two minutes, five taps. Navigation
 * is hidden for the duration, every step offers Skip and Save-and-continue-later,
 * and — a firm rule — there is NO progress bar and no completeness percentage
 * anywhere (handoff §4.4).
 */
export function DayZeroGate() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const completeGate = useSessionStore((s) => s.completeGate);

  const [answers, setAnswers] = useState<GateAnswers>({ mode: 'human', skipped: [] });
  const [stepId, setStepId] = useState<StepId>('callName');

  const steps = sequence(answers.mode);
  const index = steps.indexOf(stepId);
  const isLast = index === steps.length - 1;

  const finish = (next: GateAnswers) => completeGate(next);

  const advance = (next: GateAnswers) => {
    setAnswers(next);
    const seq = sequence(next.mode);
    const i = seq.indexOf(stepId);
    if (i >= seq.length - 1) finish(next);
    else setStepId(seq[i + 1]);
  };

  const skip = () => {
    const next = { ...answers, skipped: [...answers.skipped, stepId] };
    advance(next);
  };

  const hasAnswer = (() => {
    switch (stepId) {
      case 'callName':
        return !!answers.callName?.trim();
      case 'lovedOneName':
        return !!answers.lovedOneName?.trim();
      case 'relationship':
        return !!answers.relationship;
      case 'species':
        return !!answers.species;
      case 'tone':
        return !!answers.tone;
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.huge,
          paddingHorizontal: spacing.screen,
          paddingBottom: spacing.xxl,
          flexGrow: 1,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.gate.saveForLater}
          onPress={() => finish(answers)}
          style={styles.saveLater}
        >
          <Text variant="bodySmall" color="forest">
            {copy.gate.saveForLater}
          </Text>
        </Pressable>

        <View style={styles.qBlock}>
          <GateStep
            stepId={stepId}
            answers={answers}
            onChangeText={(field, value) =>
              setAnswers((a) => ({ ...a, [field]: value }))
            }
            onSelect={(next) => setAnswers(next)}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label={isLast ? copy.gate.done : copy.gate.next}
            disabled={!hasAnswer}
            onPress={() => advance(answers)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.gate.skip}
            onPress={skip}
            style={styles.skip}
          >
            <Text variant="bodySmall" color="textMuted">
              {copy.gate.skip}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <CrisisBanner />
    </View>
  );
}

function GateStep({
  stepId,
  answers,
  onChangeText,
  onSelect,
}: {
  stepId: StepId;
  answers: GateAnswers;
  onChangeText: (field: 'callName' | 'lovedOneName', value: string) => void;
  onSelect: (next: GateAnswers) => void;
}) {
  const { colors } = useTheme();
  const loved = answers.lovedOneName?.trim() || 'them';

  if (stepId === 'callName' || stepId === 'lovedOneName') {
    const isName = stepId === 'callName';
    return (
      <>
        <Text variant="display" accessibilityRole="header">
          {isName ? copy.gate.q1 : copy.gate.q2}
        </Text>
        <TextInput
          value={(isName ? answers.callName : answers.lovedOneName) ?? ''}
          onChangeText={(t) => onChangeText(isName ? 'callName' : 'lovedOneName', t)}
          placeholder={isName ? copy.gate.q1Placeholder : copy.gate.q2Placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={isName ? copy.gate.q1 : copy.gate.q2}
          style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
        />
      </>
    );
  }

  if (stepId === 'relationship') {
    return (
      <>
        <Text variant="display" accessibilityRole="header">
          {copy.gate.q3}
        </Text>
        <View style={styles.chips}>
          {HUMAN_RELATIONSHIPS.map((r) => (
            <Chip
              key={r}
              label={r}
              selected={answers.relationship === r && answers.mode === 'human'}
              onPress={() => onSelect({ ...answers, relationship: r, mode: 'human' })}
            />
          ))}
          <Chip
            label={PET_OPTION}
            selected={answers.mode === 'pet'}
            onPress={() =>
              onSelect({ ...answers, relationship: PET_OPTION, mode: 'pet' })
            }
          />
        </View>
      </>
    );
  }

  if (stepId === 'species') {
    return (
      <>
        <Text variant="display" accessibilityRole="header">
          {copy.gate.q4Pet.replace('[name]', loved)}
        </Text>
        <View style={styles.chips}>
          {SPECIES.map((sp) => (
            <Chip
              key={sp}
              label={sp}
              selected={answers.species === sp}
              onPress={() => onSelect({ ...answers, species: sp })}
            />
          ))}
        </View>
      </>
    );
  }

  // tone
  return (
    <>
      <Text variant="display" accessibilityRole="header">
        {copy.gate.q5}
      </Text>
      <Text variant="body" color="textMuted" style={styles.tonePrompt}>
        {copy.gate.tonePrompt}
      </Text>
      <View style={styles.chips}>
        {TONES.map((t) => (
          <Chip
            key={t}
            label={t}
            selected={answers.tone === t}
            onPress={() => onSelect({ ...answers, tone: t })}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  saveLater: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  qBlock: { flex: 1, gap: spacing.lg, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    fontSize: 17,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tonePrompt: { marginTop: -spacing.sm },
  footer: { gap: spacing.sm, marginTop: spacing.xxl },
  skip: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
