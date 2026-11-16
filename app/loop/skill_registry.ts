// Traduz nomes de skill da role ativa (spec 0002) pros objetos Skill de verdade (spec
// 0006). Mapa fixo, cresce conforme as specs 0007+ forem implementadas.
import { miningSkill } from "../skills/mining/index.js";
import { tradingSkill } from "../skills/trading/index.js";
import type { SkillName } from "../roles/catalog.js";
import type { Skill } from "./skill_interface.js";

const REGISTRY: Partial<Record<SkillName, Skill>> = {
  mining: miningSkill,
  trading: tradingSkill,
  // crafting (0011) -- adicionada pela spec seguinte.
};

export function resolve(skillNames: SkillName[]): Skill[] {
  return skillNames
    .map((name) => REGISTRY[name])
    .filter((skill): skill is Skill => skill !== undefined);
}

/** Só pra teste — registra uma skill fake sem precisar editar o REGISTRY de produção. */
export function registerForTest(skill: Skill): void {
  REGISTRY[skill.name] = skill;
}

export function unregisterForTest(name: SkillName): void {
  delete REGISTRY[name];
}
