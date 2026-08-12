import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { DemoControls } from '@/features/questions/DemoControls';
import { TestProfiles } from '@/features/profile/TestProfiles';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { TONE_LABELS } from '@/services/companionPrompt';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

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
  { label: 'Download my journal', section: 'export' },
];

const SETTINGS: Row[] = [
  { label: 'Account', section: 'account' },
  { label: 'Subscription', section: 'subscription' },
  { label: 'Help', section: 'help' },
  { label: 'Legal', subtitle: 'Terms, Privacy, Disclaimer', section: 'legal' },
];

/** Initials for an avatar: two words give two letters, one gives one. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/** Tones the companion-tone row cycles through: the same labels the gate offers
 *  and the companion prompt understands. */
const TONES = TONE_LABELS;

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const now = new Date();

  const fullName = useSessionStore((s) => s.session?.fullName ?? '');
  const setFullName = useSessionStore((s) => s.setFullName);
  const tone = useSessionStore((s) => s.session?.gateAnswers.tone ?? TONES[0]);
  const updateGate = useSessionStore((s) => s.updateGate);
  const gate = useSessionStore((s) => s.session?.gateAnswers);
  const [nameDraft, setNameDraft] = useState(fullName);

  // The person named in the gate is a loved one already; the avatar row shows
  // them rather than sitting empty until some future add-a-loved-one flow.
  const lovedOnes = gate?.lovedOneName?.trim()
    ? [
        {
          name: gate.lovedOneName.trim(),
          initials: initialsOf(gate.lovedOneName),
          color: gate.mode === 'pet' ? colors.forest : colors.amethystTint,
        },
      ]
    : [];

  const go = (section: string) => {
    if (section === 'what-i-know') router.push('/profile/what-i-know');
    else if (section === 'subscription') router.push('/subscription');
    else if (section === 'export') router.push('/export');
    else if (section === 'account') router.push('/account');
    else router.push({ pathname: '/profile/[section]', params: { section } });
  };

  const cycleTone = () => {
    const i = TONES.findIndex((t) => t === tone);
    updateGate({ tone: TONES[(i + 1) % TONES.length] });
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
    <Screen header={{ title: 'Profile', subtitle: formatHeaderDateTime(now), image: heroImage }}>
      <TestProfiles />

      <SectionLabel>YOUR NAME</SectionLabel>
      <View style={styles.cardWrap}>
        <Card>
          <Text variant="bodySmall" color="textMuted">
            Your full name, first and last, as it should appear on your downloaded journal.
            The companion still greets you by your first name.
          </Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="e.g. Patrice Ellison"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Your full name"
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.line }]}
          />
          <View style={styles.saveRow}>
            <Button
              label="Save"
              onPress={() => setFullName(nameDraft.trim())}
              disabled={nameDraft.trim() === fullName}
            />
          </View>
        </Card>
      </View>

      <SectionLabel>{copy.profile.lovedOnes}</SectionLabel>
      <View style={styles.avatars}>
        {lovedOnes.map((lo) => (
          <View key={lo.name} style={styles.avatarItem}>
            <View style={[styles.avatar, { backgroundColor: lo.color }]}>
              <Text color="onAccent" style={styles.avatarText}>
                {lo.initials}
              </Text>
            </View>
            <Text variant="meta" color="textMuted" style={styles.avatarName}>
              {lo.name}
            </Text>
          </View>
        ))}
        <View style={styles.avatarItem}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a loved one"
            onPress={() => go('loved-ones')}
            style={[styles.avatarAdd, { borderColor: colors.line }]}
          >
            <PlusIcon size={22} color={colors.textMuted} />
          </Pressable>
          <Text variant="meta" color="textMuted" style={styles.avatarName}>
            Add
          </Text>
        </View>
      </View>

      <SectionLabel>{copy.profile.yourSpace}</SectionLabel>
      <View style={styles.cardWrap}>{renderRows(YOUR_SPACE)}</View>

      <SectionLabel>COMPANION TONE</SectionLabel>
      <View style={styles.cardWrap}>
        <Card padded={false}>
          <ListRow
            label="Currently"
            subtitle={tone}
            chevron
            onPress={cycleTone}
          />
        </Card>
      </View>

      <DemoControls />

      <SectionLabel>{copy.profile.settings}</SectionLabel>
      <View style={styles.cardWrap}>{renderRows(SETTINGS)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: { paddingHorizontal: spacing.screen },
  input: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
  },
  saveRow: { flexDirection: 'row', marginTop: spacing.md },
  avatars: { flexDirection: 'row', paddingHorizontal: spacing.screen, gap: spacing.xl },
  avatarItem: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAdd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: 56,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  avatarName: { marginTop: 2 },
});
