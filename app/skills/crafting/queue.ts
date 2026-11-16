// Leitura da fila de crafting (spec 0011) — usada pelo planner e pelo executor. Chamar
// `craft` sem `id` pra listar a fila é melhor esforço a partir da pesquisa da spec (não
// confirmado contra o jogo real ainda, ver specs/0011-skill-crafting/tasks.md); se o nome
// real for diferente, cai aqui num `null` tratado como "sem job" — pode gerar uma tentativa
// de reenfileirar (nunca pior que o estado atual, não um double-spend silencioso, já que o
// erro real do jogo pra double-spend ainda apareceria na chamada de `enqueue`).
import type { SkillContext } from "../../loop/skill_interface.js";

export interface CraftingJob {
  completed?: boolean;
}

export interface CraftingQueue {
  jobs?: CraftingJob[];
}

export async function readQueue(ctx: SkillContext): Promise<CraftingQueue | null> {
  const result = await ctx.session.call("spacemolt", "craft", {});
  if (!result.ok || result.kind !== "query") return null;
  return result.result as CraftingQueue;
}

export function hasJobRunning(queue: CraftingQueue): boolean {
  return (queue.jobs ?? []).some((job) => job.completed !== true);
}
