// Executor da skill de mineração (spec 0007): só roda a atividade decidida pelo planner,
// mecanicamente, chamando o jogo de verdade (constituição, regra 2) — nunca decide trocar
// de atividade por conta própria; invalida e devolve controle ao planner quando o jogo
// reporta algo que a atividade atual não resolve sozinha.
import { checkAndRepair, checkInsurance } from "../../core/maintenance.js";
import { goTo } from "../../core/navigation.js";
import type { CommandResult, NavigationResult } from "../../game_client.types.js";
import type { ExecutorResult, Plan, SkillContext } from "../../loop/skill_interface.js";
import type { MiningActivity } from "./activity.js";
import { isCargoFull, readShip } from "./state.js";

export async function executeMiningStep(plan: Plan, ctx: SkillContext): Promise<ExecutorResult> {
  const activity = plan.steps[0] as MiningActivity;

  switch (activity.kind) {
    case "mine":
      return runMine(ctx);
    case "travelToPoi":
      return toExecutorResult(await goTo({ kind: "poi", poiId: activity.poiId }, ctx));
    case "stationStop":
      return runStationStop(ctx);
    case "wait":
      // Estado válido (constituição, regra 6), não erro — reporta "done" pra deixar o
      // próximo ciclo reavaliar do zero (ex.: um novo POI minerável pode ter sido descoberto
      // ou charted nesse meio tempo), em vez de ficar preso na mesma atividade pra sempre.
      return { status: "done" };
    case "fail":
      return { status: "error", code: activity.code, message: activity.message };
  }
}

async function runMine(ctx: SkillContext): Promise<ExecutorResult> {
  const result = await ctx.session.call("spacemolt", "mine", {});
  if (!result.ok) return mapMineError(result);

  const ship = await readShip(ctx);
  if (ship !== null && isCargoFull(ship)) {
    // Cargo ficou cheio durante esta mesma corrida — não insiste minerando mais,
    // devolve "done" pra deixar o planner decidir a volta à estação no próximo ciclo.
    return { status: "done" };
  }
  return { status: "running" };
}

function mapMineError(result: Extract<CommandResult, { ok: false }>): ExecutorResult {
  if (result.code === "deposit_too_sparse") {
    return { status: "invalidated", reason: "deposit_too_sparse" };
  }
  if (result.code === "action_pending" || result.code === "in_transit") {
    return { status: "running" };
  }
  return { status: "error", code: result.code, message: result.message };
}

async function runStationStop(ctx: SkillContext): Promise<ExecutorResult> {
  const sellResult = await sellAllCargo(ctx);
  if (!sellResult.ok) return { status: "error", code: sellResult.code, message: sellResult.message };

  await checkAndRepair(ctx);
  await checkInsurance(ctx); // autobuy desligado por padrão (0010) — só confere, não gasta crédito sozinho

  const undockResult = await ctx.session.call("spacemolt", "undock", {});
  if (!undockResult.ok) return { status: "error", code: undockResult.code, message: undockResult.message };

  return { status: "done" };
}

type SellOutcome = { ok: true } | { ok: false; code: string; message: string };

async function sellAllCargo(ctx: SkillContext): Promise<SellOutcome> {
  const cargoResult = await ctx.session.call("spacemolt", "get_cargo", {});
  if (!cargoResult.ok) return { ok: false, code: cargoResult.code, message: cargoResult.message };
  if (cargoResult.kind !== "query") {
    return { ok: false, code: "unexpected_response", message: "get_cargo devolveu uma mutação, não uma query" };
  }

  // Nome exato do campo não confirmado (ver specs/0007-skill-mining/tasks.md) — melhor
  // esforço a partir do padrão já visto noutras respostas (`items: [{id, quantity}]`).
  const cargo = cargoResult.result as { items?: Array<{ id: string; quantity: number }> };
  for (const item of cargo.items ?? []) {
    const sellResult = await ctx.session.call("spacemolt", "sell", { id: item.id, quantity: item.quantity });
    if (!sellResult.ok) return { ok: false, code: sellResult.code, message: sellResult.message };
  }
  return { ok: true };
}

function toExecutorResult(nav: NavigationResult): ExecutorResult {
  if (nav.status === "arrived") return { status: "done" };
  return { status: "invalidated", reason: `${nav.code}: ${nav.message}` };
}
