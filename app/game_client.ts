// Único arquivo que importa @spacemolt/lib e lê credenciais do disco (constituição,
// regras 5 e 12). Todo o resto do sistema conhece só a interface GameSession.
import { readFileSync } from "node:fs";
import { Account } from "@spacemolt/lib";
import { toCommandResult } from "./errors.js";
import type { CommandResult, GameSession } from "./game_client.types.js";
import { withRateLimitRetry } from "./rate_limit.js";

interface Credentials {
  username: string;
  password: string;
}

export async function connect(accountName: string): Promise<GameSession> {
  const credentials = readCredentials(accountName);

  const account = new Account({
    url: "wss://game.spacemolt.com/ws/v2",
    // `reconnect` vem desligado por padrão na lib (requer `credentials` pra re-autenticar
    // sozinha) — sem isto, uma queda de conexão nunca se recupera e o requisito 2 da spec
    // (reautenticação automática) não se cumpre.
    reconnect: true,
    credentials: () => ({ kind: "login", username: credentials.username, password: credentials.password }),
  });
  await account.connect();
  await account.login({ username: credentials.username, password: credentials.password });

  const initialState = structuredClone(account.state);

  const rawCall = async (
    tool: string,
    action: string,
    payload?: Record<string, unknown>
  ): Promise<CommandResult> => {
    try {
      const result = await account.send(tool, action, payload);
      if ("delta" in result) {
        return {
          ok: true,
          kind: "mutation",
          command: result.command,
          tick: result.tick,
          delta: result.delta,
          autoDocked: result.autoDocked,
          autoUndocked: result.autoUndocked,
        };
      }
      return { ok: true, kind: "query", result: result.result, structuredContent: result.structuredContent };
    } catch (err) {
      return toCommandResult(err);
    }
  };

  return {
    accountName,
    initialState,
    getState: () => structuredClone(account.state),
    call: withRateLimitRetry(rawCall),
    on: (eventType, handler) => account.on(eventType, handler),
  };
}

function readCredentials(accountName: string): Credentials {
  const raw = readFileSync(`accounts/${accountName}/credentials.json`, "utf-8");
  return JSON.parse(raw) as Credentials;
}
