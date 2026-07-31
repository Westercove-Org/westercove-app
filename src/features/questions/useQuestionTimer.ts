/**
 * Talk-time timer — retained as a no-op.
 *
 * In the demo build, profile questions are surfaced and advanced deliberately:
 * the current question appears on Home, and "Simulate a journaling session"
 * (Profile → Demo controls) unlocks the next bucket via the cadence store. The
 * old automatic talk-time accumulation is therefore disabled so questions are
 * never double-surfaced. The hook stays exported (and mounted on entry screens)
 * so re-enabling talk-time pacing later is a one-file change.
 */
export function useQuestionTimer() {
  // Intentionally empty in the demo build.
}
