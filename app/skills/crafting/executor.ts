// Executor da skill de crafting (spec 0011): só executa a atividade decidida pelo planner,
// mecanicamente (constituição, regra 2). Nunca chama `craft` com `id` pra "ver se já
// terminou" — `waitForJob` só consulta a fila (leitura), nunca reenfileira.
import type { CommandResult } from "../../game_client.types.js";
import type { ExecutorResult, Plan, SkillContext } from "../../loop/skill_interface.js";
import type { CraftingActivity } from "./activity.js";
import { hasJobRunning, readQueue } from "./queue.js";

export async function executeCraftingStep(plan: Plan, ctx: SkillContext): Promise<ExecutorResult> {
  const activity = plan.steps[0] as CraftingActivity;

  switch (activity.kind) {
    case "waitForJob":
      return pollJob(ctx);
    case "enqueue":
      return runEnqueue(activity.recipeId, ctx);
    case "wait":
      // Estado válido (constituição, regra 6): nenhuma receita afordável agora — reavalia
      // do zero no próximo ciclo (material pode ter chegado nesse meio tempo).
      return { status: "done" };
    case "fail":
      return { status: "error", code: activity.code, message: activity.message };
  }
}

async function pollJob(ctx: SkillContext): Promise<ExecutorResult> {
  const queue = await readQueue(ctx);
  if (queue === null) {
    return { status: "error", code: "queue_check_failed", message: "não foi possível ler a fila de crafting" };
  }
  return hasJobRunning(queue) ? { status: "running" } : { status: "done" };
}

async function runEnqueue(recipeId: string, ctx: SkillContext): Promise<ExecutorResult> {
  const result = await ctx.session.call("spacemolt", "craft", { id: recipeId, quantity: 1 });
  if (!result.ok) return mapCraftError(result);
  return { status: "done" };
}

function mapCraftError(result: Extract<CommandResult, { ok: false }>): ExecutorResult {
  return { status: "error", code: result.code, message: result.message };
}
