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
  /** Whether faith or spiritual language is welcome, and which tradition. */
  faith?: string;
  /** Book titles in their library. */
  books?: string;
  /** Facts the companion has learned, in the person's own words. */
  known?: string;
}

function systemPrompt(body: SummaryRequest): string {
  const loved = body.loved?.trim() || 'their loved one';
  const person = body.name?.trim() || 'This person';
  const who = [
    body.name ? ` The author is ${body.name}.` : '',
    body.loved ? ` They are grieving ${body.loved}.` : '',
    body.relationship ? ` Relationship: ${body.relationship}.` : '',
    body.communication ? ` They asked to be spoken to with ${body.communication}.` : '',
    body.faith ? ` ${body.faith}` : '',
  ].join('');
  const about = [
    body.known ? `\n\nWhat they have shared about their life:\n${body.known}` : '',
    body.books ? `\n\nTheir reference library: ${body.books}` : '',
  ].join('');

  return `You are writing a kind, gentle, and genuinely useful summary of a grieving person's own journal and what they have shared, so a therapist, a supporter, or the person themselves can understand where they are and how to be good company to them. You are given the person's own journal entries and their own remembered facts and preferences.${who}${about}

Write in warm, compassionate, tender language throughout. Honor the person and their loved one with care, notice their strength and any small steps forward, and hold their pain without minimizing it. Keep any hope honest and never forced.

Structure the summary in two parts.

First, an opening of two or three short paragraphs, with no heading, giving an overview of the main themes moving through the journal, how they seem to be shifting over time, and what appears to bring comfort or difficulty.

Then a set of short, gently titled sections. Begin each section title on its own line with '## ' followed by a warm, plain title. Under each title write one short paragraph. Include a section ONLY when the entries or the remembered facts genuinely contain material for it, and never invent anything to fill one. Draw on these where the material exists, using these titles:
## Who ${loved} was
A gentle portrait of ${loved} as a person or animal in their own right, before the illness or the loss: who they were, what they were like, what they loved.
## The time before ${loved} died
What was happening in ${loved}'s life and in ${person}'s life in the weeks and months leading up to the loss, told with care.
## Dates that hold weight
The meaningful dates they have named, such as a birthday, an anniversary, the day of the loss, or another day that matters, so a supporter can be present around them.
## Books and resources that have helped
Always include this section. List every book, article, or other resource the person names anywhere in their journal entries or remembered facts, giving the author when it is known, and gently note if they say they are partway through one or that a particular person is reading it. Also include any titles listed in their reference library above. If, and only if, no book or resource appears anywhere at all, write exactly: Not included.
## How ${person} wishes to be met
The voice and tone they prefer, and whether faith or spiritual language is welcome, so anyone supporting them can follow their lead.
## Topics to leave aside
Anything ${person} has asked never to be brought up or suggested, stated plainly and briefly so it can be honored. Only include this section if they have named something.

Rules, strict: never be clinical, cold, or judgmental. Do not diagnose. Do not give advice or instructions. Do not invent anything that is not in what you were given. Do not quote or describe any app, its questions, its prompts, or its features; write only about the person and what they have shared. Do not include administrative notes such as photo or journal-setup preferences. Say died, never passed away. Do not use the words closure or journey. Never use em dashes; use commas or separate sentences. No lists or bullet points inside a section, only flowing sentences.`;
}

/**
 * The model writes the books section from what the reader actually recorded in
 * their entries. If it omits the section entirely, add one so the overview is
 * never missing it: the reference-library titles when there are any, otherwise
 * "Not included." Inserted before "How ... wishes to be met".
 */
export function ensureBooksSection(summary: string, books: string): string {
  const blocks = summary
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.some((b) => /^##\s+Books\b/i.test(b))) return summary;
  const titles = books.trim();
  const booksBlock =
    '## Books and resources that have helped\n' +
    (titles ? `Books kept in their reference library: ${titles}.` : 'Not included.');
  let idx = blocks.findIndex((b) => /^##\s+How\b/i.test(b));
  if (idx < 0) idx = blocks.findIndex((b) => /^##\s+Topics\b/i.test(b));
  if (idx < 0) idx = blocks.length;
  blocks.splice(idx, 0, booksBlock);
  return blocks.join('\n\n');
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

    return Response.json({
      summary: summary ? ensureBooksSection(scrub(summary), body.books ?? '') : '',
    });
  } catch (err) {
    console.error('[api/summary]', err);
    return Response.json({ summary: '' });
  }
}
