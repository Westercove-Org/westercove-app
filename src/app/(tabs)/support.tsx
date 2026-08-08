import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { MessageIcon, PhoneIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy, LOSS_TYPES, READING } from '@/constants/copy';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { callLine, textLine } from '@/lib/crisisLinks';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const now = new Date();

  return (
    <Screen header={{ title: 'Support', subtitle: formatHeaderDateTime(now) }}>
      <SectionLabel>{copy.support.needSomeone}</SectionLabel>

      <View style={styles.pad}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.crisis.call988}. ${copy.crisis.call988Sub}.`}
          onPress={() => callLine('988')}
          style={({ pressed }) => [
            styles.crisisCard,
            { backgroundColor: colors.emerald },
            pressed && { opacity: 0.9 },
          ]}
        >
          <View style={styles.iconCircleFilled}>
            <PhoneIcon size={22} color={colors.onAccent} />
          </View>
          <View style={styles.crisisText}>
            <Text color="onAccent" style={styles.crisisTitle}>
              {copy.crisis.call988}
            </Text>
            <Text variant="bodySmall" color="rgba(255,255,255,0.9)">
              {copy.crisis.call988Sub}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.crisis.textHome}. ${copy.crisis.textHomeSub}.`}
          onPress={() => textLine('741741', 'HOME')}
          style={({ pressed }) => [
            styles.crisisCardOutline,
            { borderColor: colors.emerald, backgroundColor: colors.card },
            pressed && { opacity: 0.9 },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.chipGreen }]}>
            <MessageIcon size={22} color={colors.emerald} />
          </View>
          <View style={styles.crisisText}>
            <Text color={colors.emerald} style={styles.crisisTitle}>
              {copy.crisis.textHome}
            </Text>
            <Text variant="bodySmall" color={colors.emerald}>
              {copy.crisis.textHomeSub}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={[styles.pad, styles.searchWrap]}>
        <SearchPill
          placeholder={copy.support.search}
          onPress={() => router.push({ pathname: '/search', params: { scope: 'support' } })}
        />
      </View>

      <SectionLabel>{copy.support.orgs}</SectionLabel>
      <View style={[styles.pad, styles.orgs]}>
        {LOSS_TYPES.map((loss) => (
          <Pressable
            key={loss}
            accessibilityRole="button"
            accessibilityLabel={`${loss} loss organizations`}
            onPress={() =>
              router.push({ pathname: '/support/org/[loss]', params: { loss } })
            }
            style={[styles.orgChip, { borderColor: colors.line }]}
          >
            <Text variant="body" color="amethystText">
              {loss}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel>{copy.support.reading}</SectionLabel>
      <View style={styles.pad}>
        <Card padded={false}>
          {READING.map((row, i) => (
            <ListRow
              key={row.title}
              label={row.title}
              subtitle={'subtitle' in row ? (row.subtitle as string) : undefined}
              divider={i < READING.length - 1}
              onPress={() => {}}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.screen },
  searchWrap: { paddingTop: spacing.xl },
  crisisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    padding: spacing.cardInner,
  },
  crisisCardOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1.5,
    padding: spacing.cardInner,
    marginTop: spacing.cardGap,
  },
  crisisText: { flex: 1 },
  // Above the standard type scale on purpose: the in-content crisis card gets
  // extra legibility emphasis (design system §9, AAA crisis surface).
  crisisTitle: { fontSize: 17, fontWeight: '700' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleFilled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  orgs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  orgChip: {
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
});
