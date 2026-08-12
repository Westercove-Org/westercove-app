import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useProfilesStore } from '@/features/profile/profilesStore';
import type { GateAnswers, GateMode } from '@/features/auth/types';
import type { ToneLabel } from '@/services/companionPrompt';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const meadow = require('../../../assets/images/westercove_meadow_white.jpg');
const icon = require('../../../assets/images/westercove_icon.png');
const wordmark = require('../../../assets/images/westercove_wordmark.png');

type StepId = 'callName' | 'lovedOneName' | 'relationship' | 'species' | 'breed' | 'tone';

const PET_OPTION = 'My pet or animal companion';
const RELATIONSHIPS = [
  'My spouse or partner',
  'My child',
  'My parent',
  'My sibling',
  'My grandparent',
  'My grandchild',
  'My friend',
  'A family member',
  'Someone like family to me',
  PET_OPTION,
  'Other',
];
const TONES: { label: ToneLabel; desc: string }[] = [
  { label: 'Gentle and warm', desc: 'Soft, present, unhurried.' },
  { label: 'Direct and plain', desc: 'Clear, honest, no softening.' },
  { label: 'Quiet and minimal', desc: 'Short replies, lots of space.' },
  { label: 'Spiritual', desc: 'Room for the unseen and the sacred.' },
];

/** Step order for the onboarding — the pet branch (kind + breed) is inserted
 * only when the loved one is a pet. */
export function sequence(mode: GateMode): StepId[] {
  return [
    'callName',
    'lovedOneName',
    'relationship',
    ...(mode === 'pet' ? (['species', 'breed'] as StepId[]) : []),
    'tone',
  ];
}

/**
 * Day-zero onboarding: one gentle question per card, matching the demo. The pet
 * branch (kind + breed) appears only when the loved one is a pet, and the kind
 * question uses the entered name. No progress bar percentage — just "Step X of N".
 */
export function DayZeroGate() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const completeGate = useSessionStore((s) => s.completeGate);

  const [answers, setAnswers] = useState<GateAnswers>({ mode: 'human', skipped: [] });
  const [stepId, setStepId] = useState<StepId>('callName');

  const steps = sequence(answers.mode);
  const index = Math.max(0, steps.indexOf(stepId));
  const total = steps.length;
  const isLast = index === total - 1;
  const them = answers.lovedOneName?.trim() || 'them';

  const advance = (next: GateAnswers) => {
    const seq = sequence(next.mode);
    const i = seq.indexOf(stepId);
    if (i >= seq.length - 1) {
      completeGate(next);
      // Label this test profile with the name the user chose.
      useProfilesStore.getState().setActiveName(next.callName?.trim() ?? '');
    } else {
      setStepId(seq[i + 1]);
    }
  };

  const back = () => {
    const i = steps.indexOf(stepId);
    if (i > 0) setStepId(steps[i - 1]);
  };

  const setText = (field: 'callName' | 'lovedOneName' | 'species' | 'breed', value: string) =>
    setAnswers((a) => ({ ...a, [field]: value }));

  // Continue is only gated on the relationship step (a choice is required).
  const canContinue = stepId !== 'relationship' || !!answers.relationship;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Image source={meadow} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(246,241,231,0.2)', 'rgba(246,241,231,0)', 'rgba(246,241,231,0.9)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Westercove">
          <Image source={icon} style={styles.icon} contentFit="contain" />
          <Image source={wordmark} style={styles.wordmark} contentFit="contain" />
        </View>
        <Text variant="screenTitle" accessibilityRole="header" style={styles.title}>
          {copy.gate.title}
        </Text>
        <Text variant="bodySmall" color="textMuted">
          {copy.gate.step} {index + 1} of {total}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={styles.qBlock}>
          {(stepId === 'callName' || stepId === 'lovedOneName') && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {stepId === 'callName' ? copy.gate.q1 : copy.gate.q2}
              </Text>
              <TextInput
                autoFocus
                value={(stepId === 'callName' ? answers.callName : answers.lovedOneName) ?? ''}
                onChangeText={(t) => setText(stepId, t)}
                placeholder={stepId === 'callName' ? copy.gate.q1Placeholder : copy.gate.q2Placeholder}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
              />
            </>
          )}

          {stepId === 'relationship' && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {copy.gate.q3}
              </Text>
              <View style={styles.options}>
                {RELATIONSHIPS.map((r) => (
                  <OptionButton
                    key={r}
                    label={r}
                    selected={answers.relationship === r}
                    onPress={() =>
                      setAnswers((a) => ({
                        ...a,
                        relationship: r,
                        mode: r === PET_OPTION ? 'pet' : 'human',
                      }))
                    }
                  />
                ))}
              </View>
            </>
          )}

          {stepId === 'species' && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {copy.gate.q4Pet.replace('[name]', them)}
              </Text>
              <TextInput
                autoFocus
                value={answers.species ?? ''}
                onChangeText={(t) => setText('species', t)}
                placeholder={copy.gate.q4PetPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
              />
            </>
          )}

          {stepId === 'breed' && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {copy.gate.q4Breed}
              </Text>
              <Text variant="bodySmall" color="textMuted">
                {copy.gate.q4BreedHint}
              </Text>
              <TextInput
                value={answers.breed ?? ''}
                onChangeText={(t) => setText('breed', t)}
                placeholder={copy.gate.q4BreedPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
              />
            </>
          )}

          {stepId === 'tone' && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {copy.gate.q5}
              </Text>
              <Text variant="bodySmall" color="textMuted">
                {copy.gate.tonePrompt}
              </Text>
              <View style={styles.options}>
                {TONES.map((t) => (
                  <OptionButton
                    key={t.label}
                    label={t.label}
                    desc={t.desc}
                    selected={answers.tone === t.label}
                    onPress={() => setAnswers((a) => ({ ...a, tone: t.label }))}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          {index > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.gate.back}
              onPress={back}
              style={[styles.secondaryBtn, { borderColor: colors.line }]}
            >
              <Text variant="cardTitle">{copy.gate.back}</Text>
            </Pressable>
          ) : null}
          {stepId === 'breed' && !answers.breed?.trim() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.gate.skip}
              onPress={() => advance(answers)}
              style={[styles.secondaryBtn, { borderColor: colors.line }]}
            >
              <Text variant="cardTitle" color="textMuted">
                {copy.gate.skip}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.grow} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? copy.gate.done : copy.gate.next}
            disabled={!canContinue}
            onPress={() => advance(answers)}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: colors.heading },
              !canContinue && { opacity: 0.4 },
              pressed && canContinue && { opacity: 0.9 },
            ]}
          >
            <Text variant="cardTitle" color="onAccent" style={styles.continueText}>
              {isLast ? copy.gate.done : copy.gate.next}
            </Text>
          </Pressable>
        </View>

        {answers.tone ? (
          <Text variant="bodySmall" color="textMuted" style={styles.chose}>
            You chose: {answers.tone}
          </Text>
        ) : null}
      </ScrollView>

      <CrisisBanner />
    </View>
  );
}

function OptionButton({
  label,
  desc,
  selected,
  onPress,
}: {
  label: string;
  desc?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={desc ? `${label}. ${desc}` : label}
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: selected ? colors.heading : colors.line },
        selected && { backgroundColor: colors.heading },
      ]}
    >
      <Text variant="cardTitle" color={selected ? 'onAccent' : 'textPrimary'}>
        {label}
      </Text>
      {desc ? (
        <Text
          variant="bodySmall"
          color={selected ? 'onAccent' : 'textMuted'}
          style={styles.optionDesc}
        >
          {desc}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xxl },
  icon: { width: 24, height: 24 },
  wordmark: { width: 84, height: 15 },
  title: { marginBottom: 2 },
  scroll: { flex: 1 },
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 96,
  },
  qBlock: { gap: spacing.md },
  question: { fontSize: 24, lineHeight: 30 },
  input: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    fontSize: 17,
    lineHeight: 24,
  },
  options: { gap: spacing.sm, marginTop: spacing.xs },
  option: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  optionDesc: { marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  grow: { flex: 1 },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtn: {
    borderRadius: 28,
    paddingHorizontal: spacing.xxl,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { fontSize: 17 },
  chose: { marginTop: spacing.md, textAlign: 'center' },
});
