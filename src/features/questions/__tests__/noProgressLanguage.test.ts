import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * S1: "No progress language anywhere. No step counters, no percentage complete,
 * no almost done." This locks the qs7 intake surfaces against that class of
 * copy so it can never creep back in — a step counter or a "3 of 5" is exactly
 * the kind of thing that ships silently and only a literal test catches.
 *
 * DayZeroGate (the pre-four-doors legacy gate) is included: its "Step X of N"
 * counter — the one S1 violation this lock was first flagged against (#122) —
 * was removed, so it is now held to the same rule as every other intake surface.
 */
const INTAKE_SURFACES = [
  'src/app/(auth)/disclaimer.tsx', // S0 welcome gate
  'src/features/auth/FourDoorsGate.tsx', // four-doors gate
  'src/features/auth/DayZeroGate.tsx', // pre-four-doors gate (flag off / rollback)
  'src/features/journal/NewEntry.tsx', // compose (writing surface)
  'src/components/GentleQuestionCard.tsx', // in-conversation question
  'src/app/(tabs)/index.tsx', // Home
  'src/features/questions/cadence.ts', // question prompts
];

// Step counters ("Step 3 of 5" / "3 of 5"), progress percentages, and "almost
// done/there". The percentage rule is anchored to a progress word ("60%
// complete", "40% done") on purpose: a bare "\d+%" also matches CSS layout
// values like width: '100%', which are not progress language and were a false
// positive. "%\s*complete" stays as a separate catch for a wordless "% complete".
const BANNED: { name: string; re: RegExp }[] = [
  { name: 'step counter', re: /\bstep\b[^.\n]{0,20}\b\d+\s+of\s+\d+/i },
  { name: 'n of m counter', re: /\b\d+\s+of\s+\d+\b/i },
  { name: 'progress percentage', re: /\b\d+\s*%\s*(complete|done|finished|remaining|left|through)\b/i },
  { name: 'percent complete', re: /%\s*complete/i },
  { name: 'almost done/there', re: /\balmost\s+(done|there)\b/i },
];

describe('no progress language on intake surfaces (S1)', () => {
  for (const surface of INTAKE_SURFACES) {
    it(`${surface} carries no progress language`, () => {
      const src = readFileSync(join(process.cwd(), surface), 'utf8');
      for (const { name, re } of BANNED) {
        expect({ surface, banned: name, matched: re.exec(src)?.[0] ?? null }).toEqual({
          surface,
          banned: name,
          matched: null,
        });
      }
    });
  }
});
