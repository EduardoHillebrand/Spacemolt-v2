// Spec 0009-skill-navigation: módulo compartilhado de movimento (constituição, regra 5) —
// não é skill registrada no loop (spec 0006), ver nota de arquitetura em
// specs/0009-skill-navigation/spec.md. Único lugar que chama travel/jump/find_route/refuel.
// Nunca decide *pra onde* ir nem reage a risco de rota por conta própria — só executa o
// destino recebido e devolve um resultado claro (constituição, regra 6).
import type { CommandResult, Destination, NavigationResult } from "../game_client.types.js";
import type { SkillContext } from "../loop/skill_interface.js";

// "tanque >= estimativa da rota + 20% antes de se comprometer" (docs_guides_fuel.md) —
// aplicada aqui como margem de segurança antes de cada salto, não só no início da viagem.
const FUEL_SAFETY_MARGIN = 1.2;

interface RouteStep {
  action: "jump" | "travel";
  targetId: string;
  /** Só conhecido pra jumps (fuel_per_jump de find_route); travel intra-sistema não vem calculado. */
  fuelCost?: number;
}

type PlanOutcome = { status: "ok"; steps: RouteStep[] } | { status: "blocked"; result: NavigationResult };
type FuelOutcome = { status: "ok" } | { status: "blocked"; result: NavigationResult };

export async function goTo(destination: Destination, ctx: SkillContext): Promise<NavigationResult> {
  const plan = await planRoute(destination, ctx);
  if (plan.status === "blocked") return plan.result;

  for (const step of plan.steps) {
    if (step.fuelCost !== undefined) {
      const fuel = await ensureFuel(step.fuelCost * FUEL_SAFETY_MARGIN, ctx);
      if (fuel.status === "blocked") return fuel.result;
    }

    const result = await ctx.session.call("spacemolt", step.action, { id: step.targetId });
    const mapped = mapToNavigationResult(result);
    if (mapped.status !== "arrived") return mapped;
  }

  return { status: "arrived" };
}

async function planRoute(destination: Destination, ctx: SkillContext): Promise<PlanOutcome> {
  if (destination.kind === "poi") {
    return { status: "ok", steps: [{ action: "travel", targetId: destination.poiId }] };
  }

  const routeResult = await ctx.session.call("spacemolt", "find_route", { id: destination.systemId });
  if (!routeResult.ok) {
    return { status: "blocked", result: { status: "blocked", code: routeResult.code, message: routeResult.message } };
  }
  if (routeResult.kind !== "query") {
    return { status: "blocked", result: { status: "blocked", code: "unexpected_response", message: "find_route devolveu uma mutação, não uma query" } };
  }

  // find_route é query (sem tick, instantâneo) — devolve `route` (sistemas em ordem, do
  // atual até o destino), `fuel_per_jump`, e `target_poi` só quando o pedido foi por um
  // POI/base (não inclui o trecho intra-sistema final no fuel, docs_guides_fuel.md).
  const route = routeResult.result as {
    found?: boolean;
    route?: string[];
    fuel_per_jump?: number;
    target_poi?: string;
  };

  if (route.found === false) {
    return {
      status: "blocked",
      result: { status: "blocked", code: "no_route", message: "find_route não encontrou caminho até o destino" },
    };
  }

  const steps: RouteStep[] = (route.route ?? []).map((systemId) => ({
    action: "jump" as const,
    targetId: systemId,
    fuelCost: route.fuel_per_jump,
  }));

  const finalPoi = destination.poiId ?? route.target_poi;
  if (finalPoi) {
    steps.push({ action: "travel", targetId: finalPoi });
  }

  return { status: "ok", steps };
}

async function ensureFuel(requiredFuel: number, ctx: SkillContext): Promise<FuelOutcome> {
  const shipResult = await ctx.session.call("spacemolt", "get_ship", {});
  if (!shipResult.ok) {
    return { status: "blocked", result: { status: "blocked", code: shipResult.code, message: shipResult.message } };
  }
  if (shipResult.kind !== "query") {
    return { status: "blocked", result: { status: "blocked", code: "unexpected_response", message: "get_ship devolveu uma mutação, não uma query" } };
  }

  // Nome exato do campo não está 100% confirmado — find_route devolve `fuel_available`
  // pro tanque atual (docs_guides_fuel.md), get_ship pode usar o mesmo nome ou só `fuel`;
  // aceita os dois em vez de apostar num só (validação manual, task 7, confirma de verdade).
  const ship = shipResult.result as { fuel?: number; fuel_available?: number };
  const currentFuel = ship.fuel ?? ship.fuel_available ?? 0;
  if (currentFuel >= requiredFuel) return { status: "ok" };

  const refuelResult = await ctx.session.call("spacemolt", "refuel", {});
  if (!refuelResult.ok) {
    return { status: "blocked", result: { status: "blocked", code: refuelResult.code, message: refuelResult.message } };
  }
  return { status: "ok" };
}

function mapToNavigationResult(result: CommandResult): NavigationResult {
  if (result.ok) return { status: "arrived" };
  return {
    status: "blocked",
    code: result.code,
    message: result.message,
    ...(extractRetrySeconds(result.details) !== undefined
      ? { retryAfterSeconds: extractRetrySeconds(result.details) }
      : {}),
  };
}

// Nome exato do campo de "segundos restantes" num erro in_transit não está confirmado pela
// pesquisa (specs/0009-skill-navigation/plan.md, riscos assumidos) — tenta as variantes
// mais prováveis, devolve undefined se nenhuma bater (nunca lança).
function extractRetrySeconds(details: Record<string, unknown> | undefined): number | undefined {
  if (!details) return undefined;
  const raw = details.seconds_remaining ?? details.retry_after ?? details.eta_seconds;
  return typeof raw === "number" ? raw : undefined;
}

export interface ScoutInfo {
  policeLevel?: number;
  shipCount?: number;
  raw: unknown;
}

/**
 * Consulta o que existe num POI/sistema remoto sem mover a nave (constituição, regra 6:
 * `goTo` não decide isso por conta própria — quem chama decide se usa esta informação
 * antes de comprometer a viagem).
 */
export async function scoutDestination(destination: Destination, ctx: SkillContext): Promise<ScoutInfo> {
  const targetId = destination.kind === "poi" ? destination.poiId : destination.systemId;
  const result = await ctx.session.call("spacemolt", "scan", { id: targetId });
  if (!result.ok) return { raw: { ok: false, code: result.code, message: result.message } };
  if (result.kind !== "query") return { raw: result };

  const data = result.result as { police_level?: number; ship_count?: number };
  return { policeLevel: data.police_level, shipCount: data.ship_count, raw: data };
}
