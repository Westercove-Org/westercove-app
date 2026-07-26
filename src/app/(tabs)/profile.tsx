import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { formatHeaderDateTime } from '@/lib/dateFormat';
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
  { label: 'Export', section: 'export' },
];

const SETTINGS: Row[] = [
  { label: 'Account', section: 'account' },
  { label: 'Subscription', section: 'subscription' },
  { label: 'Help', section: 'help' },
  { label: 'Legal', subtitle: 'Terms, Privacy, Disclaimer', section: 'legal' },
];

const LOVED_ONES = [
  { initials: 'EC', name: 'Dad', color: '#3D2F5E' },
  { initials: 'B', name: 'Biscuit', color: '#338233' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const now = new Date();

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
    <Screen header={{ title: 'Profile', subtitle: formatHeaderDateTime(now) }}>
      <SectionLabel>{copy.profile.lovedOnes}</SectionLabel>
      <View style={styles.avatars}>
        {LOVED_ONES.map((lo) => (
          <View key={lo.name} style={styles.avatarItem}>
            <View style={[styles.avatar, { backgroundColor: lo.color }]}>
              <Text color="#FFFFFF" style={styles.avatarText}>
                {lo.initials}
              </Text>
            </View>
            <Text variant="meta" color="textMuted" style={styles.avatarName}>
              {lo.name}
            </Text>
          </View>
        ))}
        <View style={styles.avatarItem}>
          <View style={[styles.avatarAdd, { borderColor: colors.line }]}>
            <PlusIcon size={22} color={colors.textMuted} />
          </View>
          <Text variant="meta" color="textMuted" style={styles.avatarName}>
            Add
          </Text>
        </View>
      </View>

      <SectionLabel>{copy.profile.yourSpace}</SectionLabel>
      <View style={styles.cardWrap}>{renderRows(YOUR_SPACE)}</View>

      <SectionLabel>{copy.profile.settings}</SectionLabel>
      <View style={styles.cardWrap}>{renderRows(SETTINGS)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: { paddingHorizontal: spacing.screen },
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
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  avatarName: { marginTop: 2 },
});
