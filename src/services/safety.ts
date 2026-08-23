import { apiClient } from '@/lib/http';

/**
 * The four-level safety model (Crisis Detection Workflows). Every submission is
 * classified into one level; the system over-responds rather than under-responds
 * at the top of the scale (a low-confidence Level 4 category still triggers
 * Level 4). This mock stands in for the real Layer-1 keyword + Layer-2 semantic
 * classifier behind the same interface — the UI surfaces it drives are the point.
 */
export enum SafetyLevel {
  /** Normal grief — the default, no special behavior. */
  Normal = 1,
  /** Elevated distress — a gentle inline resource, nothing interrupted. */
  Elevated = 2,
  /** High risk — Support Mode, strong professional-resource recommendation. */
  High = 3,
  /** Critical risk — the full-screen crisis interface. */
  Critical = 4,
}

export interface SafetyAssessment {
  level: SafetyLevel;
  /** True when classification confidence was low but still routed up the scale. */
  lowConfidence?: boolean;
}

export interface SafetyService {
  /** Fast, offline keyword pre-flight — runs instantly on every submission. */
  classify(text: string): SafetyAssessment;
  /** The authoritative tier from the backend classifier. Never downgrades below
   * the local pre-flight, and falls back to it when the backend is unreachable
   * (fail-safe toward showing help). */
  classifyRemote(text: string): Promise<SafetyAssessment>;
}

// Placeholder keyword sets. NOT a real classifier — the production Layer-2
// semantic model replaces this. Kept deliberately conservative so the mock
// errs toward over-responding.
const CRITICAL = [
  'kill myself',
  'end my life',
  'want to die',
  'better off dead',
  'suicide',
  'take my own life',
  'be with him now',
  'be with her now',
  'be with them now',
  'join him',
  'join her',
  'join them',
];
const HIGH = [
  "can't go on",
  'cannot go on',
  'no reason to live',
  'hopeless',
  'hurt myself',
  "don't want to be here",
  'give up on everything',
];
const ELEVATED = [
  'worthless',
  "can't cope",
  'cannot cope',
  'overwhelmed',
  'falling apart',
  "can't do this anymore",
];

function matches(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export class MockSafetyService implements SafetyService {
  classify(text: string): SafetyAssessment {
    if (override !== null) return { level: override };
    const t = text.toLowerCase();
    if (matches(t, CRITICAL)) return { level: SafetyLevel.Critical };
    if (matches(t, HIGH)) return { level: SafetyLevel.High };
    if (matches(t, ELEVATED)) return { level: SafetyLevel.Elevated };
    return { level: SafetyLevel.Normal };
  }

  /** No backend in the mock: the pre-flight is authoritative. */
  async classifyRemote(text: string): Promise<SafetyAssessment> {
    return this.classify(text);
  }
}

/** Backend crisis tier → the app's four-level scale. */
const TIER_TO_LEVEL: Record<string, SafetyLevel> = {
  none: SafetyLevel.Normal,
  tier_1: SafetyLevel.Elevated,
  tier_2: SafetyLevel.High,
  tier_3: SafetyLevel.Critical,
};

/**
 * Authoritative safety via the backend classifier (`POST /safety/classify`),
 * with the local keyword pass as an instant, offline-safe pre-flight and floor.
 * The backend is the source of truth for tiering; on a crisis tier (tier_2/3)
 * the returned level drives the app's crisis surfaces. Network failures fall
 * back to the local pre-flight — the classifier never fails toward silence.
 */
export class ApiSafetyService implements SafetyService {
  private readonly local = new MockSafetyService();

  classify(text: string): SafetyAssessment {
    return this.local.classify(text);
  }

  async classifyRemote(text: string): Promise<SafetyAssessment> {
    const pre = this.local.classify(text);
    // A dev/demo override forces the tier — skip the backend so it wins.
    if (override !== null) return pre;
    try {
      const res = await apiClient.post<{ tier: string; crisis: boolean; categories: string[] }>(
        '/safety/classify',
        { text },
      );
      const remote = TIER_TO_LEVEL[res.tier] ?? SafetyLevel.Normal;
      // Backend is authoritative, but never below the local pre-flight.
      return { level: Math.max(pre.level, remote) as SafetyLevel };
    } catch {
      // Backend unreachable → local pre-flight (fail-safe toward showing help).
      return pre;
    }
  }
}

/**
 * Dev/demo override: force every classification to a given level (or clear it).
 * Lets us drive each safety surface without composing risky text, and lets the
 * "all sixty-four demo entries stay at Level 1" rule be enforced in demos.
 */
let override: SafetyLevel | null = null;
export function setSafetyOverride(level: SafetyLevel | null) {
  override = level;
}
export function getSafetyOverride(): SafetyLevel | null {
  return override;
}
