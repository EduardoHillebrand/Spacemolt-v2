// Skill de crafting (spec 0011) — ponto de entrada registrado no skill_registry (spec
// 0006). Planner e Executor isolados em arquivos próprios (constituição, regra 5).
import type { Skill } from "../../loop/skill_interface.js";
import { executeCraftingStep } from "./executor.js";
import { planCrafting } from "./planner.js";

export const craftingSkill: Skill = {
  name: "crafting",
  planner: planCrafting,
  executor: executeCraftingStep,
};
