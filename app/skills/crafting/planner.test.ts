import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { SkillContext } from "../../loop/skill_interface.js";
import { planCrafting } from "./planner.js";
import type { CraftingActivity } from "./activity.js";

type Handler = (payload: Record<string, unknown> | undefined) => CommandResult;

function fakeSession(handlers: Record<string, Handler>) {
  const calls: { payload?: Record<string, unknown> }[] = [];
  const session = {
    accountName: "test",
    call: async (tool: string, action: string, payload?: Record<string, unknown>) => {
      calls.push({ payload });
      const handler = handlers[`${tool}:${action}`];
      if (!handler) throw new Error(`sem handler fake pra ${tool}:${action}`);
      return handler(payload);
    },
  } as unknown as GameSession;
  return { session, calls };
}

function ctxFor(session: GameSession): SkillContext {
  return { session } as SkillContext;
}

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

function activityOf(plan: { steps: unknown[] }): CraftingActivity {
  return plan.steps[0] as CraftingActivity;
}

test("job já na fila: devolve waitForJob, nunca tenta enfileirar outro (evita double-spend)", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:craft": () => queryOk({ jobs: [{ completed: false }] }),
  });

  const plan = await planCrafting(ctxFor(session));

  assert.deepEqual(activityOf(plan), { kind: "waitForJob" });
  assert.equal(calls.length, 1, "nunca deveria ter chamado craft de novo pra checar dry_run com job já rodando");
});

test("sem job na fila e receita conhecida afordável: enfileira", async () => {
  const { session } = fakeSession({
    "spacemolt:craft": (payload) => {
      if (payload?.dry_run === true) return queryOk({ affordable: true });
      return queryOk({ jobs: [] });
    },
  });

  const plan = await planCrafting(ctxFor(session));

  assert.deepEqual(activityOf(plan), { kind: "enqueue", recipeId: "refine_steel" });
});

test("sem job na fila e nenhuma receita afordável: espera", async () => {
  const { session } = fakeSession({
    "spacemolt:craft": (payload) => {
      if (payload?.dry_run === true) return queryOk({ affordable: false });
      return queryOk({ jobs: [] });
    },
  });

  const plan = await planCrafting(ctxFor(session));

  assert.deepEqual(activityOf(plan), { kind: "wait", reason: "no_affordable_recipe" });
});
