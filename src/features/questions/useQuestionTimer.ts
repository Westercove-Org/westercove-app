import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { activeDays, dueDayIndex, useQuestionsStore } from './questionsStore';

const TICK_MS = 1000;

/**
 * Accumulates talk-time while an entry conversation screen is focused and
 * surfaces the next Day's questions when an interval completes.
 *
 * - On focus: if the user previously declined the permission dialog, show that
 *   Day's questions directly (no dialog) now that they have left and returned.
 *   Then start ticking.
 * - Each tick: add a second of talk-time; when a new Day becomes due and nothing
 *   is already pending, raise the permission dialog.
 * - On blur: stop ticking.
 */
export function useQuestionTimer() {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      const store = useQuestionsStore.getState;
      const total = activeDays().length;

      // Returning after a "no": surface the due Day directly, without a dialog.
      const onEntry = store();
      if (onEntry.deferAfterNo && !onEntry.pending) {
        const due = dueDayIndex(onEntry.talkMs, total);
        if (due >= onEntry.daysShown) {
          useQuestionsStore.setState({
            pending: { dayIndex: onEntry.daysShown, mode: 'direct' },
            deferAfterNo: false,
          });
        }
      }

      timer.current = setInterval(() => {
        const s = store();
        s.addTalkMs(TICK_MS);
        const next = store();
        // Skip if a Day is already on screen, or the user declined this visit
        // (they'll see it directly when they leave and come back).
        if (next.pending || next.deferAfterNo) return;
        const due = dueDayIndex(next.talkMs, total);
        if (due >= next.daysShown) {
          next.setPending({ dayIndex: next.daysShown, mode: 'dialog' });
        }
      }, TICK_MS);

      return () => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      };
    }, []),
  );
}
