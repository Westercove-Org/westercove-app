import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useQuestionsStore } from './questionsStore';

const TICK_SECONDS = 1;

/**
 * Accrue journaling time while an entry writing screen is focused. Each
 * qualifying length of journaling advances the cadence one stage (see
 * questionsStore.addJournalSeconds). The demo's Simulate button is the primary
 * driver; this keeps the cadence moving for real journaling too.
 */
export function useQuestionTimer() {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      timer.current = setInterval(() => {
        useQuestionsStore.getState().addJournalSeconds(TICK_SECONDS);
      }, TICK_SECONDS * 1000);

      return () => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      };
    }, []),
  );
}
