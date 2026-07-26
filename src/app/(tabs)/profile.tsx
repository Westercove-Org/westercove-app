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

const YOUR_SPACE = [
  { label: 'Loved-one profiles', subtitle: 'Human or pet' },
  { label: 'Memories' },
  { label: 'Anniversaries and Hard Dates' },
  { label: 'Stabilizing Practices' },
  { label: 'Grief Patterns' },
  { label: 'What I Know', subtitle: 'What the companion has learned, editable' },
  { label: 'Custom commands', subtitle: 'Define your own' },
  { label: 'Export' },
];

const SETTINGS = [
  { label: 'Account' },
  { label: 'Subscription' },
  { label: 'Help' },
  { label: 'Legal', subtitle: 'Terms, Privacy, Disclaimer' },
];

const LOVED_ONES = [
  { initials: 'EC', name: 'Dad', color: '#3D2F5E' },
  { initials: 'B', name: 'Biscuit', color: '#338233' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const now = new Date();

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
      <View style={styles.cardWrap}>
        <Card padded={false}>
          {YOUR_SPACE.map((row, i) => (
            <ListRow
              key={row.label}
              label={row.label}
              subtitle={row.subtitle}
              divider={i < YOUR_SPACE.length - 1}
              onPress={() => {}}
            />
          ))}
        </Card>
      </View>

      <SectionLabel>{copy.profile.settings}</SectionLabel>
      <View style={styles.cardWrap}>
        <Card padded={false}>
          {SETTINGS.map((row, i) => (
            <ListRow
              key={row.label}
              label={row.label}
              subtitle={row.subtitle}
              divider={i < SETTINGS.length - 1}
              onPress={() => {}}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: { paddingHorizontal: spacing.screen },
  avatars: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screen,
    gap: spacing.xl,
  },
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
