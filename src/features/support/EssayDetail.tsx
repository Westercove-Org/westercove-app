import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { essayById } from '@/features/support/essays';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

/** A single essay with a listen (text-to-speech) control. Reached at
 * `/support/essay/:id`. Speed is applied via expo-speech's `rate`. */
export function EssayDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const essay = essayById(id);

  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1);

  // Always stop playback when leaving the screen.
  useEffect(() => () => void Speech.stop(), []);

  const speak = (nextRate: number) => {
    if (!essay) return;
    Speech.stop();
    Speech.speak(essay.body, {
      rate: nextRate,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(true);
  };

  const toggle = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      speak(rate);
    }
  };

  const changeRate = (next: number) => {
    setRate(next);
    if (speaking) speak(next); // restart at the new speed
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronRightIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="screenTitle" style={styles.headerTitle} numberOfLines={1}>
          {essay?.title ?? 'Essay'}
        </Text>
      </View>

      {essay ? (
        <ScrollView contentContainerStyle={styles.body}>
          <Text variant="display" accessibilityRole="header">
            {essay.title}
          </Text>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={speaking ? 'Pause' : 'Listen to this essay'}
              onPress={toggle}
              style={[styles.playBtn, { backgroundColor: colors.forest }]}
            >
              {speaking ? (
                <PauseIcon size={20} color={colors.onAccent} />
              ) : (
                <PlayIcon size={20} color={colors.onAccent} />
              )}
              <Text color="onAccent" variant="cardTitle">
                {speaking ? 'Pause' : 'Listen'}
              </Text>
            </Pressable>

            <View style={[styles.speeds, { borderColor: colors.line }]}>
              {SPEEDS.map((s) => {
                const active = s === rate;
                return (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Speed ${s} times`}
                    onPress={() => changeRate(s)}
                    style={[styles.speed, active && { backgroundColor: colors.chipGreen }]}
                  >
                    <Text
                      variant="bodySmall"
                      color={active ? colors.forest : colors.textMuted}
                    >
                      {s}×
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text variant="body" color="textPrimary" style={styles.para}>
            {essay.body}
          </Text>
        </ScrollView>
      ) : (
        <View style={styles.body}>
          <Text variant="body" color="textMuted">
            This essay could not be found.
          </Text>
        </View>
      )}

      <CrisisBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { flex: 1 },
  back: {
    transform: [{ rotate: '180deg' }],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.button,
  },
  speeds: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.chip, overflow: 'hidden' },
  speed: { minHeight: 36, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  para: { lineHeight: 24 },
});
