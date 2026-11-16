// Leitura de estado do jogo usada pelo planner e pelo executor da skill de mineração
// (spec 0007). Nomes de campo marcados com "não confirmado" são melhor-esforço a partir da
// documentação lida (knowledge_base/distilled/docs_mining.md,
// knowledge_base/distilled/docs_travel.md) — validação manual (tasks.md, itens 7-9) confirma
// contra o jogo real; nenhum deles, se errado, derruba o código (tudo cai em `undefined`
// em vez de lançar).
import type { SkillContext } from "../../loop/skill_interface.js";
import { isCargoFull, readShip } from "../../core/ship_state.js";
import { findNearestStationPoi, readSystem } from "../../core/system_state.js";

export { isCargoFull, readShip, findNearestStationPoi };
export type { ShipSnapshot } from "../../core/ship_state.js";

export interface MiningNode {
  /** `true` quando o array equipado não consegue trabalhar esse node agora (docs_mining.md) — omitido quando trabalhável. */
  too_sparse?: boolean;
  remaining?: number;
}

export interface PoiSnapshot {
  // Nome exato do array não confirmado — docs_mining.md só confirma o nome pro resumo curto
  // em `location.resources`; assume o mesmo nome aqui pro `get_poi` completo.
  resources?: MiningNode[];
}

export async function readPoi(ctx: SkillContext): Promise<PoiSnapshot | null> {
  const result = await ctx.session.call("spacemolt", "get_poi", {});
  if (!result.ok || result.kind !== "query") return null;
  return result.result as PoiSnapshot;
}

export function hasWorkableNode(poi: PoiSnapshot): boolean {
  return (poi.resources ?? []).some((node) => node.too_sparse !== true && node.remaining !== 0);
}

// Não confirmado — nenhuma fonte lida nomeia o campo que marca um POI como minerável na
// listagem de get_system (só get_poi, já no POI, confirma via `resources`). Fica só aqui
// (não em core/system_state.ts) porque é específico de mineração.
interface MinablePoi {
  id: string;
  minable?: boolean;
}

export async function findMinablePoi(ctx: SkillContext): Promise<string | null> {
  const system = await readSystem(ctx);
  const candidate = ((system?.pois ?? []) as MinablePoi[]).find((poi) => poi.minable === true);
  return candidate?.id ?? null;
}
