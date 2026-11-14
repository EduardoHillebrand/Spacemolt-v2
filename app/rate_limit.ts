// Embrulha GameSession.call com retry pra rate limit (spec 0001, requisito 5). A lib já
// retenta `rate_limited` em mutações por conta própria (ver plan.md) — esta camada é
// redundância deliberada, cobrindo queries e qualquer caso que a lib não trate.
import type { CommandResult } from "./game_client.types.js";

type CallFn = (
  tool: string,
  action: string,
  payload?: Record<string, unknown>
) => Promise<CommandResult>;

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;

export function withRateLimitRetry(call: CallFn): CallFn {
  return async (tool, action, payload) => {
    let lastResult: CommandResult | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const result = await call(tool, action, payload);
      if (result.ok || !isRateLimited(result)) return result;

      lastResult = result;
      if (attempt === MAX_ATTEMPTS) break;
      await sleep(delayFor(result, attempt));
    }

    return lastResult as CommandResult;
  };
}

function isRateLimited(result: CommandResult & { ok: false }): boolean {
  if (result.code === "rate_limited") return true;
  if (result.code === "http_error" && result.details?.status === 429) return true;
  return false;
}

function delayFor(result: CommandResult & { ok: false }, attempt: number): number {
  const details = result.details;
  const retryAfterSec = typeof details?.retry_after === "number" ? details.retry_after : undefined;
  const retryAfterMs = typeof details?.retryAfterMs === "number" ? details.retryAfterMs : undefined;

  if (retryAfterSec !== undefined) return retryAfterSec * 1000;
  if (retryAfterMs !== undefined) return retryAfterMs;

  return BASE_DELAY_MS * 2 ** (attempt - 1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
