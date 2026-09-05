/**
 * 4-Doors gate: the one-time 5-tap form (design doc §1.2 / §4.1). The display
 * wording mirrors the backend catalog (`catalog_v2.py` GATE*), and this module
 * owns the display → API-value mapping so the component stays declarative and
 * the mapping is unit-tested. Q2 (door) is the only branch point; Q3/Q4 wording
 * and options re-resolve from the chosen door.
 *
 * The POSTed enum values (door, tone, door_subtype) must match the backend
 * enums exactly — the API validates them. Free-text-ish taps (D3 "what changed"
 * and timing, D4 species) are sent as their display strings; the backend maps
 * D3 "what changed" onto the sub-type itself.
 */
import type { GateMode } from '@/features/auth/types';
import type { FourDoorsGateInput } from '@/services/survey';

export type Door = 1 | 2 | 3 | 4;

/**
 * Door → book module. `door` is the CANONICAL loss signal (v4 retired the
 * pet/human split): the module/`mode` is DERIVED from it here and NOWHERE else.
 * Do not set `mode` independently or treat it as authoritative — always derive
 * it from the door. Door 4 (pet) → 'pet'; every other door → 'human'.
 */
export function moduleForDoor(door: Door | undefined): GateMode {
  return door === 4 ? 'pet' : 'human';
}

export const DOOR_OPTIONS: { door: Door; label: string; sublabel: string }[] = [
  {
    door: 1,
    label: 'Someone I love died',
    sublabel: 'I’m grieving the death of someone important to me.',
  },
  {
    door: 2,
    label: 'I’m caring for someone who is slipping away',
    sublabel: 'I’m living with anticipatory grief.',
  },
  {
    door: 3,
    label: 'Part of my life has changed or ended',
    sublabel: 'Health, relationship, career, identity, or another significant loss.',
  },
  {
    door: 4,
    label: 'I lost a beloved animal',
    sublabel: 'I’m grieving the death of a pet or animal companion.',
  },
];

/** Q3 taps for D3 ("What changed?"); the backend maps these onto the sub-type. */
export const D3_CHANGE_OPTIONS = [
  'My body or my health',
  'A relationship ended',
  'A role or identity I had',
  'Something else',
];

/** Q4 taps for D2 ("Which of these is closest right now?") → door_subtype enum. */
export const D2_DETAIL_OPTIONS: { label: string; subtype: string }[] = [
  { label: 'They are dying', subtype: 'dying' },
  { label: 'They are here but changed', subtype: 'here_but_changed' },
  { label: 'We are not speaking', subtype: 'not_speaking' },
];

/** Q4 taps for D3 ("When did it change?"); sent verbatim as change_timing. */
export const D3_TIMING_OPTIONS = [
  'In the last few weeks',
  'Months ago',
  'Years ago',
  'It is still happening',
];

/** Q4 taps for D4 ("What kind of animal were they?"); sent verbatim as species. */
export const D4_SPECIES_OPTIONS = [
  'Dog',
  'Cat',
  'Horse',
  'Bird',
  'Small animal',
  'Another animal',
];

/** Q5 tone taps → tone enum value. */
export const TONE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Gentle and warm', value: 'gentle_warm' },
  { label: 'Direct and plain', value: 'direct_plain' },
  { label: 'Quiet and minimal', value: 'quiet_minimal' },
  { label: 'Direct and tactful', value: 'direct_tactful' },
  { label: 'Spiritual', value: 'spiritual' },
];

/** Mutable answers collected as the user taps through the gate. */
export interface GateState {
  userName: string;
  door?: Door;
  /** Q3: the name (D1/D2/D4). */
  lovedOneName?: string;
  /** Q3: the "what changed" tap (D3). */
  whatChanged?: string;
  /** Q4: D1 free-text relationship. */
  relationship?: string;
  /** Q4: D2 detail tap label. */
  door2Detail?: string;
  /** Q4: D3 timing tap. */
  changeTiming?: string;
  /** Q4: D4 species tap. */
  species?: string;
  /** Q4: D4 free-text breed. */
  breed?: string;
  /** Q5: tone tap label. */
  toneLabel?: string;
}

const toneValue = (label: string): string =>
  TONE_OPTIONS.find((t) => t.label === label)?.value ?? '';

const d2Subtype = (label: string | undefined): string | undefined =>
  D2_DETAIL_OPTIONS.find((o) => o.label === label)?.subtype;

/** Whether the current step's required answer is present (drives Continue). */
export function canAdvance(step: GateStep, s: GateState): boolean {
  switch (step) {
    case 'name':
      return s.userName.trim().length > 0;
    case 'door':
      return s.door != null;
    case 'q3':
      // D3 taps a category; the others type a name.
      return s.door === 3 ? !!s.whatChanged : !!s.lovedOneName?.trim();
    case 'q4':
      // D1 free-texts a relationship (optional → always allowed to proceed);
      // D2/D3 must tap; D4 must pick a species (breed is optional).
      if (s.door === 2) return !!s.door2Detail;
      if (s.door === 3) return !!s.changeTiming;
      if (s.door === 4) return !!s.species;
      return true; // D1 relationship is optional
    case 'tone':
      return !!s.toneLabel;
  }
}

export type GateStep = 'name' | 'door' | 'q3' | 'q4' | 'tone';
// Door first (Wesley's warm arrival): the very first screen after payment is the
// welcome + door choice, not a name prompt. Name and tone follow, quieter, once
// the person has said what brings them here. q3/q4 still come after the door
// (they branch on it), and canAdvance gates each step independently.
export const GATE_STEPS: GateStep[] = ['door', 'name', 'q3', 'q4', 'tone'];

/** Map the collected answers onto the `POST /survey/gate` request body. Assumes
 * the gate is complete (all `canAdvance` gates passed). */
export function buildGatePayload(s: GateState): FourDoorsGateInput {
  const base: FourDoorsGateInput = {
    userName: s.userName.trim(),
    door: s.door as Door,
    tone: toneValue(s.toneLabel ?? ''),
  };
  switch (s.door) {
    case 1:
      return { ...base, lovedOneName: s.lovedOneName?.trim(), relationship: s.relationship?.trim() || undefined };
    case 2:
      return { ...base, lovedOneName: s.lovedOneName?.trim(), doorSubtype: d2Subtype(s.door2Detail) };
    case 3:
      return { ...base, whatChanged: s.whatChanged, changeTiming: s.changeTiming };
    case 4:
      return {
        ...base,
        lovedOneName: s.lovedOneName?.trim(),
        species: s.species,
        breed: s.breed?.trim() || undefined,
      };
    default:
      return base;
  }
}
