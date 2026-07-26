export interface CompanionRequest {
  text: string;
  type: string;
  lovedOneName?: string;
  /** When true, the user asked to be heard without a response ("just heard"). */
  justHeard?: boolean;
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
      'You do not have to resolve any of it right now — the love and the ache can both be true at once. I am here with it, and with you.',
    ].join(' ');
    return { response, headline };
  }
}
