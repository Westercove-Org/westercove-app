import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon, PauseIcon, PlayIcon, ResetIcon } from '@/components/icons';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { ESSAYS } from '@/constants/essays';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const headerPhoto = require('../../../assets/images/westercove_meadow_white.jpg');
// Softer than natural speech: unhurried pace, slightly lowered pitch for a calm,
// grounded tone rather than the bright default TTS voice.
const SPEECH_RATE = 0.8;
const SPEECH_PITCH = 0.9;
// Listening speeds, as multipliers of the calm base rate above. 1x is the
// unhurried default; the others are there for people who want to move faster or
// slower, not to make the base voice brisk.
const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
// Warm, natural-sounding English voices, softest first. First match among the
// device's installed voices wins; the OS default is the last resort.
const PREFERRED_VOICES = [
  'Google UK English Female', // Chrome: smooth, unhurried
  'Ava', // iOS/macOS premium, warm
  'Serena',
  'Samantha',
  'Allison',
  'Karen',
  'Moira',
  'Tessa',
];

/** Pick the calmest available English voice. Enhanced/premium voices sound far
 *  less robotic than the compact defaults, so they win first; among names we
 *  honour PREFERRED_VOICES order (not the device's arbitrary list order). */
function pickCalmVoice(voices: Speech.Voice[]): string | undefined {
  const en = voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
  if (!en.length) return undefined;
  const enhanced = (v: Speech.Voice) => v.quality === Speech.VoiceQuality.Enhanced;
  const byPreference = (extra: (v: Speech.Voice) => boolean) => {
    for (const n of PREFERRED_VOICES) {
      const hit = en.find(
        (v) => (v.name?.includes(n) || v.identifier?.includes(n)) && extra(v),
      );
      if (hit) return hit;
    }
    return undefined;
  };
  return (
    byPreference(enhanced) ?? // best: a warm voice in enhanced quality
    en.find(enhanced) ?? // any enhanced voice
    byPreference(() => true) ?? // a warm voice at default quality
    en[0]
  ).identifier;
}

/** A word token and its character offset into the essay body. */
type Token = { text: string; start: number; isWord: boolean };

/** Split into words + whitespace, keeping each token's offset so we can map a
 *  speech boundary's charIndex back to the sentence being spoken. */
function tokenize(body: string): Token[] {
  const tokens: Token[] = [];
  let start = 0;
  for (const text of body.split(/(\s+)/)) {
    if (text) tokens.push({ text, start, isWord: /\S/.test(text) });
    start += text.length;
  }
  return tokens;
}

/** Sentence spans (start/end char offsets) so we can highlight the whole
 *  sentence being read, not just one word. */
function sentenceRanges(body: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  // Runs ending in sentence punctuation, plus any trailing run without it.
  const re = /[^.!?]*[.!?]+|[^.!?]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m[0].trim()) ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  return ranges;
}

/** A single essay, read or listen. Reached at `/essay/:id`. */
export function EssayDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const essay = ESSAYS.find((e) => e.id === id);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  // The live speed, read inside speakFrom's callbacks without re-creating them.
  const speedRef = useRef(1);
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
  // Set when a stop is only a step in restarting at a new speed.
  const resumeAfterStopRef = useRef(false);
  const mountedRef = useRef(true);
  // Chosen calm voice identifier; undefined = use the platform default.
  const voiceRef = useRef<string | undefined>(undefined);

  const tokens = useMemo(() => tokenize(essay?.body ?? ''), [essay?.body]);
  const sentences = useMemo(() => sentenceRanges(essay?.body ?? ''), [essay?.body]);
  // The sentence span containing the boundary char offset; null when idle.
  const activeSentence = useMemo(() => {
    if (charIndex < 0) return null;
    return sentences.find((r) => charIndex >= r.start && charIndex < r.end) ?? null;
  }, [charIndex, sentences]);
  // Playback has begun (playing, or paused mid-essay) → show Reset + progress.
  const started = playing || charIndex >= 0;

  // Stop speech when leaving the screen or switching back to Read.
  useEffect(() => {
    mountedRef.current = true;
    // Voices load asynchronously (web fires them late); pick once up front.
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        voiceRef.current = pickCalmVoice(voices);
      })
      .catch(() => {
        /* No voice list: fall back to the platform default. */
      });
    return () => {
      mountedRef.current = false;
      pausingRef.current = true;
      Speech.stop();
    };
  }, []);

  function fullReset() {
    if (!mountedRef.current) return;
    resumeAfterStopRef.current = false;
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
        if (!mountedRef.current) return;
        // A speed change stopped playback only to start it again.
        if (resumeAfterStopRef.current) {
          resumeAfterStopRef.current = false;
          speakFrom(resumeAtRef.current);
          return;
        }
        setPlaying(false);
        return;
      }
      fullReset();
    };
    Speech.speak(essay.body.slice(offset), {
      rate: SPEECH_RATE * speedRef.current,
      pitch: SPEECH_PITCH,
      voice: voiceRef.current,
      onBoundary: (e: { charIndex?: number }) =>
        setCharIndex(baseRef.current + (e?.charIndex ?? 0)),
      onDone: handleEnd,
      onError: handleEnd,
    });
  }

  /** Change speed. Mid-playback the utterance is restarted from the current
   *  word, since a rate change cannot be applied to speech already in flight. */
  function changeSpeed(next: number) {
    setSpeed(next);
    speedRef.current = next;
    if (!playing) return;
    // Restart at the new rate from the current word. The resume is deferred to
    // the stop's completion callback: speaking again before the old utterance
    // has finished unwinding would let its handler cancel the new playback.
    resumeAtRef.current = charIndex >= 0 ? charIndex : resumeAtRef.current;
    resumeAfterStopRef.current = true;
    pausingRef.current = true;
    Speech.stop();
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
        <View style={styles.controls}>
          {started ? (
            <>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset"
                onPress={stop}
                style={[styles.resetBtn, { borderColor: colors.line }]}
              >
                <ResetIcon size={20} color={colors.amethystText} />
              </Pressable>
            </>
          ) : null}
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
        </View>

        <View style={styles.speeds}>
          {SPEEDS.map((s) => (
            <Chip
              key={s}
              label={`${s}x`}
              selected={s === speed}
              onPress={() => changeSpeed(s)}
            />
          ))}
        </View>

        <Text variant="body" style={styles.paragraph}>
          {tokens.map((t, i) =>
            activeSentence &&
            t.start >= activeSentence.start &&
            t.start < activeSentence.end ? (
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 48,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  paragraph: { fontSize: 17, lineHeight: 27, marginBottom: spacing.md },
  speeds: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
