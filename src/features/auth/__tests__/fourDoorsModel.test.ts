import { buildGatePayload, canAdvance, type GateState } from '@/features/auth/fourDoorsModel';

describe('fourDoorsModel.buildGatePayload', () => {
  const base = { userName: '  Rae  ', toneLabel: 'Direct and tactful' } as const;

  it('D1: name + free-text relationship, tone mapped, trimmed', () => {
    const s: GateState = { ...base, door: 1, lovedOneName: '  Mara ', relationship: ' my mother ' };
    expect(buildGatePayload(s)).toEqual({
      userName: 'Rae',
      door: 1,
      tone: 'direct_tactful',
      lovedOneName: 'Mara',
      relationship: 'my mother',
    });
  });

  it('D2: name + subtype from the detail tap', () => {
    const s: GateState = { ...base, door: 2, lovedOneName: 'Sam', door2Detail: 'We are not speaking' };
    expect(buildGatePayload(s)).toEqual({
      userName: 'Rae',
      door: 2,
      tone: 'direct_tactful',
      lovedOneName: 'Sam',
      doorSubtype: 'not_speaking',
    });
  });

  it('D3: what_changed + change_timing sent as display strings (backend maps subtype)', () => {
    const s: GateState = {
      ...base,
      door: 3,
      whatChanged: 'My body or my health',
      changeTiming: 'Months ago',
    };
    expect(buildGatePayload(s)).toEqual({
      userName: 'Rae',
      door: 3,
      tone: 'direct_tactful',
      whatChanged: 'My body or my health',
      changeTiming: 'Months ago',
    });
  });

  it('D4: name + species, breed optional (omitted when blank)', () => {
    const s: GateState = { ...base, door: 4, lovedOneName: 'Biscuit', species: 'Dog', breed: '  ' };
    expect(buildGatePayload(s)).toEqual({
      userName: 'Rae',
      door: 4,
      tone: 'direct_tactful',
      lovedOneName: 'Biscuit',
      species: 'Dog',
      breed: undefined,
    });
  });

  it('maps every tone label to its enum value', () => {
    const val = (label: string) =>
      buildGatePayload({ userName: 'x', door: 1, toneLabel: label }).tone;
    expect(val('Gentle and warm')).toBe('gentle_warm');
    expect(val('Direct and plain')).toBe('direct_plain');
    expect(val('Quiet and minimal')).toBe('quiet_minimal');
    expect(val('Spiritual')).toBe('spiritual');
  });
});

describe('fourDoorsModel.canAdvance', () => {
  it('requires the right answer per step and door', () => {
    expect(canAdvance('name', { userName: '' })).toBe(false);
    expect(canAdvance('name', { userName: 'Rae' })).toBe(true);
    expect(canAdvance('door', { userName: 'Rae' })).toBe(false);
    expect(canAdvance('door', { userName: 'Rae', door: 2 })).toBe(true);
    // Q3: D3 taps a category; the others type a name.
    expect(canAdvance('q3', { userName: 'Rae', door: 1 })).toBe(false);
    expect(canAdvance('q3', { userName: 'Rae', door: 1, lovedOneName: 'Mara' })).toBe(true);
    expect(canAdvance('q3', { userName: 'Rae', door: 3, whatChanged: 'Something else' })).toBe(true);
    // Q4: D1 relationship optional → always allowed; D4 needs a species.
    expect(canAdvance('q4', { userName: 'Rae', door: 1 })).toBe(true);
    expect(canAdvance('q4', { userName: 'Rae', door: 4 })).toBe(false);
    expect(canAdvance('q4', { userName: 'Rae', door: 4, species: 'Cat' })).toBe(true);
    expect(canAdvance('tone', { userName: 'Rae', door: 1 })).toBe(false);
    expect(canAdvance('tone', { userName: 'Rae', door: 1, toneLabel: 'Spiritual' })).toBe(true);
  });
});
