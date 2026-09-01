import { useCadenceJournalingTimer } from '@/features/cadence/useCadence';
import { useCadenceStore } from '@/features/cadence/cadenceStore';
import { renderHook } from '@/test-utils';

// The hook drives its interval from expo-router's useFocusEffect. Stub it to run
// the focus callback immediately and hand us back its cleanup (the blur path).
let focusCleanup: (() => void) | void;
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => (() => void) | void) => {
    focusCleanup = cb();
  },
}));

describe('useCadenceJournalingTimer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    focusCleanup = undefined;
  });

  it('flushes accrued journaling seconds to the cadence engine every 60s while focused', async () => {
    const tick = jest
      .spyOn(useCadenceStore.getState(), 'journalingTick')
      .mockImplementation(() => {});
    await renderHook(() => useCadenceJournalingTimer());

    jest.advanceTimersByTime(60_000);
    // One batched flush of a full minute reaches the service (not 60 per-second POSTs).
    expect(tick).toHaveBeenCalledTimes(1);
    expect(tick).toHaveBeenCalledWith(60);
  });

  it('flushes the remaining seconds on blur, and nothing when no time accrued', async () => {
    const tick = jest
      .spyOn(useCadenceStore.getState(), 'journalingTick')
      .mockImplementation(() => {});
    await renderHook(() => useCadenceJournalingTimer());

    jest.advanceTimersByTime(30_000);
    expect(tick).not.toHaveBeenCalled(); // under the 60s flush threshold

    focusCleanup?.(); // leaving the writing surface
    expect(tick).toHaveBeenCalledWith(30);

    tick.mockClear();
    focusCleanup?.(); // a second flush has nothing left to send
    expect(tick).not.toHaveBeenCalled();
  });
});
