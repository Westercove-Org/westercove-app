import { sanitize } from './voiceRules';

export interface CompanionRequest {
  text: string;
  type: string;
  lovedOneName?: string;
  /** The companion tone from the gate (e.g. "Quiet and minimal"), if known. */
  tone?: string;
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

/** Pick a short, meaningful fragment of the user's own words to reflect back —
 * the longest clause, trimmed to ~9 words, lower-cased so it reads mid-sentence. */
function salientFragment(text: string): string {
  const clauses = text
    .replace(/\n+/g, ' ')
    .split(/[.,;:!?]/)
    .map((c) => c.trim())
    .filter((c) => c.split(/\s+/).length >= 3);
  const clause = clauses.sort((a, b) => b.length - a.length)[0] ?? text.trim();
  const words = clause.split(/\s+/).slice(0, 9).join(' ');
  const frag = words.length < clause.length ? `${words}…` : words;
  return frag.charAt(0).toLowerCase() + frag.slice(1);
}

/** An opener tuned to the entry type and the loved one's name. */
function opener(type: string, name?: string): string {
  const who = name ?? 'them';
  switch (type) {
    case 'Memory':
      return `That paints such a clear picture of ${who}.`;
    case 'Letter':
      return `Saying it to ${who} here is its own kind of keeping.`;
    case 'Struggle':
      return 'That sounds like a heavy stretch, and it makes sense that it sits close.';
    case 'Anniversary':
      return 'Dates can arrive in the body before the mind names them.';
    case 'Forgiveness':
      return 'That is tender ground, and you get to move across it at your own pace.';
    default:
      return name ? `Thank you for putting this here, alongside ${who}.` : 'Thank you for putting this here.';
  }
}

/** A closing move, shorter for the minimal/quiet tone. */
function closer(tone?: string): string {
  if (tone && /minimal|quiet/i.test(tone)) return 'I am here with it.';
  if (tone && /direct|plain/i.test(tone)) return 'It is real, and it can stay here as long as you need.';
  return 'You do not have to resolve any of it right now. The love and the ache can both be true at once, and I am here with it, and with you.';
}

/**
 * Mock companion. Stands in for the real Six Moves response architecture behind
 * the same interface: open by naming the weight without advising, reflect the
 * person's own words back, hold contradictions without resolving them, then
 * stop. Output always passes the brand-voice sanitizer. When the user chose
 * "just heard," the Six Moves are suspended and only a brief acknowledgment is
 * given.
 */
export class MockCompanionService implements CompanionService {
  async respond(req: CompanionRequest): Promise<CompanionReply> {
    const headline = makeHeadline(req.text);
    if (req.justHeard) {
      return { response: sanitize('It is heard. It stays here.'), headline: sanitize(headline) };
    }
    const name = req.lovedOneName?.trim();
    const parts = [opener(req.type, name)];

    const frag = salientFragment(req.text);
    if (frag) parts.push(`The part about ${frag} stays with me.`);

    parts.push(closer(req.tone));

    return { response: sanitize(parts.join(' ')), headline: sanitize(headline) };
  }
}
