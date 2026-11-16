// Executor da skill de mineração (spec 0007): só roda a atividade decidida pelo planner,
// mecanicamente, chamando o jogo de verdade (constituição, regra 2) — nunca decide trocar
// de atividade por conta própria; invalida e devolve controle ao planner quando o jogo
// reporta algo que a atividade atual não resolve sozinha.
import { sellAllCargo } from "../../core/cargo.js";
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

function toExecutorResult(nav: NavigationResult): ExecutorResult {
  if (nav.status === "arrived") return { status: "done" };
  return { status: "invalidated", reason: `${nav.code}: ${nav.message}` };
}
