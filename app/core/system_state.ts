// Leitura de get_system compartilhada entre skills (constituição, regra 5) — mining
// (0007) e trading (0008) ambas precisam achar a estação mais próxima no sistema atual.
import type { SkillContext } from "../loop/skill_interface.js";

export interface SystemPoi {
  id: string;
  base_id?: string;
  has_base?: boolean;
}

export interface SystemSnapshot {
  pois?: SystemPoi[];
}

export async function readSystem(ctx: SkillContext): Promise<SystemSnapshot | null> {
  const result = await ctx.session.call("spacemolt", "get_system", {});
  if (!result.ok || result.kind !== "query") return null;
  return result.result as SystemSnapshot;
}

export async function findNearestStationPoi(ctx: SkillContext): Promise<string | null> {
  const system = await readSystem(ctx);
  const station = (system?.pois ?? []).find((poi) => poi.has_base === true || poi.base_id !== undefined);
  return station?.id ?? station?.base_id ?? null;
}
