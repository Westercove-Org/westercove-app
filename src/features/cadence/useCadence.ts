import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useCadenceStore } from './cadenceStore';

/** Flush accrued journaling time to the server at most this often while writing,
 * so a long single sitting still advances the stage without a per-second POST. */
const FLUSH_EVERY_SECONDS = 60;

/**
 * Mount once inside the signed-in shell: reconcile the server cadence state on
 * entry and report the session open — including on every return to the
 * foreground, since a gap makes that a new session. The server computes the
 * away-gap from the event timestamps, so there is no client away-timer; we just
 * re-emit `app_open` when the app becomes active. All calls are no-ops unless
 * USE_FOUR_DOORS is on and a backend profile exists (the store guards them).
 */
export function useCadenceSession() {
  useEffect(() => {
    const store = useCadenceStore.getState();
    void store.hydrate();
    store.appOpen();

    let prev = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (prev !== 'active' && next === 'active') useCadenceStore.getState().appOpen();
      prev = next;
    });
    return () => sub.remove();
  }, []);
}

/**
 * Accrue foreground writing time on a writing surface and report it to the
 * cadence engine (design doc §5: the client measures time on the two writing
 * surfaces only; the server owns the stage math). Batched: flushed every
 * FLUSH_EVERY_SECONDS while focused and once on blur. No-op when the flow is off.
 */
export function useCadenceJournalingTimer() {
  const accrued = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const flush = () => {
        const seconds = accrued.current;
        accrued.current = 0;
        if (seconds > 0) useCadenceStore.getState().journalingTick(seconds);
      };
      const interval = setInterval(() => {
        accrued.current += 1;
        if (accrued.current >= FLUSH_EVERY_SECONDS) flush();
      }, 1000);
      return () => {
        clearInterval(interval);
        flush();
      };
    }, []),
  );
}
