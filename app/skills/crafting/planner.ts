// Planner da skill de crafting (spec 0011): só olha o estado e devolve UMA atividade por
// ciclo (constituição, regra 2). Nunca reemite `craft` quando já há job na fila (regra 3
// da spec: reemitir duplica o job, erro documentado explicitamente) — e usa `dry_run`
// (requisito 4 da spec) pra só enfileirar de verdade uma receita afordável.
import type { Plan, SkillContext } from "../../loop/skill_interface.js";
import type { CraftingActivity } from "./activity.js";
import { hasJobRunning, readQueue } from "./queue.js";
import { KNOWN_RECIPE_IDS } from "./recipes.js";

export async function planCrafting(ctx: SkillContext): Promise<Plan> {
  const queue = await readQueue(ctx);
  if (queue !== null && hasJobRunning(queue)) {
    return planFor({ kind: "waitForJob" });
  }

  for (const recipeId of KNOWN_RECIPE_IDS) {
    const affordable = await isRecipeAffordable(ctx, recipeId);
    if (affordable) {
      return planFor({ kind: "enqueue", recipeId });
    }
  }

  return planFor({ kind: "wait", reason: "no_affordable_recipe" });
}

async function isRecipeAffordable(ctx: SkillContext, recipeId: string): Promise<boolean> {
  const result = await ctx.session.call("spacemolt", "craft", { id: recipeId, quantity: 1, dry_run: true });
  if (!result.ok || result.kind !== "query") return false;
  const quote = result.result as { affordable?: boolean };
  return quote.affordable === true;
}

function planFor(activity: CraftingActivity): Plan {
  return { steps: [activity], invalidate_when: [] };
}
