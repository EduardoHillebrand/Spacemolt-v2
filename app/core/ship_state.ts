// Leitura de estado de nave compartilhada entre skills (constituição, regra 5: mining 0007
// e trading 0008 precisavam exatamente da mesma checagem de cargo/casco/docagem).
import type { SkillContext } from "../loop/skill_interface.js";

export interface ShipSnapshot {
  docked?: boolean;
  cargo_used?: number;
  cargo_capacity?: number;
}

export async function readShip(ctx: SkillContext): Promise<ShipSnapshot | null> {
  const result = await ctx.session.call("spacemolt", "get_ship", {});
  if (!result.ok || result.kind !== "query") return null;
  return result.result as ShipSnapshot;
}

export function isCargoFull(ship: ShipSnapshot): boolean {
  if (ship.cargo_used === undefined || ship.cargo_capacity === undefined) return false;
  return ship.cargo_used >= ship.cargo_capacity;
}
