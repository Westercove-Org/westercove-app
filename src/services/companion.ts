import {
  type CompanionChatRequest,
  type CompanionTurn,
} from './companionPrompt';

export interface CompanionRequest {
  text: string;
  type: string;
  lovedOneName?: string;
  /** When true, the user asked to be heard without a response ("just heard"). */
  justHeard?: boolean;
  /**
   * Everything already said in this entry, oldest first, excluding `text`.
   * A follow-up turn without it reads as amnesia.
   */
  history?: CompanionTurn[];
  /** Gate answers that shape the voice (tone, relationship, pet vs human). */
  context?: Omit<CompanionChatRequest, 'history' | 'entryType' | 'lovedOneName'>;
}

export interface CompanionReply {
  /** The companion's response (Six Moves), or a brief acknowledgment when justHeard. */
  response: string;
  /** A neutral headline generated from the entry's own content — never editorializing. */
  headline: string;
}

export interface CompanionService {
  respond(request: CompanionRequest): Promise<CompanionReply>;
}

/** Generate a neutral headline from the entry text: the first clause, trimmed,
 * never adding sentiment the user didn't write. */
function makeHeadline(text: string): string {
  const firstLine = text.trim().split('\n')[0].trim();
  const clause = firstLine.split(/[.!?]/)[0].trim() || firstLine;
  const words = clause.split(/\s+/).slice(0, 8).join(' ');
  const headline = words.length < clause.length ? `${words}…` : words;
  return headline.charAt(0).toUpperCase() + headline.slice(1);
}

/**
 * Mock companion. Stands in for the real Six Moves response architecture behind
 * the same interface: open by naming the weight without advising, use the loved
 * one's name when known, hold contradictions without resolving them, then stop.
 * When the user chose "just heard," the Six Moves are suspended and only a brief
 * acknowledgment is given.
 */
export class MockCompanionService implements CompanionService {
  async respond(req: CompanionRequest): Promise<CompanionReply> {
    const headline = makeHeadline(req.text);
    if (req.justHeard) {
      return { response: 'It is heard. It stays here.', headline };
    }
    const name = req.lovedOneName?.trim();
    const naming = name
      ? `What you carry about ${name} is real, and it makes sense that it sits heavy tonight.`
      : 'What you are carrying is real, and it makes sense that it sits heavy.';
    const response = [
      'Thank you for putting this here.',
      naming,
      // No em dash here: the same language rules the model is held to apply to
      // this text, which is what the user sees whenever the API is unreachable.
      'You do not have to resolve any of it right now. The love and the ache can both be true at once, and I am here with it, and with you.',
    ].join(' ');
    return { response, headline };
  }
}

// Companion generation now happens on the backend (chat sessions API,
// `POST /chat/sessions/{id}/messages`), driven from the entries store.
// `MockCompanionService` remains the offline fallback + headline authority.
