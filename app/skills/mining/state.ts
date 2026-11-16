// Leitura de estado do jogo usada pelo planner e pelo executor da skill de mineração
// (spec 0007). Nomes de campo marcados com "não confirmado" são melhor-esforço a partir da
// documentação lida (knowledge_base/distilled/docs_mining.md,
// knowledge_base/distilled/docs_travel.md) — validação manual (tasks.md, itens 7-9) confirma
// contra o jogo real; nenhum deles, se errado, derruba o código (tudo cai em `undefined`
// em vez de lançar).
import type { SkillContext } from "../../loop/skill_interface.js";

export interface ShipSnapshot {
  docked?: boolean;
  cargo_used?: number;
  cargo_capacity?: number;
}

export async function readShip(ctx: SkillContext): Promise<ShipSnapshot | null> {
  const result = await ctx.session.call("spacemolt", "get_ship", {});
  if (!result.ok || result.kind !== "query") return null;
  return result.result as ShipSnapshot;
}

export function isCargoFull(ship: ShipSnapshot): boolean {
  if (ship.cargo_used === undefined || ship.cargo_capacity === undefined) return false;
  return ship.cargo_used >= ship.cargo_capacity;
}

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

export interface SystemPoi {
  id: string;
  base_id?: string;
  has_base?: boolean;
  // Não confirmado — nenhuma fonte lida nomeia o campo que marca um POI como minerável na
  // listagem de get_system (só get_poi, já no POI, confirma via `resources`).
  minable?: boolean;
}

export interface SystemSnapshot {
  pois?: SystemPoi[];
}

export async function readSystem(ctx: SkillContext): Promise<SystemSnapshot | null> {
  const result = await ctx.session.call("spacemolt", "get_system", {});
  if (!result.ok || result.kind !== "query") return null;
  return result.result as SystemSnapshot;
}

export async function findMinablePoi(ctx: SkillContext): Promise<string | null> {
  const system = await readSystem(ctx);
  const candidate = (system?.pois ?? []).find((poi) => poi.minable === true);
  return candidate?.id ?? null;
}

export async function findNearestStationPoi(ctx: SkillContext): Promise<string | null> {
  const system = await readSystem(ctx);
  const station = (system?.pois ?? []).find((poi) => poi.has_base === true || poi.base_id !== undefined);
  return station?.id ?? station?.base_id ?? null;
}
