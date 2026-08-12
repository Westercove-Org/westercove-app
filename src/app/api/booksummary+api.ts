import Anthropic from '@anthropic-ai/sdk';

import { scrub } from '@/services/companionPrompt';

/**
 * Writes a short, warm summary of how a book can help someone who is grieving,
 * from just its title and author. Used when a person adds their own book to
 * their library, so they do not have to write the summary themselves.
 *
 * Always returns `{ summary }` with 200. An empty string is a valid answer: the
 * shelf and the export both read fine without a summary, so a failure here must
 * never surface as an error to someone adding a book their person loved.
 */

export interface BookSummaryRequest {
  title?: string;
  author?: string;
}

const SYSTEM =
  'You write a warm, plain summary of how a book can gently support someone who is grieving. Given only a title and author, write at least 200 words, in two or three short paragraphs, describing what the book offers, the kind of reader or loss it may suit, the tone and approach it takes, and how it can help someone who is grieving. Be honest and never overpromise, and never claim a specific fact you are not sure of. Rules: no headings or lists, do not use the words closure or journey, never use em dashes, and return only the summary text with nothing else. If you do not recognize the book, write carefully and generally from the title and author, describing the kind of support a book like this can offer without inventing specific claims about its contents.';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as BookSummaryRequest;
    const title = (body.title ?? '').trim().slice(0, 200);
    const author = (body.author ?? '').trim().slice(0, 200);
    if (!title) return Response.json({ summary: '' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ summary: '' });
    }

    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Title: ${title}\nAuthor: ${author || 'unknown'}` }],
    });

    if (message.stop_reason === 'refusal') {
      return Response.json({ summary: '' });
    }

    const summary = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return Response.json({ summary: scrub(summary) });
  } catch (err) {
    console.error('[api/booksummary]', err);
    return Response.json({ summary: '' });
  }
}
