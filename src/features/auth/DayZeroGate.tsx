import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CrisisBanner } from '@/components/CrisisBanner';
import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useProfilesStore } from '@/features/profiles/profilesStore';
import type { GateAnswers, GateMode } from '@/features/auth/types';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

type StepId = 'callName' | 'lovedOneName' | 'relationship' | 'species' | 'tone';

const HUMAN_RELATIONSHIPS = [
  'My spouse or partner',
  'My child',
  'My parent',
  'My sibling',
  'My grandparent',
  'My grandchild',
  'My friend',
  'A family member',
  'Someone like family to me',
];
const PET_OPTION = 'My pet or animal companion';
const OTHER_OPTION = 'Other';
const SPECIES = ['Dog', 'Cat', 'Bird', 'Horse', 'Other'];
const TONES: { label: string; description: string }[] = [
  { label: 'Gentle and warm', description: 'Soft, present, unhurried.' },
  { label: 'Direct and plain', description: 'Clear, honest, no softening.' },
  { label: 'Quiet and minimal', description: 'Short replies, lots of space.' },
  { label: 'Spiritual', description: 'Room for the unseen and the sacred.' },
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
 * The day-zero gate: a few gentle questions under two minutes. Navigation is
 * hidden for the duration, every step offers Skip and Save-and-continue-later,
 * and — a firm rule — there is NO progress bar and no completeness percentage.
 * The "Step X of N" indicator counts taps, not completion.
 */
export function DayZeroGate() {
  const { colors } = useTheme();
  const completeGate = useSessionStore((s) => s.completeGate);
  const markActiveSetUp = useProfilesStore((s) => s.markActiveSetUp);
  const profiles = useProfilesStore((s) => s.profiles);
  const activeId = useProfilesStore((s) => s.activeId);
  const switchProfile = useProfilesStore((s) => s.switchProfile);
  const deleteProfile = useProfilesStore((s) => s.deleteProfile);

  // Only an *additional* profile can be cancelled — there must be another,
  // already-set-up profile to fall back to. First-run has no fallback.
  const fallback = profiles.find((p) => p.id !== activeId && p.setUp);

  const cancel = async () => {
    if (!activeId || !fallback) return;
    // Switch to the set-up profile first (its stores rehydrate → the auth guard
    // routes to Home), then drop the blank profile we're abandoning.
    await switchProfile(fallback.id);
    await deleteProfile(activeId);
  };

  const [answers, setAnswers] = useState<GateAnswers>({ mode: 'human', skipped: [] });
  const [stepId, setStepId] = useState<StepId>('callName');

  const steps = sequence(answers.mode);
  const index = steps.indexOf(stepId);
  const isLast = index === steps.length - 1;

  const finish = (next: GateAnswers) => {
    markActiveSetUp(next.callName ?? '');
    completeGate(next);
  };

  const advance = (next: GateAnswers) => {
    setAnswers(next);
    const seq = sequence(next.mode);
    const i = seq.indexOf(stepId);
    if (i >= seq.length - 1) finish(next);
    else setStepId(seq[i + 1]);
  };

  const back = () => {
    if (index > 0) setStepId(steps[index - 1]);
  };

  const skip = () => advance({ ...answers, skipped: [...answers.skipped, stepId] });

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
      <HeroHeader
        variant="compact"
        image="wildflowers"
        title="Getting to know you"
        subtitle={`Step ${index + 1} of ${steps.length}`}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screen,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxl,
          flexGrow: 1,
        }}
      >
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
          <View style={styles.footerRow}>
            {index > 0 ? (
              <Button label="Back" variant="secondary" fullWidth={false} onPress={back} />
            ) : fallback ? (
              <Button
                label="Cancel"
                variant="secondary"
                fullWidth={false}
                onPress={() => void cancel()}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <Button
              label={isLast ? copy.gate.done : copy.gate.next}
              variant="primary"
              fullWidth={false}
              disabled={!hasAnswer}
              onPress={() => advance(answers)}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.gate.saveForLater}
            onPress={() => finish(answers)}
            style={styles.skip}
          >
            <Text variant="bodySmall" color="textMuted">
              {copy.gate.saveForLater}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <CrisisBanner />
    </View>
  );
}

/** A full-width selectable row (relationship, species, tone), matching the demo. */
function SelectRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      onPress={onPress}
      style={[
        styles.row,
        { borderColor: colors.line, backgroundColor: colors.card },
        selected && { backgroundColor: colors.amethystText, borderColor: colors.amethystText },
      ]}
    >
      <Text variant="cardTitle" color={selected ? 'onAccent' : 'textPrimary'}>
        {label}
      </Text>
      {description ? (
        <Text
          variant="bodySmall"
          color={selected ? 'onAccent' : 'textMuted'}
          style={styles.rowSub}
        >
          {description}
        </Text>
      ) : null}
    </Pressable>
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
          style={[styles.input, { borderColor: colors.forest, color: colors.textPrimary }]}
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
        <View style={styles.rows}>
          {HUMAN_RELATIONSHIPS.map((r) => (
            <SelectRow
              key={r}
              label={r}
              selected={answers.relationship === r && answers.mode === 'human'}
              onPress={() => onSelect({ ...answers, relationship: r, mode: 'human' })}
            />
          ))}
          <SelectRow
            label={PET_OPTION}
            selected={answers.mode === 'pet'}
            onPress={() => onSelect({ ...answers, relationship: PET_OPTION, mode: 'pet' })}
          />
          <SelectRow
            label={OTHER_OPTION}
            selected={answers.relationship === OTHER_OPTION && answers.mode === 'human'}
            onPress={() => onSelect({ ...answers, relationship: OTHER_OPTION, mode: 'human' })}
          />
        </View>
      </>
    );
  }

  if (stepId === 'species') {
    const loved = answers.lovedOneName?.trim() || 'them';
    return (
      <>
        <Text variant="display" accessibilityRole="header">
          {copy.gate.q4Pet.replace('[name]', loved)}
        </Text>
        <View style={styles.rows}>
          {SPECIES.map((sp) => (
            <SelectRow
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
      <View style={styles.rows}>
        {TONES.map((t) => (
          <SelectRow
            key={t.label}
            label={t.label}
            description={t.description}
            selected={answers.tone === t.label}
            onPress={() => onSelect({ ...answers, tone: t.label })}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  qBlock: { flex: 1, gap: spacing.lg },
  input: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    fontSize: 15,
    lineHeight: 22,
  },
  rows: { gap: spacing.sm },
  row: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  rowSub: { marginTop: 2 },
  tonePrompt: { marginTop: -spacing.sm },
  footer: { gap: spacing.md, marginTop: spacing.xxl },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  skip: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
