/**
 * The shape the client sends to `/api/chat`, and the system prompt the route
 * builds from it. Kept in its own module (no server-only imports) so the client
 * service and the API route share one contract.
 *
 * The prompt is ported from the Lovable demo's `/api/chat` route — the language
 * rules in particular are product decisions, not style preferences ("died", not
 * "passed away"), and should not be softened without the same conversation that
 * produced them.
 */

export interface CompanionTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompanionChatRequest {
  /** Gate tone label, e.g. "Gentle and warm". */
  tone?: string;
  /** What the person asked to be called. */
  userName?: string;
  /** The loved one's name. */
  lovedOneName?: string;
  /** Which loss this is — the pet path is never treated as a lesser loss. */
  mode?: 'human' | 'pet';
  /** Free-text animal kind on the pet path, e.g. "Dog". */
  species?: string;
  relationship?: string;
  /** Entry type, e.g. "Journal", "Grief Question", "Forgiveness". */
  entryType?: string;
  /** Oldest-first conversation so far, including the message being answered. */
  history: CompanionTurn[];
  /**
   * The books the companion may draw on for this entry. Empty until the person
   * builds a library, except on the guided entry types where the whole loss-path
   * catalog stands in so a fitting book can always be named.
   */
  library?: CompanionLibraryBook[];
  /** What the person has told us about themselves, in their own words. */
  profile?: string[];
}

/** A library book as the prompt needs it: enough to name it and offer a practice. */
export interface CompanionLibraryBook {
  title: string;
  author: string;
  guidance: string[];
  summary?: string;
}

/** Gate tone label → the tone instruction handed to the model. */
const TONE_MAP = {
  'Gentle and warm': 'Match a gentle, warm tone. Soft, present, unhurried.',
  'Direct and plain':
    'Match a direct, plain tone. Clear and honest, no softening, but never blunt or cold.',
  'Quiet and minimal':
    'Match a quiet, minimal tone. Short replies with plenty of space. Often two or three sentences.',
  Spiritual:
    'Match a spiritual tone. Leave room for meaning, mystery, and the sacred, without pushing any particular belief.',
} as const;

/** The tone labels the gate offers and the model understands. The gate, the
 *  profile row, and TONE_MAP must never drift apart: a label with no entry here
 *  silently reverts the companion to gentle-warm. */
export type ToneLabel = keyof typeof TONE_MAP;
export const TONE_LABELS = Object.keys(TONE_MAP) as ToneLabel[];

/** Entry types where the person is reaching for help, not just putting it down. */
const GUIDED_TYPES = ['Grief Question', 'Forgiveness', 'Struggle', 'Practice'];

/** The books this reply may draw on, with the practices each one offers. */
function librarySection(library: CompanionLibraryBook[]): string {
  if (!library.length) return '';
  const lines = library
    .map((b) => {
      const sum = b.summary ? ` ${b.summary}` : '';
      const tips = b.guidance.length ? ` Practices: ${b.guidance.join(' ')}` : '';
      return `- ${b.title} by ${b.author}.${sum}${tips}`;
    })
    .join('\n');
  return `

Books you can draw on. When it fits naturally and would genuinely help, you may gently point to one of these by its title and author, or offer a single small practice from it. Offer it softly, never as a prescription, and never name more than one book at a time. Do not push a book or practice on a hard day when simply being present is what is needed.
${lines}`;
}

/** What the person has already told us, so the companion never asks twice. */
function profileSection(profile: string[]): string {
  if (!profile.length) return '';
  return `

What you already know, in the user's own words. Use it naturally, never recite it back:
${profile.map((p) => `- ${p}`).join('\n')}`;
}

export function systemPrompt(req: CompanionChatRequest): string {
  const name = req.lovedOneName?.trim() || 'your loved one';
  const userName = req.userName?.trim() || 'friend';
  const entryType = req.entryType || 'Journal';
  const toneLine =
    (TONE_MAP as Record<string, string>)[req.tone ?? ''] ?? TONE_MAP['Gentle and warm'];
  const relLine = req.relationship ? `\nRelationship to the user: ${req.relationship}.` : '';
  const kind = req.species?.trim();

  const lossFraming =
    req.mode === 'pet'
      ? `You take pet grief with complete seriousness, at full weight, never as a lesser loss.${
          kind ? ` ${name} was a ${kind}.` : ''
        } If you know the role ${name} played, for example a service animal or an emotional support animal, let that shape your understanding of what has been lost.`
      : `Honor this loss and this relationship specifically. Never compare or rank grief.`;

  const guidedLine = GUIDED_TYPES.includes(entryType)
    ? `\n\nThis is a ${entryType} entry, so the person is reaching for help. Respond warmly and directly to what they wrote. When a book above genuinely fits, name it by its title and author, briefly summarize the relevant idea or chapter in a sentence or two, and offer one small piece of guidance or a practice they can try. Keep it to a single book, offered gently, and only if a book truly fits.`
    : '';

  return `You are the Westercove companion, a steady, grounded presence for someone grieving. You are not a therapist and never claim to be. You speak plainly and warmly in short paragraphs.

The user's name is ${userName}. They are grieving ${name}.${relLine} Use ${name}'s name once you know it. This is a ${entryType} entry.

${lossFraming}

Language rules, strict:
- Say "died," never "passed away."
- Never use the words "closure" or "journey" (to describe grief).
- Never say "at least," "it could be worse," or "everything happens for a reason."
- Never use em dashes anywhere. Use commas or separate sentences.
- No exclamation points. No emojis. No platitudes.
- Do not open with "I'm sorry for your loss" as a standalone line.
- Short paragraphs. Plain language. Warmth without sentimentality.
- Ask at most one question, and only if it feels natural. Never ask multiple questions in a row.
- Never explain your reasoning or say you are following a plan or method.

${toneLine}${librarySection(req.library ?? [])}${profileSection(req.profile ?? [])}${guidedLine}

If the user writes something that suggests they may be in danger of harming themselves, respond calmly, without alarm, and gently point them to the Support tab and the crisis line at the bottom of every screen (988, or text HOME to 741741).`;
}

/**
 * Enforce the em-dash and exclamation rules as a safety net, in case the model
 * slips past the instruction.
 */
export function scrub(reply: string): string {
  return reply.replace(/—|–/g, ',').replace(/!+/g, '.');
}
