import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
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
const SPEECH_RATE = 0.9;

/** A word token and its character offset into the essay body. */
type Token = { text: string; start: number; isWord: boolean };

/** Split into words + whitespace, keeping each token's offset so we can map a
 *  speech boundary's charIndex back to the word being spoken. */
function tokenize(body: string): Token[] {
  const tokens: Token[] = [];
  let start = 0;
  for (const text of body.split(/(\s+)/)) {
    if (text) tokens.push({ text, start, isWord: /\S/.test(text) });
    start += text.length;
  }
  return tokens;
}

/** A single essay, read or listen. Reached at `/essay/:id`. */
export function EssayDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const essay = ESSAYS.find((e) => e.id === id);
  const [mode, setMode] = useState<'read' | 'listen'>('read');
  const [playing, setPlaying] = useState(false);
  // Absolute char offset (into the full body) of the word currently spoken;
  // -1 when idle/finished.
  const [charIndex, setCharIndex] = useState(-1);
  // Offset the current utterance was spoken from (boundary events are relative
  // to the sliced string, so we add this back to get an absolute offset).
  const baseRef = useRef(0);
  // Where a resumed utterance should pick up. 0 = from the start.
  const resumeAtRef = useRef(0);
  // Set before a deliberate Speech.stop() so its onDone/onStopped is treated as
  // a pause (freeze highlight) rather than natural completion (clear it).
  const pausingRef = useRef(false);
  const mountedRef = useRef(true);

  const tokens = useMemo(() => tokenize(essay?.body ?? ''), [essay?.body]);
  // Index of the word token whose range contains the boundary char offset.
  const activeToken = useMemo(() => {
    if (charIndex < 0) return -1;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      if (t.isWord && charIndex >= t.start) return i;
    }
    return -1;
  }, [charIndex, tokens]);

  // Stop speech when leaving the screen or switching back to Read.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pausingRef.current = true;
      Speech.stop();
    };
  }, []);
  useEffect(() => {
    if (mode === 'read') stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function fullReset() {
    if (!mountedRef.current) return;
    resumeAtRef.current = 0;
    baseRef.current = 0;
    setPlaying(false);
    setCharIndex(-1);
  }

  function stop() {
    pausingRef.current = true;
    Speech.stop();
    fullReset();
  }

  // Speak from an absolute offset into the body; boundary offsets are rebased so
  // the highlight tracks the right word even after a resume.
  function speakFrom(offset: number) {
    if (!essay) return;
    baseRef.current = offset;
    setPlaying(true);
    // A deliberate Speech.stop() (pause) surfaces as onDone on some platforms
    // and onError (canceled) on others — both must freeze, not reset.
    const handleEnd = () => {
      if (pausingRef.current) {
        pausingRef.current = false;
        if (mountedRef.current) setPlaying(false);
        return;
      }
      fullReset();
    };
    Speech.speak(essay.body.slice(offset), {
      rate: SPEECH_RATE,
      onBoundary: (e: { charIndex?: number }) =>
        setCharIndex(baseRef.current + (e?.charIndex ?? 0)),
      onDone: handleEnd,
      onError: handleEnd,
    });
  }

  function toggle() {
    if (playing) {
      // Remember the current word, then stop. Resume replays from here.
      resumeAtRef.current = charIndex >= 0 ? charIndex : resumeAtRef.current;
      pausingRef.current = true;
      Speech.stop();
      setPlaying(false);
    } else {
      speakFrom(resumeAtRef.current);
    }
  }

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
                onPress={toggle}
                style={[styles.playBtn, { backgroundColor: colors.forest }]}
              >
                {playing ? (
                  <PauseIcon size={22} color={colors.onAccent} />
                ) : (
                  <PlayIcon size={22} color={colors.onAccent} />
                )}
              </Pressable>
              <View style={styles.track}>
                <View style={[styles.trackBg, { backgroundColor: colors.surfaceAlt }]}>
                  <View
                    style={[
                      styles.trackFill,
                      {
                        backgroundColor: colors.forest,
                        width: `${Math.min(100, (Math.max(0, charIndex) / essay.body.length) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
            <Text variant="bodySmall" color="textMuted" style={styles.playerNote}>
              Spoken by your device. The word being read is highlighted below.
            </Text>
          </Card>
        ) : null}

        {mode === 'listen' ? (
          <Text variant="body" style={styles.paragraph}>
            {tokens.map((t, i) =>
              t.isWord && i === activeToken ? (
                <Text
                  key={i}
                  style={{ backgroundColor: colors.saffron, color: colors.heading }}
                >
                  {t.text}
                </Text>
              ) : (
                t.text
              ),
            )}
          </Text>
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
  trackBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  playerNote: { marginTop: spacing.md },
  paragraph: { fontSize: 17, lineHeight: 27, marginBottom: spacing.md },
});
