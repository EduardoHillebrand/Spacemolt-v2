// Captain's Log nativo do jogo como rede de segurança mínima (spec 0003, requisito 6).
//
// Correção na implementação: o plan.md assumia que o texto do Captain's Log vinha dentro
// de GameSession.initialState (replay automático no login). Na prática, o payload de login
// da lib (`LoggedInPayload`/`LoginResponse`) não tem esse campo — é preciso pedir
// explicitamente via `spacemolt_social.captains_log_list` (sem parâmetros, devolve a
// entrada mais recente). O comportamento fica o mesmo do ponto de vista de quem usa este
// módulo, só a origem do dado mudou.
import type { GameSession } from "../game_client.types.js";
import { list, type MemoryEntry } from "./long_term_memory.js";

interface CaptainsLogListResult {
  entry?: { entry: string; created_at: string; index: number };
}

export async function getCaptainsLogEntry(session: GameSession): Promise<string | null> {
  const result = await session.call("spacemolt_social", "captains_log_list", {});
  if (!result.ok || result.kind !== "query") return null;
  const payload = result.structuredContent as CaptainsLogListResult | undefined;
  return payload?.entry?.entry ?? null;
}

/**
 * Contexto de partida pra uma conta: se já existe memória de longo prazo registrada, ela é
 * a fonte de verdade (requisito 6 — o Captain's Log não a substitui). Só quando a conta
 * ainda não tem nenhuma entrada aqui, usa o Captain's Log nativo como primeiro contexto.
 */
export async function getStartupContext(
  accountName: string,
  session: GameSession,
  options?: Parameters<typeof list>[1]
): Promise<{ source: "long_term_memory"; entries: MemoryEntry[] } | { source: "captains_log"; text: string } | { source: "none" }> {
  const entries = list(accountName, options);
  if (entries.length > 0) {
    return { source: "long_term_memory", entries };
  }

  const text = await getCaptainsLogEntry(session);
  if (text) {
    return { source: "captains_log", text };
  }

  return { source: "none" };
}
