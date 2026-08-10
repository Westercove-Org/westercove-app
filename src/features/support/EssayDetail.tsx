import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { ESSAYS } from '@/constants/essays';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const headerPhoto = require('../../../assets/images/westercove_meadow_white.jpg');

/** A single essay, read or listen. Reached at `/essay/:id`. */
export function EssayDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const essay = ESSAYS.find((e) => e.id === id);
  const [mode, setMode] = useState<'read' | 'listen'>('read');
  const [playing, setPlaying] = useState(false);

  if (!essay) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text>
          Not found.{' '}
          <Link href="/support">
            <Text color="forest">Back to Support</Text>
          </Link>
        </Text>
      </View>
    );
  }

  const fade =
    scheme === 'dark'
      ? (['rgba(26,23,18,0.35)', 'rgba(26,23,18,0.72)', 'rgba(26,23,18,0.96)'] as const)
      : (['rgba(246,241,231,0.18)', 'rgba(246,241,231,0.55)', 'rgba(246,241,231,0.96)'] as const);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Image source={headerPhoto} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={fade}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <View style={styles.backChevron}>
            <ChevronRightIcon size={22} color={colors.amethystText} />
          </View>
          <Text color="amethystText">Back</Text>
        </Pressable>
        <Text variant="meta" color="amethystText" style={styles.eyebrow}>
          ESSAY BY DR. WESLEY CARTER
        </Text>
        <Text variant="screenTitle" style={styles.title}>
          {essay.title}
        </Text>
        <Text variant="body" color="amethystText" style={styles.subtitle}>
          {essay.subtitle}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.toggle, { borderColor: colors.line, backgroundColor: colors.card }]}>
          {(['read', 'listen'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setMode(m)}
                style={[
                  styles.toggleBtn,
                  active && { backgroundColor: colors.emerald },
                ]}
              >
                <Text color={active ? 'onAccent' : 'textMuted'} style={styles.toggleText}>
                  {m === 'read' ? 'Read' : 'Listen'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'listen' ? (
          <Card>
            <View style={styles.player}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={playing ? 'Pause' : 'Play'}
                onPress={() => setPlaying((p) => !p)}
                style={[styles.playBtn, { backgroundColor: colors.forest }]}
              >
                {playing ? (
                  <PauseIcon size={22} color={colors.onAccent} />
                ) : (
                  <PlayIcon size={22} color={colors.onAccent} />
                )}
              </Pressable>
              <View style={styles.track}>
                <View style={[styles.trackBg, { backgroundColor: colors.surfaceAlt }]} />
              </View>
            </View>
            <Text variant="bodySmall" color="textMuted" style={styles.playerNote}>
              Placeholder audio for the demo. In production, this plays a recording of the
              article read by Dr. Carter.
            </Text>
          </Card>
        ) : (
          essay.body.split(/\n\n+/).map((p, i) => (
            <Text key={i} variant="body" style={styles.paragraph}>
              {p}
            </Text>
          ))
        )}
      </ScrollView>

      <CrisisBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: {
    overflow: 'hidden',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44 },
  backChevron: { transform: [{ rotate: '180deg' }] },
  eyebrow: { marginTop: spacing.sm, letterSpacing: 1.5 },
  title: { marginTop: 2 },
  subtitle: { marginTop: spacing.xs, opacity: 0.9 },
  body: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg, paddingBottom: 120 },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.inputPill,
    padding: 4,
    gap: 4,
    marginBottom: spacing.lg,
  },
  toggleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.inputPill,
    minHeight: 40,
    justifyContent: 'center',
  },
  toggleText: { fontWeight: '600', fontSize: 14 },
  player: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { flex: 1 },
  trackBg: { height: 6, borderRadius: 3, width: '100%' },
  playerNote: { marginTop: spacing.md },
  paragraph: { fontSize: 17, lineHeight: 27, marginBottom: spacing.md },
});
