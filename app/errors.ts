// Normaliza qualquer erro (jogo, lib, rede) pro formato CommandResult (constituição,
// regra 6: erro fala, nunca exceção escapa). Importa as classes de erro da lib só pra
// `instanceof` — nenhuma chamada de rede acontece aqui, só reconhecimento de tipo.
import { ConnectionClosedError, HttpError, SpacemoltError } from "@spacemolt/lib";
import type { CommandResult } from "./game_client.types.js";

export function toCommandResult(err: unknown): CommandResult {
  if (err instanceof SpacemoltError) {
    return { ok: false, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof HttpError) {
    return {
      ok: false,
      code: "http_error",
      message: err.message,
      details: { status: err.status, url: err.url, attempts: err.attempts, retryAfterMs: err.retryAfterMs },
    };
  }

  if (err instanceof ConnectionClosedError) {
    return {
      ok: false,
      code: "connection_closed",
      message: err.message,
      details: { closeCode: err.code, reason: err.reason },
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return { ok: false, code: "unknown_error", message };
}
