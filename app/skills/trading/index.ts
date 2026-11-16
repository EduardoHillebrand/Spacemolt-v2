// Skill de trading (spec 0008) — ponto de entrada registrado no skill_registry (spec
// 0006). Planner e Executor isolados em arquivos próprios (constituição, regra 5).
import type { Skill } from "../../loop/skill_interface.js";
import { executeTradingStep } from "./executor.js";
import { planTrading } from "./planner.js";

export const tradingSkill: Skill = {
  name: "trading",
  planner: planTrading,
  executor: executeTradingStep,
};
