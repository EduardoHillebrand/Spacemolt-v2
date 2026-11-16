// Papéis conhecidos e o que cada um ativa (spec 0002-accounts-and-roles). Papéis são
// código, não JSON solto, porque os nomes de skill são validados pelo compilador.
export type Role = "miner" | "trader" | "artisan";

// Nomes das skills registráveis no skill_registry (spec 0006). "navigation" e
// "maintenance" (specs 0009/0010) deixaram de ser entradas aqui — a pesquisa feita antes de
// escrevê-las mostrou que são módulos compartilhados em app/core/, chamados de dentro de
// mining/trading/crafting, não skills que competem no loop (ver
// specs/0002-accounts-and-roles/tasks.md, "Revisão pendente", e specs/0007-skill-mining/
// plan.md). "artisan" fica com lista vazia até 0011-skill-crafting existir como código.
export type SkillName = "mining" | "trading" | "crafting";

export interface RoleDefinition {
  skills: SkillName[];
  objective: string;
}

export const CATALOG: Record<Role, RoleDefinition> = {
  miner: {
    skills: ["mining"],
    objective:
      "Mine ore/gas/ice efficiently, keep the ship fueled and maintained, and grow toward " +
      "a multi-ship fleet specialized by resource type as skills and credits allow.",
  },
  trader: {
    skills: ["trading"],
    objective:
      "Find profitable buy/sell spreads across stations and haul goods between them, " +
      "growing capital and trade routes over time.",
  },
  artisan: {
    skills: [],
    objective: "Craft goods from raw materials supplied by the fleet's miner, once a crafting skill exists.",
  },
};

export function isValidRole(value: string): value is Role {
  return value in CATALOG;
}
