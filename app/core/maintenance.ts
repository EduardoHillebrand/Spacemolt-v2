// Spec 0010-skill-maintenance: módulo compartilhado de casco/seguro (constituição, regra
// 5) — não é skill registrada no loop, ver nota de arquitetura em
// specs/0010-skill-maintenance/spec.md. Chamado de dentro de mining/trading/crafting na
// mesma parada em que a nave já vai vender carga ou reabastecer.
import type { InsuranceResult, RepairResult } from "../game_client.types.js";
import type { SkillContext } from "../loop/skill_interface.js";

// Limiar de reparo é heurística própria, não documentada pelo jogo (specs/
// 0010-skill-maintenance/plan.md, riscos assumidos) — ajustável sem precisar de spec nova.
const DEFAULT_REPAIR_THRESHOLD_PERCENT = 70;

export interface CheckAndRepairOptions {
  thresholdPercent?: number;
}

export async function checkAndRepair(ctx: SkillContext, options: CheckAndRepairOptions = {}): Promise<RepairResult> {
  const shipResult = await ctx.session.call("spacemolt", "get_ship", {});
  if (!shipResult.ok) {
    return { status: "blocked", code: shipResult.code, message: shipResult.message };
  }
  if (shipResult.kind !== "query") {
    return { status: "blocked", code: "unexpected_response", message: "get_ship devolveu uma mutação, não uma query" };
  }

  const ship = shipResult.result as { hull?: number; max_hull?: number; docked?: boolean };
  const threshold = options.thresholdPercent ?? DEFAULT_REPAIR_THRESHOLD_PERCENT;
  if (!needsRepair(ship, threshold)) {
    return { status: "not_needed" };
  }

  const method: "credits" | "repair_kit" = ship.docked ? "credits" : "repair_kit";
  const repairResult = await ctx.session.call("spacemolt", "repair", {});
  if (!repairResult.ok) {
    return { status: "blocked", code: repairResult.code, message: repairResult.message };
  }
  return { status: "repaired", method };
}

function needsRepair(ship: { hull?: number; max_hull?: number }, thresholdPercent: number): boolean {
  if (ship.hull === undefined || ship.max_hull === undefined || ship.max_hull === 0) return false;
  return (ship.hull / ship.max_hull) * 100 < thresholdPercent;
}

export interface CheckInsuranceOptions {
  autobuy?: boolean;
}

// Nomes de ação confirmados no SKILL_MANUAL.md (tool spacemolt_salvage): `policies()` lista
// apólices ativas, `insure()` compra uma nova — não `view_insurance`/`buy_insurance` como o
// plan.md original (escrito antes de checar o manual linha a linha) supôs. Corrigido aqui
// na implementação; manual validation (task 9) confirma contra uma apólice real.
export async function checkInsurance(ctx: SkillContext, options: CheckInsuranceOptions = {}): Promise<InsuranceResult> {
  const policiesResult = await ctx.session.call("spacemolt_salvage", "policies", {});
  if (!policiesResult.ok) {
    return { status: "blocked", code: policiesResult.code, message: policiesResult.message };
  }
  if (policiesResult.kind !== "query") {
    return { status: "blocked", code: "unexpected_response", message: "policies devolveu uma mutação, não uma query" };
  }

  const policies = policiesResult.result as { policies?: { valid?: boolean }[] } | { valid?: boolean }[];
  if (hasValidPolicy(policies)) return { status: "valid" };

  if (!options.autobuy) {
    return { status: "blocked", code: "no_insurance", message: "sem apólice válida e autobuy desligado" };
  }

  const insureResult = await ctx.session.call("spacemolt_salvage", "insure", {});
  if (!insureResult.ok) {
    return { status: "blocked", code: insureResult.code, message: insureResult.message };
  }
  return { status: "purchased" };
}

function hasValidPolicy(policies: { policies?: { valid?: boolean }[] } | { valid?: boolean }[]): boolean {
  const list = Array.isArray(policies) ? policies : policies.policies ?? [];
  return list.some((p) => p.valid === true);
}
