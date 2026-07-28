import { Dialog } from '@/components/ui/Dialog';
import { DayQuestionFlow } from './DayQuestionFlow';
import { useQuestionsStore } from './questionsStore';

const PERMISSION_MESSAGE =
  'To better answer your questions, would you like to answer some questions';

/**
 * Global overlay for the timer-driven questions. Reads the pending state set by
 * useQuestionTimer and renders either the permission dialog or the Day question
 * flow. Self-hides when nothing is pending, so it is safe to mount once at the
 * root above the navigation stack.
 */
export function QuestionsOverlay() {
  const pending = useQuestionsStore((s) => s.pending);
  const setPending = useQuestionsStore((s) => s.setPending);
  const declinePending = useQuestionsStore((s) => s.declinePending);

  if (!pending) return null;

  if (pending.mode === 'dialog') {
    return (
      <Dialog
        visible
        message={PERMISSION_MESSAGE}
        confirmLabel="Yes"
        cancelLabel="Not now"
        onConfirm={() => setPending({ dayIndex: pending.dayIndex, mode: 'direct' })}
        onCancel={declinePending}
      />
    );
  }

  return (
    <DayQuestionFlow
      dayIndex={pending.dayIndex}
      onDone={() => {
        /* markDayShown() inside the flow already clears pending */
      }}
    />
  );
}
