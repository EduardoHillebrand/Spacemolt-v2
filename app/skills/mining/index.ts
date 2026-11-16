// Skill de mineração (spec 0007) — ponto de entrada registrado no skill_registry (spec
// 0006). Planner e Executor isolados em arquivos próprios (constituição, regra 5).
import type { Skill } from "../../loop/skill_interface.js";
import { executeMiningStep } from "./executor.js";
import { planMining } from "./planner.js";

export const miningSkill: Skill = {
  name: "mining",
  planner: planMining,
  executor: executeMiningStep,
};
