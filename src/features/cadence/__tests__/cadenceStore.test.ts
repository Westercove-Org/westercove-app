/**
 * The cadence store must be completely inert unless USE_FOUR_DOORS is on AND a
 * backend profile exists — otherwise it would disturb the current (non-4-Doors)
 * flow. These tests pin that guard in both flag states.
 */
const mockReportEvent = jest.fn().mockResolvedValue({});

jest.mock('@/services', () => ({
  services: { cadence: { reportEvent: (...a: unknown[]) => mockReportEvent(...a) } },
}));

let mockProfileId: number | undefined;
jest.mock('@/features/auth/sessionStore', () => ({
  useSessionStore: { getState: () => ({ session: { backendProfileId: mockProfileId } }) },
}));

let mockFlagOn = false;
jest.mock('@/constants/flags', () => ({
  get USE_FOUR_DOORS() {
    return mockFlagOn;
  },
}));

import { useCadenceStore } from '@/features/cadence/cadenceStore';

describe('cadenceStore guard', () => {
  beforeEach(() => mockReportEvent.mockClear());

  it('is a no-op when the flag is off', () => {
    mockFlagOn = false;
    mockProfileId = 5;
    useCadenceStore.getState().userSpoke();
    expect(mockReportEvent).not.toHaveBeenCalled();
  });

  it('is a no-op when the flag is on but there is no profile yet', () => {
    mockFlagOn = true;
    mockProfileId = undefined;
    useCadenceStore.getState().userSpoke();
    expect(mockReportEvent).not.toHaveBeenCalled();
  });

  it('reports when the flag is on and a profile exists', () => {
    mockFlagOn = true;
    mockProfileId = 5;
    useCadenceStore.getState().userSpoke();
    expect(mockReportEvent).toHaveBeenCalledWith(5, expect.objectContaining({ event: 'user_spoke' }));
  });

  it('journalingTick ignores a zero delta', () => {
    mockFlagOn = true;
    mockProfileId = 5;
    useCadenceStore.getState().journalingTick(0);
    expect(mockReportEvent).not.toHaveBeenCalled();
    useCadenceStore.getState().journalingTick(45);
    expect(mockReportEvent).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ event: 'journaling_tick', journalingSecondsDelta: 45 }),
    );
  });
});
