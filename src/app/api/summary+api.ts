import Anthropic from '@anthropic-ai/sdk';

import { scrub } from '@/services/companionPrompt';

/**
 * The journal-export overview. Builds a kind summary of themes from the user's
 * own entries so the PDF is safe to hand to a therapist.
 *
 * It sees the person's own words only — never the app's questions, prompts,
 * cadence, or internals. On any failure it returns an empty summary and the
 * PDF falls back to the entries verbatim, which is always the safe output.
 */

export interface SummaryRequest {
  /** The user's entries, dated, oldest first, already joined. */
  entries: string;
  name?: string;
  loved?: string;
  relationship?: string;
  /** The tone the person asked for. */
  communication?: string;
  /** Book titles in their library. */
  books?: string;
  /** Facts the companion has learned, in the person's own words. */
  known?: string;
}

function systemPrompt(body: SummaryRequest): string {
  const detail = [
    body.name ? `The author is ${body.name}.` : '',
    body.loved ? `They are grieving ${body.loved}.` : '',
    body.relationship ? `Relationship: ${body.relationship}.` : '',
    body.communication ? `They asked to be spoken to with ${body.communication}` : '',
    body.known ? `\n\nWhat they have shared about their life:\n${body.known}` : '',
    body.books ? `\n\nBooks in their library: ${body.books}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `You are preparing a gentle overview of a grief journal, written to be shared with a therapist or kept by the author. You are summarizing themes, not diagnosing and not advising.

${detail}

Write in plain, warm prose about what this person is carrying, what recurs, and what seems to help. Use only what is in their entries. Do not invent events, dates, or feelings they did not write.

Language rules, strict:
- Say "died," never "passed away."
- Never use the words "closure" or "journey" (to describe grief).
- Never use em dashes. Use commas or separate sentences.
- No exclamation points, no emojis, no platitudes, no clinical labels.

Structure it as a few short paragraphs. You may use at most three gently titled sections, each opening with a line of the form "## Title". Do not address the reader with instructions and do not mention that you are an AI.`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SummaryRequest;
    if (!body.entries?.trim() || !process.env.ANTHROPIC_API_KEY) {
      return Response.json({ summary: '' });
    }

    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2048,
      output_config: { effort: 'medium' },
      system: systemPrompt(body),
      messages: [
        {
          role: 'user',
          content: `Here are the entries, oldest first.\n\n${body.entries}`,
        },
      ],
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
    console.error('[api/summary]', err);
    return Response.json({ summary: '' });
  }
}
