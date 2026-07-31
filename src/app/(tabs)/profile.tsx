import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { CheckIcon, PlusIcon, SignOutIcon, TrashIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useProfilesStore } from '@/features/profiles/profilesStore';
import { activeDays } from '@/features/questions/questionsStore';
import { useCadenceStore } from '@/features/questions/demoCadenceStore';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { useTheme, useThemeMode, type ThemeMode } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: copy.appearance.system },
  { mode: 'light', label: copy.appearance.light },
  { mode: 'dark', label: copy.appearance.dark },
];

type Row = { label: string; subtitle?: string; section: string };

const YOUR_SPACE: Row[] = [
  { label: 'Loved-one profiles', subtitle: 'Human or pet', section: 'loved-ones' },
  { label: 'Memories', section: 'memories' },
  { label: 'Anniversaries and Hard Dates', section: 'anniversaries' },
  { label: 'Stabilizing Practices', section: 'practices' },
  { label: 'Grief Patterns', section: 'patterns' },
  {
    label: 'What I Know',
    subtitle: 'What the companion has learned, editable',
    section: 'what-i-know',
  },
  { label: 'Custom commands', subtitle: 'Define your own', section: 'custom-commands' },
  { label: 'Export', section: 'export' },
];

const SETTINGS: Row[] = [
  { label: 'Account', section: 'account' },
  { label: 'Subscription', section: 'subscription' },
  { label: 'Help', section: 'help' },
  { label: 'Legal', subtitle: 'Terms, Privacy, Disclaimer', section: 'legal' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const now = new Date();

  const profiles = useProfilesStore((s) => s.profiles);
  const activeId = useProfilesStore((s) => s.activeId);
  const createProfile = useProfilesStore((s) => s.createProfile);
  const switchProfile = useProfilesStore((s) => s.switchProfile);
  const deleteProfile = useProfilesStore((s) => s.deleteProfile);
  const signOut = useProfilesStore((s) => s.signOut);

  const { mode, setMode } = useThemeMode();
  const tone = useSessionStore((s) => s.session?.gateAnswers.tone);
  const stage = useCadenceStore((s) => s.stage);
  const sessionMinutes = useCadenceStore((s) => s.sessionMinutes);
  const totalMinutes = useCadenceStore((s) => s.totalMinutes);
  const simulateSession = useCadenceStore((s) => s.simulateSession);
  const resetProgress = useCadenceStore((s) => s.resetProgress);
  const totalStages = activeDays().length;

  const confirmStartNew = () => {
    Alert.alert(
      copy.testProfiles.startNew,
      'This creates a new profile and walks you through setup. You can cancel from the first step.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => void createProfile() },
      ],
    );
  };

  const go = (section: string) => {
    if (section === 'what-i-know') router.push('/profile/what-i-know');
    else if (section === 'subscription') router.push('/subscription');
    else if (section === 'export') router.push('/export');
    else if (section === 'account') router.push('/account');
    else router.push({ pathname: '/profile/[section]', params: { section } });
  };

  const renderRows = (rows: Row[]) => (
    <Card padded={false}>
      {rows.map((row, i) => (
        <ListRow
          key={row.label}
          label={row.label}
          subtitle={row.subtitle}
          divider={i < rows.length - 1}
          onPress={() => go(row.section)}
        />
      ))}
    </Card>
  );

  return (
    <Screen header={{ title: 'Profile', subtitle: formatHeaderDateTime(now), image: 'hills' }}>
      {/* TEST PROFILES ----------------------------------------------------- */}
      <SectionLabel>{copy.testProfiles.label}</SectionLabel>
      <View style={styles.cardWrap}>
        <Card>
          <Text variant="bodySmall" color="textMuted">
            {copy.testProfiles.intro}
          </Text>
          <View style={styles.profileList}>
            {profiles.map((p) => {
              const active = p.id === activeId;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={p.setUp ? p.label : copy.testProfiles.notSetUp}
                  onPress={() => void switchProfile(p.id)}
                  style={[
                    styles.profileRow,
                    { borderColor: active ? colors.emerald : colors.line },
                  ]}
                >
                  <View style={[styles.pAvatar, { backgroundColor: colors.emerald }]}>
                    <Text color="onAccent" style={styles.pAvatarText}>
                      {p.avatar}
                    </Text>
                  </View>
                  <Text variant="cardTitle" style={styles.pName}>
                    {p.setUp ? p.label : copy.testProfiles.notSetUp}
                  </Text>
                  {active ? (
                    <CheckIcon size={20} color={colors.emerald} />
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={copy.testProfiles.delete}
                      hitSlop={8}
                      onPress={() => void deleteProfile(p.id)}
                    >
                      <TrashIcon size={20} color={colors.textMuted} />
                    </Pressable>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.testProfiles.startNew}
              onPress={confirmStartNew}
              style={[styles.startNew, { borderColor: colors.emerald }]}
            >
              <PlusIcon size={18} color={colors.emerald} />
              <Text variant="cardTitle" color="emerald">
                {copy.testProfiles.startNew}
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>

      <View style={styles.cardWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.testProfiles.signOut}
          onPress={signOut}
          style={[styles.signOut, { borderColor: colors.line, backgroundColor: colors.card }]}
        >
          <SignOutIcon size={20} color={colors.textPrimary} />
          <Text variant="cardTitle">{copy.testProfiles.signOut}</Text>
        </Pressable>
      </View>

      {/* YOUR SPACE -------------------------------------------------------- */}
      <SectionLabel>{copy.profile.yourSpace}</SectionLabel>
      <View style={styles.cardWrap}>{renderRows(YOUR_SPACE)}</View>

      {/* COMPANION TONE ---------------------------------------------------- */}
      <SectionLabel>{copy.demoControls.tone}</SectionLabel>
      <View style={styles.cardWrap}>
        <Card>
          <Text variant="bodySmall" color="textMuted">
            {copy.demoControls.currently}
          </Text>
          <Text variant="screenTitle" style={styles.toneValue}>
            {tone ?? 'Gentle and warm'}
          </Text>
        </Card>
      </View>

      {/* DEMO CONTROLS ----------------------------------------------------- */}
      <SectionLabel>{copy.demoControls.label}</SectionLabel>
      <View style={styles.cardWrap}>
        <Card>
          <Text variant="bodySmall" color="textMuted">
            {copy.demoControls.intro}
          </Text>
          <View style={styles.cadenceRow}>
            <View>
              <Text variant="cardTitle">{copy.demoControls.stage}</Text>
              <Text variant="bodySmall" color="textMuted">
                {copy.demoControls.thisSession}
              </Text>
            </View>
            <View style={styles.cadenceRight}>
              <Text variant="screenTitle">{`${Math.min(stage, totalStages)} of ${totalStages}`}</Text>
              <Text variant="bodySmall" color="textMuted">
                {`${sessionMinutes.toFixed(1)} min · ${totalMinutes} min total`}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.demoControls.simulate}
            onPress={simulateSession}
            style={[styles.simulate, { backgroundColor: colors.forest }]}
          >
            <Text color="onAccent" variant="cardTitle">
              {copy.demoControls.simulate}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.demoControls.reset}
            onPress={resetProgress}
            style={[styles.reset, { borderColor: colors.line }]}
          >
            <Text variant="cardTitle" color="textMuted">
              {copy.demoControls.reset}
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* APPEARANCE -------------------------------------------------------- */}
      <SectionLabel>{copy.appearance.label}</SectionLabel>
      <View style={styles.cardWrap}>
        <Card>
          <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
            {APPEARANCE_OPTIONS.map((opt) => {
              const active = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={opt.label}
                  onPress={() => setMode(opt.mode)}
                  style={[
                    styles.segmentItem,
                    active && { backgroundColor: colors.emerald },
                  ]}
                >
                  <Text
                    variant="cardTitle"
                    color={active ? 'onAccent' : 'textMuted'}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="bodySmall" color="textMuted" style={styles.appearanceHint}>
            {copy.appearance.hint}
          </Text>
        </Card>
      </View>

      {/* SETTINGS ---------------------------------------------------------- */}
      <SectionLabel>{copy.profile.settings}</SectionLabel>
      <View style={styles.cardWrap}>{renderRows(SETTINGS)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: { paddingHorizontal: spacing.screen },
  profileList: { gap: spacing.sm, marginTop: spacing.md },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  pAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pAvatarText: { fontSize: 15, fontWeight: '700' },
  pName: { flex: 1 },
  startNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radii.card,
    minHeight: 52,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    minHeight: 52,
  },
  toneValue: { marginTop: spacing.xs },
  segment: {
    flexDirection: 'row',
    borderRadius: radii.button,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceHint: { marginTop: spacing.md },
  cadenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.md,
  },
  cadenceRight: { alignItems: 'flex-end' },
  simulate: {
    marginTop: spacing.lg,
    minHeight: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reset: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
