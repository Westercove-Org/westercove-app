import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { scopedStorage } from '@/features/profile/activeProfile';

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
export const useWhatIKnowStore = create<WhatIKnowState>()(
  persist(
    (set, get) => ({
      learned: [],
      unanswered: SEED_UNANSWERED,

      hydrateFromSession() {
        const g = useSessionStore.getState().session?.gateAnswers;
        const fromGate: LearnedItem[] = [];
        if (g?.callName)
          fromGate.push({
            id: 'g-name',
            label: 'What to call you',
            value: g.callName,
            source: 'gate',
          });
        if (g?.lovedOneName)
          fromGate.push({
            id: 'g-loved',
            label: 'Who you are grieving',
            value: g.lovedOneName,
            source: 'gate',
          });
        if (g?.relationship)
          fromGate.push({
            id: 'g-rel',
            label: 'Your relationship',
            value: g.relationship,
            source: 'gate',
          });
        if (g?.species)
          fromGate.push({
            id: 'g-species',
            label: 'Kind of companion',
            value: g.species,
            source: 'gate',
          });
        if (g?.tone)
          fromGate.push({
            id: 'g-tone',
            label: 'How to be with you',
            value: g.tone,
            source: 'gate',
          });
        // Gate answers are rebuilt from the session; everything learned since then
        // is the person's own and survives, so re-hydrating never erases it.
        const kept = get().learned.filter((i) => i.source !== 'gate');
        set({ learned: [...fromGate, ...(kept.length ? kept : SEED_CONVERSATION)] });
      },

      addLearnedLine(line) {
        const trimmed = line.trim();
        if (!trimmed) return;
        // Cadence lines arrive as "Label: what they said". Split so the page shows
        // a labeled fact like every other row, not one long sentence.
        const at = trimmed.indexOf(': ');
        const label = at > 0 ? trimmed.slice(0, at) : trimmed;
        const value = at > 0 ? trimmed.slice(at + 2) : '';
        set((s) => ({
          learned: [...s.learned, { id: `l-${Date.now()}`, label, value, source: 'conversation' }],
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
    }),
    {
      name: 'westercove.whatiknow',
      storage: createJSONStorage(() => scopedStorage('whatiknow')),
      // The unanswered list is static seed copy; only what we learned is durable.
      partialize: (s) => ({ learned: s.learned }),
    },
  ),
);
