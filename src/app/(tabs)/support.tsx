import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  BookIcon,
  ChevronRightIcon,
  FileTextIcon,
  InfoIcon,
  LayersIcon,
  MessageIcon,
  PhoneIcon,
  SparkleIcon,
} from '@/components/icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { SearchPill } from '@/components/ui/SearchPill';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy, LOSS_TYPES, READING } from '@/constants/copy';
import { ESSAYS } from '@/constants/essays';
import { formatHeaderDateTime } from '@/lib/dateFormat';
import { callLine, textLine } from '@/lib/crisisLinks';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_hero_valley.jpg');

const READING_ICON = {
  essays: BookIcon,
  framework: LayersIcon,
  glossary: SparkleIcon,
  'white-papers': FileTextIcon,
  why: InfoIcon,
} as const;

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const now = new Date();
  const [openRow, setOpenRow] = useState<string | null>(null);

  return (
    <Screen header={{ title: 'Support', subtitle: formatHeaderDateTime(now), image: heroImage }}>
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
          {READING.map((row, i) => {
            const Icon = READING_ICON[row.id];
            const open = openRow === row.id;
            const last = i === READING.length - 1;
            return (
              <View
                key={row.id}
                style={
                  last ? null : { borderBottomWidth: 1, borderBottomColor: colors.line }
                }
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={row.title}
                  onPress={() => setOpenRow(open ? null : row.id)}
                  style={({ pressed }) => [styles.readingRow, pressed && { opacity: 0.6 }]}
                >
                  <View style={styles.readingLeading}>
                    <Icon size={20} color={colors.forest} />
                  </View>
                  <View style={styles.readingText}>
                    <Text variant="cardTitle">{row.title}</Text>
                    {'subtitle' in row ? (
                      <Text variant="bodySmall" color="textMuted" style={styles.readingSub}>
                        {row.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <View style={open ? styles.chevronOpen : undefined}>
                    <ChevronRightIcon size={20} color={colors.textMuted} />
                  </View>
                </Pressable>

                {open && row.id === 'essays' ? (
                  <View style={[styles.expand, { borderTopColor: colors.line }]}>
                    {ESSAYS.map((es, j) => (
                      <Pressable
                        key={es.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${es.title}. ${es.subtitle}`}
                        onPress={() =>
                          router.push({ pathname: '/essay/[id]', params: { id: es.id } })
                        }
                        style={({ pressed }) => [
                          styles.essayRow,
                          j < ESSAYS.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.line,
                          },
                          pressed && { opacity: 0.6 },
                        ]}
                      >
                        <View style={styles.essayText}>
                          <Text variant="cardTitle">{es.title}</Text>
                          <Text
                            variant="bodySmall"
                            color="textMuted"
                            style={styles.readingSub}
                          >
                            {es.subtitle}
                          </Text>
                        </View>
                        <ChevronRightIcon size={18} color={colors.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {open && row.id !== 'essays' ? (
                  <View style={[styles.expand, { borderTopColor: colors.line }]}>
                    <Text variant="bodySmall" color="textMuted" style={styles.laterNote}>
                      This section will open in a later phase.
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
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
  readingRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.cardInner,
    gap: spacing.md,
  },
  readingLeading: { width: 24, alignItems: 'center' },
  readingText: { flex: 1 },
  readingSub: { marginTop: 2 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  expand: { borderTopWidth: 1 },
  essayRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.cardInner,
    paddingLeft: spacing.cardInner + 24 + spacing.md,
    gap: spacing.md,
  },
  essayText: { flex: 1 },
  laterNote: {
    paddingVertical: spacing.md,
    paddingRight: spacing.cardInner,
    paddingLeft: spacing.cardInner + 24 + spacing.md,
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
