import { create } from 'zustand';

import { useSessionStore } from '@/features/auth/sessionStore';

export interface LearnedItem {
  id: string;
  label: string;
  value: string;
  /** Where it came from: the gate, or silently from conversations. */
  source: 'gate' | 'conversation';
}

export interface UnansweredQuestion {
  id: string;
  prompt: string;
}

interface WhatIKnowState {
  learned: LearnedItem[];
  unanswered: UnansweredQuestion[];
  /** Rebuild the learned list from the current session's gate answers + seeds. */
  hydrateFromSession: () => void;
  /** Append a line the companion learned from a cadence answer. */
  addLearnedLine: (line: string) => void;
  updateItem: (id: string, value: string) => void;
  deleteItem: (id: string) => void;
}

const SEED_CONVERSATION: LearnedItem[] = [
  {
    id: 'c1',
    label: 'A place that matters',
    value: 'The lake house, from the summers together',
    source: 'conversation',
  },
];

const SEED_UNANSWERED: UnansweredQuestion[] = [
  { id: 'u1', prompt: 'Is there faith or spiritual language you would like here?' },
  { id: 'u2', prompt: 'Are there topics you would rather never see?' },
  { id: 'u3', prompt: 'What helps you steady yourself in a hard moment?' },
];

/**
 * The What I Know store backs the transparency page: everything the companion
 * has learned, each item editable and deletable, plus a quiet list of questions
 * not yet answered. There is no progress bar and no completeness percentage —
 * a completeness meter would tell a grieving person she is behind on paperwork.
 */
export const useWhatIKnowStore = create<WhatIKnowState>((set) => ({
  learned: [],
  unanswered: SEED_UNANSWERED,

  hydrateFromSession() {
    const g = useSessionStore.getState().session?.gateAnswers;
    const fromGate: LearnedItem[] = [];
    if (g?.callName) fromGate.push({ id: 'g-name', label: 'What to call you', value: g.callName, source: 'gate' });
    if (g?.lovedOneName)
      fromGate.push({ id: 'g-loved', label: 'Who you are grieving', value: g.lovedOneName, source: 'gate' });
    if (g?.relationship)
      fromGate.push({ id: 'g-rel', label: 'Your relationship', value: g.relationship, source: 'gate' });
    if (g?.species) fromGate.push({ id: 'g-species', label: 'Kind of companion', value: g.species, source: 'gate' });
    if (g?.tone) fromGate.push({ id: 'g-tone', label: 'How to be with you', value: g.tone, source: 'gate' });
    set({ learned: [...fromGate, ...SEED_CONVERSATION] });
  },

  addLearnedLine(line) {
    const value = line.trim();
    if (!value) return;
    set((s) => ({
      learned: [...s.learned, { id: `l-${Date.now()}`, label: value, value: '', source: 'conversation' }],
    }));
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
