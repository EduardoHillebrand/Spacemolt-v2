import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { Plan, SkillContext } from "../../loop/skill_interface.js";
import { executeCraftingStep } from "./executor.js";
import type { CraftingActivity } from "./activity.js";

type Handler = (payload: Record<string, unknown> | undefined) => CommandResult;

function fakeSession(handlers: Record<string, Handler>) {
  const session = {
    accountName: "test",
    call: async (tool: string, action: string, payload?: Record<string, unknown>) => {
      const handler = handlers[`${tool}:${action}`];
      if (!handler) throw new Error(`sem handler fake pra ${tool}:${action}`);
      return handler(payload);
    },
  } as unknown as GameSession;
  return session;
}

function ctxFor(session: GameSession): SkillContext {
  return { session } as SkillContext;
}

function planFor(activity: CraftingActivity): Plan {
  return { steps: [activity], invalidate_when: [] };
}

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

function mutationOk(): CommandResult {
  return { ok: true, kind: "mutation", command: "x", tick: 1, delta: {} };
}

function err(code: string, message = "erro"): CommandResult {
  return { ok: false, code, message };
}

test("waitForJob: job ainda em andamento devolve running", async () => {
  const session = fakeSession({ "spacemolt:craft": () => queryOk({ jobs: [{ completed: false }] }) });
  const result = await executeCraftingStep(planFor({ kind: "waitForJob" }), ctxFor(session));
  assert.deepEqual(result, { status: "running" });
});

test("waitForJob: job completado devolve done", async () => {
  const session = fakeSession({ "spacemolt:craft": () => queryOk({ jobs: [{ completed: true }] }) });
  const result = await executeCraftingStep(planFor({ kind: "waitForJob" }), ctxFor(session));
  assert.deepEqual(result, { status: "done" });
});

test("waitForJob: falha ao ler a fila vira erro estruturado, nunca lança", async () => {
  const session = fakeSession({ "spacemolt:craft": () => err("connection_closed") });
  const result = await executeCraftingStep(planFor({ kind: "waitForJob" }), ctxFor(session));
  assert.deepEqual(result, { status: "error", code: "queue_check_failed", message: "não foi possível ler a fila de crafting" });
});

test("enqueue: sucesso devolve done", async () => {
  const session = fakeSession({ "spacemolt:craft": () => mutationOk() });
  const result = await executeCraftingStep(planFor({ kind: "enqueue", recipeId: "refine_steel" }), ctxFor(session));
  assert.deepEqual(result, { status: "done" });
});

test("enqueue: storage insuficiente vira erro estruturado com o código real, nunca lança", async () => {
  const session = fakeSession({ "spacemolt:craft": () => err("insufficient_materials", "sem minério suficiente") });
  const result = await executeCraftingStep(planFor({ kind: "enqueue", recipeId: "refine_steel" }), ctxFor(session));
  assert.deepEqual(result, { status: "error", code: "insufficient_materials", message: "sem minério suficiente" });
});

test("wait: devolve done pra reavaliar do zero no próximo ciclo", async () => {
  const session = fakeSession({});
  const result = await executeCraftingStep(planFor({ kind: "wait", reason: "no_affordable_recipe" }), ctxFor(session));
  assert.deepEqual(result, { status: "done" });
});

test("fail: vira error estruturado com o código/mensagem do planner", async () => {
  const session = fakeSession({});
  const result = await executeCraftingStep(planFor({ kind: "fail", code: "x", message: "y" }), ctxFor(session));
  assert.deepEqual(result, { status: "error", code: "x", message: "y" });
});
