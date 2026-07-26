import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MessageIcon, PauseIcon, PhoneIcon, PlayIcon } from '@/components/icons';
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
  const [listen, setListen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

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
            <PhoneIcon size={22} color="#FFFFFF" />
          </View>
          <View style={styles.crisisText}>
            <Text color="#FFFFFF" style={styles.crisisTitle}>
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
        <SearchPill placeholder={copy.support.search} />
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

      <View style={styles.readingHead}>
        <SectionLabel>{copy.support.reading}</SectionLabel>
        <View style={[styles.toggle, { borderColor: colors.line }]}>
          <ReadListenTab label="Read" active={!listen} onPress={() => setListen(false)} />
          <ReadListenTab label="Listen" active={listen} onPress={() => setListen(true)} />
        </View>
      </View>
      <View style={styles.pad}>
        <Card padded={false}>
          {READING.map((row, i) => (
            <ListRow
              key={row.title}
              label={row.title}
              subtitle={'subtitle' in row ? (row.subtitle as string) : undefined}
              divider={i < READING.length - 1}
              chevron={!listen}
              trailing={
                listen ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      playing === row.title ? `Pause ${row.title}` : `Listen to ${row.title}`
                    }
                    onPress={() =>
                      setPlaying((p) => (p === row.title ? null : row.title))
                    }
                    style={[styles.play, { backgroundColor: colors.chipGreen }]}
                  >
                    {playing === row.title ? (
                      <PauseIcon size={18} color={colors.forest} />
                    ) : (
                      <PlayIcon size={18} color={colors.forest} />
                    )}
                  </Pressable>
                ) : undefined
              }
              onPress={() => {}}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

function ReadListenTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.tab, active && { backgroundColor: colors.chipGreen }]}
    >
      <Text variant="bodySmall" color={active ? colors.forest : colors.textMuted}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.screen },
  readingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.screen,
  },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.chip, overflow: 'hidden' },
  tab: { minHeight: 32, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
