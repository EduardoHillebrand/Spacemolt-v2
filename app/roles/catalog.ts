// Papéis conhecidos e o que cada um ativa (spec 0002-accounts-and-roles). Papéis são
// código, não JSON solto, porque os nomes de skill são validados pelo compilador.
export type Role = "miner" | "trader" | "artisan";

// Nomes das skills previstas no backlog (0007-skill-mining .. 0011-skill-crafting).
// Nenhuma existe como código ainda — "artisan" fica com lista vazia até a de crafting
// existir.
export type SkillName = "mining" | "trading" | "navigation" | "maintenance" | "crafting";

export interface RoleDefinition {
  skills: SkillName[];
  objective: string;
}

export const CATALOG: Record<Role, RoleDefinition> = {
  miner: {
    skills: ["mining", "navigation", "maintenance"],
    objective:
      "Mine ore/gas/ice efficiently, keep the ship fueled and maintained, and grow toward " +
      "a multi-ship fleet specialized by resource type as skills and credits allow.",
  },
  trader: {
    skills: ["trading", "navigation"],
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
