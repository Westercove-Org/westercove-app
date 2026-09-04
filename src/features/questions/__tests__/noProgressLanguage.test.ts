import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * S1: "No progress language anywhere. No step counters, no percentage complete,
 * no almost done." This locks the qs7 intake surfaces against that class of
 * copy so it can never creep back in — a step counter or a "3 of 5" is exactly
 * the kind of thing that ships silently and only a literal test catches.
 *
 * DELIBERATELY NOT COVERED: src/features/auth/DayZeroGate.tsx — the pre-four-
 * doors LEGACY gate. It renders "Step X of N" (an S1 violation) and is flagged
 * to god for a fix-or-retire decision; it is superseded by FourDoorsGate under
 * the four-doors intake. Including it here would fail the lock over legacy UX
 * that is out of this card's scope. When it is fixed or retired, add it below.
 */
const INTAKE_SURFACES = [
  'src/app/(auth)/disclaimer.tsx', // S0 welcome gate
  'src/features/auth/FourDoorsGate.tsx', // four-doors gate
  'src/features/journal/NewEntry.tsx', // compose (writing surface)
  'src/components/GentleQuestionCard.tsx', // in-conversation question
  'src/app/(tabs)/index.tsx', // Home
  'src/features/questions/cadence.ts', // question prompts
];

// Step counters ("Step 3 of 5" / "3 of 5"), percentages, and "almost done/there".
const BANNED: { name: string; re: RegExp }[] = [
  { name: 'step counter', re: /\bstep\b[^.\n]{0,20}\b\d+\s+of\s+\d+/i },
  { name: 'n of m counter', re: /\b\d+\s+of\s+\d+\b/i },
  { name: 'percentage', re: /\b\d+\s*%/ },
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
