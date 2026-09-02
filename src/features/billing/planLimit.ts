import { HttpError } from '@/lib/http';

/**
 * A plan-limit response (R-1b). The backend returns HTTP 402 with a
 * machine-readable `detail` when an account hits its tier's cap — a profile cap
 * (survey submit/gate) or the Standard chat-turn cap. It is an upgrade prompt,
 * NOT an error: render `message` verbatim and route to /subscription. Sponsored
 * and null-tier accounts are never gated, so the server never sends this to them.
 */
export interface PlanLimit {
  code: 'profile_limit_reached' | 'chat_turn_cap_reached';
  tier: 'standard' | 'premium' | null;
  limit: number;
  message: string;
}

/** The plan-limit detail if `err` is a 402 carrying one, else null. FastAPI
 * wraps the detail object under `detail`, so we read `data.detail.code`. */
export function planLimitFrom(err: unknown): PlanLimit | null {
  if (!(err instanceof HttpError) || err.status !== 402) return null;
  const detail = (err.data as { detail?: Partial<PlanLimit> } | null)?.detail;
  if (
    detail &&
    (detail.code === 'profile_limit_reached' || detail.code === 'chat_turn_cap_reached') &&
    typeof detail.message === 'string'
  ) {
    return {
      code: detail.code,
      tier: detail.tier ?? null,
      limit: typeof detail.limit === 'number' ? detail.limit : 0,
      message: detail.message,
    };
  }
  return null;
}
