import { create } from 'zustand';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';

export interface LearnedItem {
  id: string;
  label: string;
  value: string;
  /** Where it came from: the gate, the ongoing conversation questions, or a seed. */
  source: 'gate' | 'conversation';
}

interface UnansweredQuestion {
  id: string;
  prompt: string;
}

interface WhatIKnowState {
  learned: LearnedItem[];
  unanswered: UnansweredQuestion[];
  /** Rebuild the learned list from the gate answers + conversation questions. */
  hydrateFromSession: () => void;
  updateItem: (id: string, value: string) => void;
  deleteItem: (id: string) => void;
}

/**
 * Conversation-question ids → the plain label shown in What I Know. Human and
 * pet ids that ask the same thing map to the same label, so the page reads the
 * same regardless of path.
 */
const QUESTION_LABELS: Record<string, string> = {
  h0: 'About your loved one',
  p0: 'About your loved one',
  h10: 'Meaningful dates',
  p10: 'Meaningful dates',
  h11: 'What helps you steady',
  p11: 'What helps you steady',
  h12: 'Never suggest',
  p12: 'Never suggest',
  h13: 'Faith or spiritual framing',
  p13: 'Faith or spiritual framing',
  h14: 'Topics to avoid',
  p14: 'Topics to avoid',
  h15: 'The time before the loss',
  h18: 'What has helped so far',
  p18: 'What has helped so far',
  h20: 'Who else is in your life',
  h21: 'What else you are carrying',
  h22: 'Cause of death',
  p20: 'Cause of death',
  h23: 'Anything else to know',
};

/** Each open prompt, with the question ids that would answer it (so it retires
 * from the "not yet answered" list once the companion has learned it). */
const UNANSWERED_PROMPTS: { id: string; prompt: string; answeredBy: string[] }[] = [
  { id: 'u1', prompt: 'Is there faith or spiritual language you would like here?', answeredBy: ['h13', 'p13'] },
  { id: 'u2', prompt: 'Are there topics you would rather never see?', answeredBy: ['h14', 'p14'] },
  { id: 'u3', prompt: 'What helps you steady yourself in a hard moment?', answeredBy: ['h11', 'p11'] },
];

/**
 * The What I Know store backs the transparency page: everything the companion
 * has learned, each item editable and deletable, plus a quiet list of questions
 * not yet answered. There is no progress bar and no completeness percentage —
 * a completeness meter would tell a grieving person she is behind on paperwork.
 */
export const useWhatIKnowStore = create<WhatIKnowState>((set) => ({
  learned: [],
  unanswered: UNANSWERED_PROMPTS.map(({ id, prompt }) => ({ id, prompt })),

  hydrateFromSession() {
    const g = useSessionStore.getState().session?.gateAnswers;
    const answers = useQuestionsStore.getState().answers;

    const fromGate: LearnedItem[] = [];
    if (g?.callName) fromGate.push({ id: 'g-name', label: 'What to call you', value: g.callName, source: 'gate' });
    if (g?.lovedOneName)
      fromGate.push({ id: 'g-loved', label: 'Who you are grieving', value: g.lovedOneName, source: 'gate' });
    if (g?.relationship)
      fromGate.push({ id: 'g-rel', label: 'Your relationship', value: g.relationship, source: 'gate' });
    if (g?.species) fromGate.push({ id: 'g-species', label: 'Kind of companion', value: g.species, source: 'gate' });
    if (g?.tone) fromGate.push({ id: 'g-tone', label: 'How to be with you', value: g.tone, source: 'gate' });

    // Everything learned from the ongoing conversation questions.
    const fromConversation: LearnedItem[] = [];
    for (const [qid, label] of Object.entries(QUESTION_LABELS)) {
      const value = answers[qid]?.trim();
      if (value) fromConversation.push({ id: `q-${qid}`, label, value, source: 'conversation' });
    }

    // Prompts retire from "not yet answered" once a corresponding qid is answered.
    const unanswered = UNANSWERED_PROMPTS.filter(
      (p) => !p.answeredBy.some((qid) => answers[qid]?.trim()),
    ).map(({ id, prompt }) => ({ id, prompt }));

    set({ learned: [...fromGate, ...fromConversation], unanswered });
  },

  updateItem(id, value) {
    set((s) => ({ learned: s.learned.map((i) => (i.id === id ? { ...i, value } : i)) }));
  },

  deleteItem(id) {
    // Deleting a learned fact removes it everywhere immediately; the companion
    // does not re-learn it without new confirmation.
    set((s) => ({ learned: s.learned.filter((i) => i.id !== id) }));
  },
}));
