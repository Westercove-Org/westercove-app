/**
 * Question cadence, ported from the Lovable demo (src/lib/cadence.ts). A
 * `journalStage` (0..MAX_STAGE) unlocks tiered question buckets; the Home card
 * surfaces one at a time (safety-first), with dependency branches. Answers are
 * recorded and summarised into "What I Know".
 */
import type { GateMode } from '@/features/auth/types';

/** One qualifying journaling session advances the cadence one stage. */
export const QUALIFY_SECONDS = 60;
/** Highest cadence stage (0..5); the ten day-buckets compress into six. */
export const MAX_STAGE = 5;

export const STAGE = {
  day0: 0,
  day1: 1,
  day2_3: 2,
  day3_4: 3,
  day5: 3,
  day6: 4,
  day7: 4,
  day8: 5,
  day9: 5,
  day10_11: 5,
} as const;

export type CadenceInput = 'text' | 'choice' | 'multi' | 'library';
export type CadenceTier = 'safety' | 'warm' | 'depth' | 'logistics';

const TIER_RANK: Record<CadenceTier, number> = { safety: 0, warm: 1, depth: 2, logistics: 3 };

/** The cadence-relevant slice of a profile's state. */
export interface CadenceState {
  module: GateMode;
  name: string;
  onboarded: boolean;
  journalStage: number;
  answeredIds: string[];
  sessionCount: number;
  checkinSnoozeSession: number;
  faithLanguage?: string;
  faithTradition?: string;
  faithTraditionDetail?: string;
  causeOfDeath?: string;
}

/** Fields a question may set on the cadence state when answered. */
export type CadenceSet = Partial<
  Pick<CadenceState, 'faithLanguage' | 'faithTradition' | 'faithTraditionDetail' | 'causeOfDeath'>
>;

export interface CadenceQuestion {
  id: string;
  tier: CadenceTier;
  thresholdStage: number;
  input: CadenceInput;
  options?: string[];
  optional?: boolean;
  prompt: (name: string, s: CadenceState) => string;
  toLine: (answer: string, name: string) => string;
  sets?: (answer: string) => CadenceSet;
  dependsOn?: (s: CadenceState) => boolean;
}

export const LIBRARY_INVITE =
  'Your library is a quiet room of resources you can trust, and it belongs to you. You decide which books become your library, naming the titles that matter to you. If none come to mind, Westercove can offer a few, and even then they are only invitations. You can add books, remove them, search the collection freely, and come back anytime, so your shelf always reflects where you are in your grief.';

const NON_CIRCUMSTANCE = new Set(['Prefer not to say', 'Unknown']);
const CAUSE_OPTIONS = [
  'Natural aging',
  'Illness',
  'Accident',
  'Sudden or unexpected',
  'Euthanasia',
  'Unknown',
  'Prefer not to say',
];
const FAITH_TRADITION_OPTIONS = [
  'Christian',
  'Muslim',
  'Jewish',
  'Buddhist',
  'Hindu',
  'Spiritual, but not a specific religion',
  'Another faith (I will share it)',
  'Prefer not to say',
];
const FAITH_YES = new Set(['Yes, I would like that', 'Some is okay']);
const FAITH_OTHER = 'Another faith (I will share it)';

export const PET_QUESTIONS: CadenceQuestion[] = [
  {
    id: 'about',
    tier: 'warm',
    thresholdStage: STAGE.day0,
    input: 'text',
    prompt: (name) => `I would love to hear about ${name}. What were they like, the real them?`,
    toLine: (a, name) => `About ${name}: ${a}`,
  },
  {
    id: 'found',
    tier: 'warm',
    thresholdStage: STAGE.day0,
    input: 'text',
    prompt: () => `How did the two of you find each other?`,
    toLine: (a) => `How we found each other: ${a}`,
  },
  {
    id: 'nicknames',
    tier: 'warm',
    thresholdStage: STAGE.day0,
    input: 'text',
    optional: true,
    prompt: (name) => `Did ${name} have nicknames? Most of the good ones do.`,
    toLine: (a, name) => `${name}'s nicknames: ${a}`,
  },
  {
    id: 'photos',
    tier: 'logistics',
    thresholdStage: STAGE.day1,
    input: 'choice',
    optional: true,
    options: ['I will, thank you', 'Not yet'],
    prompt: (name) => `If you would like, you can add photos of ${name} here, anytime. I will keep them.`,
    toLine: (a) => `Photos: ${a}`,
  },
  {
    id: 'dates',
    tier: 'logistics',
    thresholdStage: STAGE.day1,
    input: 'text',
    optional: true,
    prompt: (name) =>
      `Some days matter, like the day ${name} came into your life, and the day they died. If you share them, I can be here around those days. Only if that would help.`,
    toLine: (a) => `Dates that matter: ${a}`,
  },
  {
    id: 'steady',
    tier: 'safety',
    thresholdStage: STAGE.day2_3,
    input: 'text',
    prompt: () =>
      `When a hard moment comes, what usually helps you steady yourself? I will remember it for the times you need it.`,
    toLine: (a) => `What helps me steady myself: ${a}`,
  },
  {
    id: 'never',
    tier: 'safety',
    thresholdStage: STAGE.day2_3,
    input: 'text',
    optional: true,
    prompt: () =>
      `Is there anything you would rather I never bring up or suggest? You do not have to explain why. I will simply keep it out.`,
    toLine: (a) => `Please never bring up: ${a}`,
  },
  {
    id: 'faith',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'choice',
    options: ['Yes, I would like that', 'No, please keep it out', 'Some is okay'],
    prompt: () =>
      `Do you want faith or spiritual language in this space? Whatever your answer, including none at all, I will follow your lead.`,
    toLine: (a) => `Faith or spiritual language: ${a}`,
    sets: (a) => ({ faithLanguage: a }),
  },
  {
    id: 'faith-tradition',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'choice',
    optional: true,
    options: FAITH_TRADITION_OPTIONS,
    dependsOn: (s) => FAITH_YES.has(s.faithLanguage ?? ''),
    prompt: () => `Thank you. So my words feel right to you, which faith or tradition should I follow?`,
    toLine: (a) => `Faith or tradition: ${a}`,
    sets: (a) => ({ faithTradition: a }),
  },
  {
    id: 'faith-tradition-other',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'text',
    optional: true,
    dependsOn: (s) => s.faithTradition === FAITH_OTHER,
    prompt: () => `However you would describe it, I am listening.`,
    toLine: (a) => `Faith or tradition, in their words: ${a}`,
    sets: (a) => ({ faithTraditionDetail: a }),
  },
  {
    id: 'avoid',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'text',
    optional: true,
    prompt: () =>
      `Are there topics you would rather never see here? A word or two is enough, and I will keep them out.`,
    toLine: (a) => `Topics to keep out: ${a}`,
  },
  {
    id: 'role',
    tier: 'depth',
    thresholdStage: STAGE.day5,
    input: 'multi',
    options: [
      'Companion',
      'Emotional support',
      'Service animal',
      'Therapy animal',
      'Best friend',
      'Family member',
      'Adventure partner',
      'Other',
    ],
    prompt: (name) => `What role did ${name} play in your life? Tap any that fit.`,
    toLine: (a, name) => `${name}'s role in my life: ${a}`,
  },
  {
    id: 'missing',
    tier: 'depth',
    thresholdStage: STAGE.day5,
    input: 'text',
    prompt: (name) => `What did ${name} bring to your days that you find yourself missing most right now?`,
    toLine: (a, name) => `What I miss most about ${name}: ${a}`,
  },
  {
    id: 'journal',
    tier: 'logistics',
    thresholdStage: STAGE.day6,
    input: 'choice',
    options: ['A regular space, yes', 'Let it sit quietly for now'],
    prompt: () =>
      `There is a journal here if writing helps. I can make it a regular space for you, or it can sit quietly until you want it. Which feels right?`,
    toLine: (a) => `Journal preference: ${a}`,
  },
  {
    id: 'library',
    tier: 'logistics',
    thresholdStage: STAGE.day6,
    input: 'library',
    optional: true,
    prompt: () => LIBRARY_INVITE,
    toLine: (a) => `Reference library: ${a}`,
  },
  {
    id: 'howlong',
    tier: 'logistics',
    thresholdStage: STAGE.day7,
    input: 'text',
    prompt: () => `How long were the two of you together? However long it was, it counts.`,
    toLine: (a) => `How long we were together: ${a}`,
  },
  {
    id: 'cause',
    tier: 'depth',
    thresholdStage: STAGE.day7,
    input: 'choice',
    optional: true,
    options: CAUSE_OPTIONS,
    prompt: (name) =>
      `If you want me to know, how did ${name} die? Tap what fits, or tap prefer not to say, and either way we go on from here together.`,
    toLine: (a, name) => `How ${name} died: ${a}`,
    sets: (a) => ({ causeOfDeath: a }),
  },
  {
    id: 'circumstances',
    tier: 'depth',
    thresholdStage: STAGE.day8,
    input: 'text',
    optional: true,
    dependsOn: (s) => !!s.causeOfDeath && !NON_CIRCUMSTANCE.has(s.causeOfDeath),
    prompt: (name, s) => {
      const c = s.causeOfDeath ?? '';
      if (c === 'Euthanasia') {
        return `Making that choice for someone who trusted you completely is an act of care, and it is heavy. If you ever want to walk me through the time before it, I am here, and there is no clock on it.`;
      }
      if (c === 'Accident' || c === 'Sudden or unexpected') {
        return `Sudden loss leaves no time to prepare. When there is no warning, there is no time to get ready. If you want to tell me about that day, I am listening. If not, we can leave it be.`;
      }
      return `What was that stretch of time like for you, the days and weeks before ${name} died? Share whatever you want of it.`;
    },
    toLine: (a, name) => `The time before ${name} died: ${a}`,
  },
  {
    id: 'turning',
    tier: 'depth',
    thresholdStage: STAGE.day9,
    input: 'text',
    optional: true,
    prompt: (name) =>
      `Is there a part of ${name}'s story you keep turning over in your mind? Something unresolved, something you wish had gone differently. It can live here too, if you want to set it down.`,
    toLine: (a) => `Something I keep turning over: ${a}`,
  },
  {
    id: 'other-loss',
    tier: 'depth',
    thresholdStage: STAGE.day9,
    input: 'text',
    optional: true,
    prompt: (name) =>
      `Is ${name} the only loss you are carrying right now? If there are others, another animal, a person, a change in your life, they are welcome here too.`,
    toLine: (a) => `Other losses I am carrying: ${a}`,
  },
  {
    id: 'present',
    tier: 'logistics',
    thresholdStage: STAGE.day10_11,
    input: 'choice',
    optional: true,
    options: ['Yes, please', 'I am okay for now'],
    prompt: () => `Would it help if I was extra present with you right now?`,
    toLine: (a) => `Wants extra presence right now: ${a}`,
  },
];

export const HUMAN_QUESTIONS: CadenceQuestion[] = [
  {
    id: 'h-about',
    tier: 'warm',
    thresholdStage: STAGE.day0,
    input: 'text',
    prompt: (name) => `Tell me about ${name}, whenever you are ready. Not how they died. Who they were.`,
    toLine: (a, name) => `About ${name}: ${a}`,
  },
  {
    id: 'h-relationship',
    tier: 'warm',
    thresholdStage: STAGE.day0,
    input: 'text',
    prompt: () => `What was your relationship like?`,
    toLine: (a) => `Our relationship: ${a}`,
  },
  {
    id: 'h-other-loss',
    tier: 'warm',
    thresholdStage: STAGE.day0,
    input: 'text',
    optional: true,
    prompt: (name) =>
      `Sometimes grief does not arrive one at a time. Is ${name} the only loss you are carrying right now? If there are others, they belong here too.`,
    toLine: (a) => `Other losses I am carrying: ${a}`,
  },
  {
    id: 'h-photos',
    tier: 'logistics',
    thresholdStage: STAGE.day1,
    input: 'choice',
    optional: true,
    options: ['I will, thank you', 'Not yet'],
    prompt: (name) =>
      `If you would like, you can add a photo of ${name} here. There is no hurry. Some people find it comforting and some are not ready yet, and their page will wait either way.`,
    toLine: (a) => `Photos: ${a}`,
  },
  {
    id: 'h-dates',
    tier: 'logistics',
    thresholdStage: STAGE.day1,
    input: 'text',
    optional: true,
    prompt: () =>
      `Would it help if I remembered meaningful dates? Some dates carry weight, the day they were born, the day they died. If you share them, I can be here around those days.`,
    toLine: (a) => `Dates that matter: ${a}`,
  },
  {
    id: 'h-steady',
    tier: 'safety',
    thresholdStage: STAGE.day2_3,
    input: 'text',
    prompt: () =>
      `When a hard moment comes, what usually helps you get steady? A walk, a person, a place, anything. I will remember it for the times you need it.`,
    toLine: (a) => `What helps me steady myself: ${a}`,
  },
  {
    id: 'h-never',
    tier: 'safety',
    thresholdStage: STAGE.day2_3,
    input: 'text',
    optional: true,
    prompt: () =>
      `Is there anything you would rather I never bring up or suggest? You do not have to explain why. I will simply keep it out.`,
    toLine: (a) => `Please never bring up: ${a}`,
  },
  {
    id: 'h-faith',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'choice',
    options: ['Yes, I would like that', 'No, please keep it out', 'Some is okay'],
    prompt: () =>
      `Do you want faith or spiritual language in this space? Whatever your answer, including none at all, I will follow your lead.`,
    toLine: (a) => `Faith or spiritual language: ${a}`,
    sets: (a) => ({ faithLanguage: a }),
  },
  {
    id: 'h-faith-tradition',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'choice',
    optional: true,
    options: FAITH_TRADITION_OPTIONS,
    dependsOn: (s) => FAITH_YES.has(s.faithLanguage ?? ''),
    prompt: () => `Thank you. So my words feel right to you, which faith or tradition should I follow?`,
    toLine: (a) => `Faith or tradition: ${a}`,
    sets: (a) => ({ faithTradition: a }),
  },
  {
    id: 'h-faith-tradition-other',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'text',
    optional: true,
    dependsOn: (s) => s.faithTradition === FAITH_OTHER,
    prompt: () => `However you would describe it, I am listening.`,
    toLine: (a) => `Faith or tradition, in their words: ${a}`,
    sets: (a) => ({ faithTraditionDetail: a }),
  },
  {
    id: 'h-avoid',
    tier: 'safety',
    thresholdStage: STAGE.day3_4,
    input: 'text',
    optional: true,
    prompt: () =>
      `Are there topics you would rather never see here? A word or two is enough, and I will keep them out.`,
    toLine: (a) => `Topics to keep out: ${a}`,
  },
  {
    id: 'h-before',
    tier: 'depth',
    thresholdStage: STAGE.day5,
    input: 'text',
    prompt: (name) =>
      `Whenever it feels right, I would like to understand the time before ${name} died, what was happening in their life and in yours. There is no schedule for this one.`,
    toLine: (a, name) => `The time before ${name} died: ${a}`,
  },
  {
    id: 'h-journal',
    tier: 'logistics',
    thresholdStage: STAGE.day6,
    input: 'choice',
    options: ['A regular space, yes', 'Let it sit quietly for now'],
    prompt: () =>
      `There is a journal here and it can be a regular space for you, or it can sit quietly until you want it. Which feels right?`,
    toLine: (a) => `Journal preference: ${a}`,
  },
  {
    id: 'h-writehelp',
    tier: 'logistics',
    thresholdStage: STAGE.day6,
    input: 'choice',
    optional: true,
    options: ['A question to start me off', 'A memory to hold onto', 'Just the blank page'],
    prompt: () =>
      `When you write, what helps most: a question to start you off, a memory to hold onto, or just the blank page?`,
    toLine: (a) => `What helps me write: ${a}`,
  },
  {
    id: 'h-library',
    tier: 'logistics',
    thresholdStage: STAGE.day6,
    input: 'library',
    optional: true,
    prompt: () => LIBRARY_INVITE,
    toLine: (a) => `Reference library: ${a}`,
  },
  {
    id: 'h-others',
    tier: 'depth',
    thresholdStage: STAGE.day7,
    input: 'text',
    prompt: () => `Who else is in your life right now, and how are those relationships helping you?`,
    toLine: (a) => `Who else is in my life: ${a}`,
  },
  {
    id: 'h-weighing',
    tier: 'depth',
    thresholdStage: STAGE.day8,
    input: 'text',
    prompt: (name) => `Grief rarely travels alone. Beyond losing ${name}, what else is weighing on you these days?`,
    toLine: (a) => `What else is weighing on me: ${a}`,
  },
  {
    id: 'h-howdied',
    tier: 'depth',
    thresholdStage: STAGE.day8,
    input: 'text',
    optional: true,
    prompt: (name) =>
      `You never have to tell me how ${name} died. If a day comes when you want me to know, share exactly as much as you choose, and we will go from there.`,
    toLine: (a, name) => `How ${name} died: ${a}`,
  },
  {
    id: 'h-anything',
    tier: 'depth',
    thresholdStage: STAGE.day9,
    input: 'text',
    optional: true,
    prompt: () =>
      `Is there anything else you want me to know? About them, about you, about how to be good company to you.`,
    toLine: (a) => `Something else I want you to know: ${a}`,
  },
];

export function questionsFor(module: GateMode): CadenceQuestion[] {
  return module === 'human' ? HUMAN_QUESTIONS : PET_QUESTIONS;
}

export function currentStage(s: CadenceState): number {
  return s.journalStage ?? 0;
}

/** The next question to surface: unanswered + stage-unlocked + deps met, chosen
 *  safety-first then by list order. */
export function nextQuestion(s: CadenceState): CadenceQuestion | null {
  // Every cadence question is a loved-one question ("Tell me about {name}", …).
  // With no name — a Door-3 loss or pre-gate — there is no one to ask about, so
  // suppress the check-in rather than interpolate a fabricated or empty name.
  if (!s.name?.trim()) return null;
  const qs = questionsFor(s.module ?? 'pet');
  const answered = new Set(s.answeredIds ?? []);
  const stage = currentStage(s);
  const eligible = qs
    .map((q, i) => ({ q, i }))
    .filter(
      ({ q }) => !answered.has(q.id) && stage >= q.thresholdStage && (!q.dependsOn || q.dependsOn(s)),
    );
  if (!eligible.length) return null;
  eligible.sort((a, b) => {
    const r = TIER_RANK[a.q.tier] - TIER_RANK[b.q.tier];
    return r !== 0 ? r : a.i - b.i;
  });
  return eligible[0].q;
}

/** True when there is an eligible question and the user has not snoozed this session. */
export function hasCheckin(s: CadenceState): boolean {
  if (!s.onboarded) return false;
  if ((s.sessionCount ?? 0) <= (s.checkinSnoozeSession ?? 0)) return false;
  return nextQuestion(s) !== null;
}
