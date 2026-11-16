// Leitura/venda de cargo compartilhada entre skills (constituição, regra 5) — mining
// (0007) e trading (0008) ambas precisam vender tudo que está a bordo numa parada.
import type { SkillContext } from "../loop/skill_interface.js";

export type SellOutcome = { ok: true } | { ok: false; code: string; message: string };

export async function sellAllCargo(ctx: SkillContext): Promise<SellOutcome> {
  const cargoResult = await ctx.session.call("spacemolt", "get_cargo", {});
  if (!cargoResult.ok) return { ok: false, code: cargoResult.code, message: cargoResult.message };
  if (cargoResult.kind !== "query") {
    return { ok: false, code: "unexpected_response", message: "get_cargo devolveu uma mutação, não uma query" };
  }

  // Nome exato do campo não confirmado — melhor esforço a partir do padrão já visto
  // noutras respostas (`items: [{id, quantity}]`); validação manual confirma de verdade.
  const cargo = cargoResult.result as { items?: Array<{ id: string; quantity: number }> };
  for (const item of cargo.items ?? []) {
    const sellResult = await ctx.session.call("spacemolt", "sell", { id: item.id, quantity: item.quantity });
    if (!sellResult.ok) return { ok: false, code: sellResult.code, message: sellResult.message };
  }
  return { ok: true };
}
