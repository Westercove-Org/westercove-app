/**
 * Timer-driven profile questions.
 *
 * These are the warm ("green") rewrites from the Grieveai UX/UI Question Design
 * v4 document — the parenthetical wordings, never the clinical originals. The
 * companion asks them one at a time, and instead of arriving on calendar Day N,
 * each Day bucket unlocks after the user accumulates one more interval of
 * talk-time on the entry conversation screens (see useQuestionTimer).
 *
 * `[name]` is a token replaced with the loved one's name at render time, the
 * same way the day-zero gate does it (copy.gate.q4Pet.replace('[name]', loved)).
 */

/** How much talk-time unlocks the next Day. 2 min for testing. */
export const QUESTION_INTERVAL_MS = 2 * 60 * 1000; // PRODUCTION: 30 * 60 * 1000

export type QKind = 'text' | 'chips' | 'info'; // info = an offer that captures nothing

export interface Question {
  id: string;
  text: string;
  kind: QKind;
  options?: string[];
  /** For `chips`: allow selecting more than one option. */
  multi?: boolean;
  placeholder?: string;
}

export interface DayBucket {
  label: string;
  questions: Question[];
}

/** Human loss module, Day 1 onward (Day 0 is the existing day-zero gate). */
export const DAYS_HUMAN: DayBucket[] = [
  {
    label: 'Day 1',
    questions: [
      {
        id: 'h9',
        kind: 'info',
        text: 'If you would like, you can add a photo of [name] here. There is no hurry. Some people find it comforting and some are not ready yet, and their page will wait either way.',
      },
      {
        id: 'h10',
        kind: 'text',
        text: 'Some dates carry weight: the day they were born, the day they died. If you share them, I can be here around those days. Only if that would help you.',
        placeholder: 'Only if you want to…',
      },
    ],
  },
  {
    label: 'Day 2 or 3',
    questions: [
      {
        id: 'h11',
        kind: 'text',
        text: 'When a hard moment comes, what usually helps you steady? A walk, a person, a place, anything. I will remember it for the times you need it.',
        placeholder: 'Whatever helps you steady…',
      },
      {
        id: 'h12',
        kind: 'text',
        text: 'Is there anything you would rather I never bring up or suggest? You do not have to explain why. I will simply keep it out.',
        placeholder: 'You can leave this blank…',
      },
    ],
  },
  {
    label: 'Day 3 or 4',
    questions: [
      {
        id: 'h13',
        kind: 'text',
        text: 'Do you want faith or spiritual language in this space? Whatever your answer, including none at all, I will follow your lead.',
        placeholder: 'Say as much or as little…',
      },
      {
        id: 'h14',
        kind: 'text',
        text: 'Are there topics you would rather never see here? A word or two is enough, and I will keep them out.',
        placeholder: 'A word or two is enough…',
      },
    ],
  },
  {
    label: 'Day 5',
    questions: [
      {
        id: 'h15',
        kind: 'text',
        text: 'Whenever it feels right, I would like to understand the time before [name] died, what was happening in their life and in yours. There is no schedule for this one.',
        placeholder: 'Whenever it feels right…',
      },
    ],
  },
  {
    label: 'Day 6',
    questions: [
      {
        id: 'h16',
        kind: 'chips',
        text: 'There is a journal here if writing helps. I can make it a regular space for you, or it can sit quietly until you want it. Which feels right?',
        options: ['Make it a regular space', 'Let it sit quietly'],
      },
      {
        id: 'h17',
        kind: 'chips',
        text: 'When you write, what helps most: a question to start you off, a memory to hold onto, or nothing at all, just the blank page?',
        options: ['A question to start me off', 'A memory to hold onto', 'Just the blank page'],
      },
      {
        id: 'h18',
        kind: 'text',
        text: 'Has anything helped so far, a book, an article, something a friend gave you? If so, tell me, and I can meet you inside it.',
        placeholder: 'A book, an article…',
      },
    ],
  },
  {
    label: 'Day 7',
    questions: [
      {
        id: 'h20',
        kind: 'text',
        text: 'Who else is around you right now? However those relationships are doing, steady or strained, it helps me to know who is in the room with you.',
        placeholder: 'Who is in the room with you…',
      },
    ],
  },
  {
    label: 'Day 8',
    questions: [
      {
        id: 'h21',
        kind: 'text',
        text: 'Grief rarely travels alone. Beyond losing [name], what else is weighing on you these days?',
        placeholder: 'Whatever else you carry…',
      },
      {
        id: 'h22',
        kind: 'text',
        text: 'You never have to tell me how [name] died. If a day comes when you want me to know, share exactly as much as you choose, and we will go from there.',
        placeholder: 'Only if and when you want…',
      },
    ],
  },
  {
    label: 'Day 9',
    questions: [
      {
        id: 'h23',
        kind: 'text',
        text: 'Is there anything else you want me to know? About [name], about you, about how to be good company to you.',
        placeholder: 'Anything at all…',
      },
    ],
  },
  {
    label: 'Days 10 and 11',
    questions: [
      {
        id: 'h24',
        kind: 'chips',
        text: 'I have noticed you seem to prefer short replies. Want me to keep it that way? If I have read that wrong, tell me and I will adjust.',
        options: ['Yes, keep it short', "No, that's not quite right"],
      },
    ],
  },
];

/** Pet loss module, Day 1 onward. */
export const DAYS_PET: DayBucket[] = [
  {
    label: 'Day 1',
    questions: [
      {
        id: 'p9',
        kind: 'info',
        text: 'If you would like, add photos of [name] here, anytime. Their page will keep them.',
      },
      {
        id: 'p10',
        kind: 'text',
        text: 'Some days matter: the day [name] came into your life, the day they died. If you share them, I can be here around those days. Only if that would help.',
        placeholder: 'Only if you want to…',
      },
    ],
  },
  {
    label: 'Day 2 or 3',
    questions: [
      {
        id: 'p11',
        kind: 'text',
        text: 'When a hard moment comes, what usually helps you steady? I will remember it for the times you need it.',
        placeholder: 'Whatever helps you steady…',
      },
      {
        id: 'p12',
        kind: 'text',
        text: 'Is there anything you would rather I never bring up or suggest? You do not have to explain why. I will simply keep it out.',
        placeholder: 'You can leave this blank…',
      },
    ],
  },
  {
    label: 'Day 3 or 4',
    questions: [
      {
        id: 'p13',
        kind: 'text',
        text: 'Do you want faith or spiritual language in this space? Whatever your answer, including none at all, I will follow your lead.',
        placeholder: 'Say as much or as little…',
      },
      {
        id: 'p14',
        kind: 'text',
        text: 'Are there topics you would rather never see here? A word or two is enough, and I will keep them out.',
        placeholder: 'A word or two is enough…',
      },
    ],
  },
  {
    label: 'Day 5',
    questions: [
      {
        id: 'p15',
        kind: 'chips',
        multi: true,
        text: 'What place did [name] hold in your life? Tap everything that fits.',
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
      },
      {
        id: 'p16',
        kind: 'text',
        text: 'What did [name] bring to your days that you find yourself missing most right now?',
        placeholder: 'What you miss most…',
      },
    ],
  },
  {
    label: 'Day 6',
    questions: [
      {
        id: 'p17',
        kind: 'chips',
        text: 'There is a journal here if writing helps. I can make it a regular space for you, or it can sit quietly until you want it. Which feels right?',
        options: ['Make it a regular space', 'Let it sit quietly'],
      },
      {
        id: 'p18',
        kind: 'text',
        text: 'Has anything helped so far, a book, an article, something a friend gave you? If so, tell me, and I can meet you inside it.',
        placeholder: 'A book, an article…',
      },
    ],
  },
  {
    label: 'Day 7',
    questions: [
      {
        id: 'p19',
        kind: 'text',
        text: 'How long were the two of you together? However long it was, it counts.',
        placeholder: 'However long it was…',
      },
      {
        id: 'p20',
        kind: 'chips',
        text: 'Only if you want me to know: how did [name] die? Tap what fits, or tap prefer not to say, and either way we go on from here together.',
        options: [
          'Natural aging',
          'Illness',
          'Accident',
          'Sudden or unexpected',
          'Euthanasia',
          'Unknown',
          'Prefer not to say',
        ],
      },
    ],
  },
  {
    label: 'Day 8',
    questions: [
      {
        id: 'p21',
        kind: 'text',
        text: 'Making that choice for someone who trusted you completely is an act of care, and it is heavy. If you ever want to walk me through the time before it, I am here, and there is no clock on it.',
        placeholder: 'Only if you want to…',
      },
    ],
  },
  {
    label: 'Day 9',
    questions: [
      {
        id: 'p24',
        kind: 'text',
        text: "Is there a part of [name]'s story you keep turning over? Something unresolved, something you wish had gone differently. It can live here too, if you want to set it down.",
        placeholder: 'If you want to set it down…',
      },
      {
        id: 'p25',
        kind: 'text',
        text: 'Is [name] the only loss you are carrying right now? If there are others, another animal, a person, a change in your life, they are welcome here too.',
        placeholder: 'Others are welcome here too…',
      },
    ],
  },
  {
    label: 'Days 10 and 11',
    questions: [
      {
        id: 'p26',
        kind: 'chips',
        text: 'You talk about your morning walks with [name] a lot. Want me to be extra present in the mornings? If I have that wrong, just say so.',
        options: ['Yes, be present in the mornings', "No, that's not quite right"],
      },
    ],
  },
];
