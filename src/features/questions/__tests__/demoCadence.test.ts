jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { resetCadence, SESSION_MINUTES, useCadenceStore } from '@/features/questions/demoCadenceStore';
import { dueDayIndex } from '@/features/questions/questionsStore';
import { DAYS_HUMAN, DAYS_PET } from '@/constants/questions';

describe('demoCadenceStore', () => {
  beforeEach(() => resetCadence());

  it('starts at stage 0 with no minutes', () => {
    const s = useCadenceStore.getState();
    expect(s.stage).toBe(0);
    expect(s.totalMinutes).toBe(0);
  });

  it('each simulated session advances the stage and accrues minutes', () => {
    useCadenceStore.getState().simulateSession();
    expect(useCadenceStore.getState().stage).toBe(1);
    expect(useCadenceStore.getState().sessionMinutes).toBe(SESSION_MINUTES);
    useCadenceStore.getState().simulateSession();
    expect(useCadenceStore.getState().stage).toBe(2);
    expect(useCadenceStore.getState().totalMinutes).toBe(SESSION_MINUTES * 2);
  });

  it('resetProgress returns to zero', () => {
    useCadenceStore.getState().simulateSession();
    useCadenceStore.getState().resetProgress();
    expect(useCadenceStore.getState().stage).toBe(0);
    expect(useCadenceStore.getState().totalMinutes).toBe(0);
  });
});

describe('dueDayIndex cadence gating', () => {
  const total = DAYS_HUMAN.length;

  it('exposes the first bucket immediately (stage 0)', () => {
    expect(dueDayIndex(0, total)).toBe(0);
  });

  it('unlocks one more bucket per simulated session', () => {
    expect(dueDayIndex(1, total)).toBe(1);
    expect(dueDayIndex(2, total)).toBe(2);
  });

  it('caps at the last available bucket', () => {
    expect(dueDayIndex(total + 5, total)).toBe(total - 1);
    expect(dueDayIndex(total + 5, DAYS_PET.length)).toBe(DAYS_PET.length - 1);
  });
});

describe('first question is "Tell me about [name]"', () => {
  it('opens both human and pet Day 1 buckets', () => {
    expect(DAYS_HUMAN[0].questions[0].text).toMatch(/Tell me about \[name\]/);
    expect(DAYS_PET[0].questions[0].text).toMatch(/Tell me about \[name\]/);
  });
});
