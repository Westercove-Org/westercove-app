import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * A hero photo with a very slow Ken Burns drift: it scales and shifts over half
 * a minute so the landscape reads as living light rather than a flat backdrop.
 * The motion is deliberately below the threshold of "animation" — you notice it
 * only if you look.
 *
 * Honours the OS reduce-motion setting, which pins the photo still.
 */
export function DriftingPhoto({
  source,
  durationMs = 32000,
}: {
  source: number;
  durationMs?: number;
}) {
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {
        /* Unknown: keep the motion, it is already very slight. */
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, durationMs, progress]);

  // 1.04 → 1.12 scale with a slight up-and-left drift, matching the demo's
  // `kenBurns` keyframes.
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.04 + progress.value * 0.08 },
      { translateX: progress.value * -8 },
      { translateY: progress.value * -8 },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}
