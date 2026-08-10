import Anthropic from '@anthropic-ai/sdk';

import {
  scrub,
  systemPrompt,
  type CompanionChatRequest,
} from '@/services/companionPrompt';

/**
 * The companion endpoint. Runs server-side only (`+api.ts`), so
 * ANTHROPIC_API_KEY never enters the client bundle.
 *
 * Every failure path returns 200 with a usable reply. A grieving person writing
 * into their journal must never be shown a stack trace or an empty response, so
 * the fallback text is part of the contract, not a placeholder.
 */

const FALLBACK =
  'Thank you for putting this here. I am having trouble finding my words right now, but what you wrote is held, and it stays.';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as CompanionChatRequest;
    const history = Array.isArray(body.history) ? body.history : [];
    if (history.length === 0) {
      return Response.json({ error: 'Missing history' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // No key configured (e.g. a fresh clone) — the client falls back locally.
      return Response.json({ reply: '', unavailable: true });
    }

    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      // Short conversational replies; higher effort buys nothing here.
      output_config: { effort: 'low' },
      system: systemPrompt(body),
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    });

    // Grief writing sits near topics the classifiers watch; check before reading.
    if (message.stop_reason === 'refusal') {
      return Response.json({ reply: FALLBACK });
    }

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return Response.json({ reply: scrub(text) || FALLBACK });
  } catch (err) {
    console.error('[api/chat]', err);
    return Response.json({ reply: FALLBACK });
  }
}
