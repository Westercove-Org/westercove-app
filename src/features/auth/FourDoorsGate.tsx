import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Image } from 'expo-image';

import { CrisisBanner } from '@/components/CrisisBanner';
import { Text } from '@/components/ui/Text';
import { useProfilesStore } from '@/features/profile/profilesStore';
import { useSessionStore } from '@/features/auth/sessionStore';
import { planLimitFrom, type PlanLimit } from '@/features/billing/planLimit';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH, radii, spacing } from '@/theme/tokens';
import {
  buildGatePayload,
  canAdvance,
  D2_DETAIL_OPTIONS,
  D3_CHANGE_OPTIONS,
  D3_TIMING_OPTIONS,
  D4_SPECIES_OPTIONS,
  DOOR_OPTIONS,
  GATE_STEPS,
  TONE_OPTIONS,
  type Door,
  type GateState,
} from './fourDoorsModel';

// Carry the signup page's mountain imagery into the arrival (Wesley), so the
// feeling shifts from "registering" to "arriving somewhere safe".
const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/** Prompt wording per door for Q3 (the name / what-changed) and Q4 (the detail),
 * mirroring the backend catalog. Q1/Q2/Q5 are the same on every door. */
const Q3_PROMPT: Record<Door, string> = {
  1: 'What was their name?',
  2: 'What is their name?',
  3: 'What changed?',
  4: 'What was their name?',
};
const Q4_PROMPT: Record<Door, string> = {
  1: 'What was their relationship to you?',
  2: 'Which of these is closest right now?',
  3: 'When did it change?',
  4: 'What kind of animal were they?',
};

/**
 * The one-time 4-Doors gate (design doc §1.2): 5 sequential taps that create a
 * door-typed profile via `POST /survey/gate`. Rendered in place of the flat
 * day-zero wizard only when the USE_FOUR_DOORS flag is on. Post-gate questions
 * (spoken in chat) are a later phase — not built here.
 */
export function FourDoorsGate({
  onCreated,
  onPlanLimit,
}: {
  /** Add-a-profile mode (sv7-premium-second-profile): the parent takes the new
   * backend profile id + answers and creates/switches the profile itself,
   * instead of completing the onboarding gate. Absent = onboarding (default). */
  onCreated?: (profileId: number, answers: GateState) => void;
  /** Called instead of a generic error when the create hits a plan cap (402);
   * the parent renders the upgrade card. Absent = onboarding, which never caps. */
  onPlanLimit?: (limit: PlanLimit) => void;
} = {}) {
  const { colors } = useTheme();
  const completeFourDoorsGate = useSessionStore((s) => s.completeFourDoorsGate);

  const [answers, setAnswers] = useState<GateState>({ userName: '' });
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = GATE_STEPS[stepIndex];
  const isLast = stepIndex === GATE_STEPS.length - 1;
  const canContinue = canAdvance(step, answers) && !busy;
  const door = answers.door;

  const set = (patch: Partial<GateState>) => setAnswers((a) => ({ ...a, ...patch }));

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const { profileId } = await services.survey.submitFourDoorsGate(buildGatePayload(answers));
      // Add-a-profile mode: hand the new backend id + answers back; the parent
      // creates and switches to the profile (and navigates).
      if (onCreated) {
        onCreated(profileId, answers);
        return;
      }
      // Onboarding: the profile LABEL is the loved-one's name, not the user's
      // (self door → empty → a neutral "Profile N"). The user's name is separate.
      useProfilesStore.getState().setActiveName(answers.lovedOneName?.trim() ?? '');
      // Marks the gate complete, adopts the profile id, and copies the answers
      // into the session (door canonical, mode derived); the auth guard then
      // redirects to the tab shell.
      completeFourDoorsGate(profileId, answers);
    } catch (err) {
      // A profile cap (402) in add mode is an upgrade prompt, not an error.
      const limit = onPlanLimit ? planLimitFrom(err) : null;
      if (limit) {
        onPlanLimit?.(limit);
        setBusy(false);
        return;
      }
      setError('Something went wrong setting up your companion. Please try again.');
      setBusy(false);
    }
  };

  const advance = () => {
    if (!canContinue) return;
    if (isLast) void submit();
    else setStepIndex((i) => i + 1);
  };
  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Warm arrival: a still mountain image + "Welcome to Westercove", carried
          from signup so this reads as arriving somewhere safe, not registering.
          Deliberately static (no drifting hero) — quieter, per Wesley. */}
      <Image source={heroImage} style={styles.hero} contentFit="cover" />
      <View style={styles.header}>
        <Text variant="screenTitle" accessibilityRole="header">
          Welcome to Westercove
        </Text>
        {stepIndex === 0 ? (
          <Text variant="body" color="textMuted">
            Your space is ready.
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.qBlock}>
          {step === 'name' && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                What should your grief companion call you?
              </Text>
              <TextInput
                autoFocus
                value={answers.userName}
                onChangeText={(t) => set({ userName: t })}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="What should your grief companion call you?"
                style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
              />
            </>
          )}

          {step === 'door' && (
            <>
              <Text variant="body" color="textMuted" style={styles.lede}>
                You do not have to know what to say or where to begin. We will start gently.
              </Text>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                What brings you to Westercove?
              </Text>
              <View style={styles.options}>
                {DOOR_OPTIONS.map((o) => (
                  <OptionButton
                    key={o.door}
                    label={o.label}
                    sublabel={o.sublabel}
                    selected={answers.door === o.door}
                    onPress={() => set({ door: o.door })}
                  />
                ))}
              </View>
              <Text variant="bodySmall" color="textMuted" style={styles.changeLater}>
                You can change this later.
              </Text>
            </>
          )}

          {step === 'q3' && door != null && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {Q3_PROMPT[door]}
              </Text>
              {door === 3 ? (
                <View style={styles.options}>
                  {D3_CHANGE_OPTIONS.map((label) => (
                    <OptionButton
                      key={label}
                      label={label}
                      selected={answers.whatChanged === label}
                      onPress={() => set({ whatChanged: label })}
                    />
                  ))}
                </View>
              ) : (
                <TextInput
                  autoFocus
                  value={answers.lovedOneName ?? ''}
                  onChangeText={(t) => set({ lovedOneName: t })}
                  placeholder="Their name"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={Q3_PROMPT[door]}
                  style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
                />
              )}
            </>
          )}

          {step === 'q4' && door != null && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                {Q4_PROMPT[door]}
              </Text>
              {door === 1 && (
                <TextInput
                  autoFocus
                  value={answers.relationship ?? ''}
                  onChangeText={(t) => set({ relationship: t })}
                  placeholder="For example, my mother, my closest friend"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={Q4_PROMPT[1]}
                  style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
                />
              )}
              {door === 2 && (
                <View style={styles.options}>
                  {D2_DETAIL_OPTIONS.map((o) => (
                    <OptionButton
                      key={o.subtype}
                      label={o.label}
                      selected={answers.door2Detail === o.label}
                      onPress={() => set({ door2Detail: o.label })}
                    />
                  ))}
                </View>
              )}
              {door === 3 && (
                <View style={styles.options}>
                  {D3_TIMING_OPTIONS.map((label) => (
                    <OptionButton
                      key={label}
                      label={label}
                      selected={answers.changeTiming === label}
                      onPress={() => set({ changeTiming: label })}
                    />
                  ))}
                </View>
              )}
              {door === 4 && (
                <>
                  <View style={styles.options}>
                    {D4_SPECIES_OPTIONS.map((label) => (
                      <OptionButton
                        key={label}
                        label={label}
                        selected={answers.species === label}
                        onPress={() => set({ species: label })}
                      />
                    ))}
                  </View>
                  <TextInput
                    value={answers.breed ?? ''}
                    onChangeText={(t) => set({ breed: t })}
                    placeholder="Breed (optional)"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Breed, optional"
                    style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
                  />
                </>
              )}
            </>
          )}

          {step === 'tone' && (
            <>
              <Text variant="screenTitle" style={styles.question} accessibilityRole="header">
                Everyone needs something different. How would you like me to be with you?
              </Text>
              <View style={styles.options}>
                {TONE_OPTIONS.map((t) => (
                  <OptionButton
                    key={t.value}
                    label={t.label}
                    selected={answers.toneLabel === t.label}
                    onPress={() => set({ toneLabel: t.label })}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {error ? (
          <Text variant="bodySmall" color="textPrimary" accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {stepIndex > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={back}
              style={[styles.secondaryBtn, { borderColor: colors.line }]}
            >
              <Text variant="cardTitle">Back</Text>
            </Pressable>
          ) : null}
          <View style={styles.grow} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Done' : 'Next'}
            disabled={!canContinue}
            onPress={advance}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: colors.heading },
              !canContinue && { opacity: 0.4 },
              pressed && canContinue && { opacity: 0.9 },
            ]}
          >
            <Text variant="cardTitle" color="onAccent">
              {isLast ? (busy ? 'Setting up…' : 'Done') : 'Next'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <CrisisBanner />
    </View>
  );
}

function OptionButton({
  label,
  sublabel,
  selected,
  onPress,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
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
      {sublabel ? (
        <Text variant="bodySmall" color={selected ? 'onAccent' : 'textMuted'} style={styles.sublabel}>
          {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Full-bleed mountain banner (warm arrival), then the header text + body in
  // the same 640 centered column the rest of the app uses (one consistent width).
  hero: { width: '100%', height: 160 },
  header: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  body: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.screen,
    paddingBottom: 96,
    gap: spacing.lg,
  },
  qBlock: { gap: spacing.md, paddingTop: spacing.lg },
  lede: { fontSize: 16, lineHeight: 24 },
  changeLater: { marginTop: spacing.xs },
  sublabel: { marginTop: spacing.xs },
  question: { marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    fontSize: 15,
  },
  options: { gap: spacing.sm },
  option: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  error: { marginTop: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  continueBtn: {
    borderRadius: radii.card,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
  },
});
