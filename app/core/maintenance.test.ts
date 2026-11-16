import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../game_client.types.js";
import type { SkillContext } from "../loop/skill_interface.js";
import { checkAndRepair, checkInsurance } from "./maintenance.js";

type Handler = (payload: Record<string, unknown> | undefined) => CommandResult;

function fakeSession(handlers: Record<string, Handler>) {
  const calls: { tool: string; action: string }[] = [];
  const session = {
    accountName: "test",
    call: async (tool: string, action: string, payload?: Record<string, unknown>) => {
      calls.push({ tool, action });
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

function mutationOk(): CommandResult {
  return { ok: true, kind: "mutation", command: "x", tick: 1, delta: {} };
}

function err(code: string, message = "erro"): CommandResult {
  return { ok: false, code, message };
}

test("casco acima do limiar não repara", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:get_ship": () => queryOk({ hull: 90, max_hull: 100, docked: true }),
  });

  const result = await checkAndRepair(ctxFor(session));

  assert.deepEqual(result, { status: "not_needed" });
  assert.ok(!calls.some((c) => c.action === "repair"));
});

test("casco abaixo do limiar repara via crédito quando docada", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:get_ship": () => queryOk({ hull: 40, max_hull: 100, docked: true }),
    "spacemolt:repair": () => mutationOk(),
  });

  const result = await checkAndRepair(ctxFor(session));

  assert.deepEqual(result, { status: "repaired", method: "credits" });
  assert.ok(calls.some((c) => c.action === "repair"));
});

test("casco abaixo do limiar repara via repair kit quando no espaço", async () => {
  const { session } = fakeSession({
    "spacemolt:get_ship": () => queryOk({ hull: 40, max_hull: 100, docked: false }),
    "spacemolt:repair": () => mutationOk(),
  });

  const result = await checkAndRepair(ctxFor(session));

  assert.deepEqual(result, { status: "repaired", method: "repair_kit" });
});

test("limiar customizado via opção é respeitado (80% não repara no default, mas repara com limiar 90%)", async () => {
  const { session: defaultSession } = fakeSession({
    "spacemolt:get_ship": () => queryOk({ hull: 80, max_hull: 100, docked: true }),
  });
  assert.deepEqual(await checkAndRepair(ctxFor(defaultSession)), { status: "not_needed" });

  const { session: customSession } = fakeSession({
    "spacemolt:get_ship": () => queryOk({ hull: 80, max_hull: 100, docked: true }),
    "spacemolt:repair": () => mutationOk(),
  });
  assert.deepEqual(await checkAndRepair(ctxFor(customSession), { thresholdPercent: 90 }), {
    status: "repaired",
    method: "credits",
  });
});

test("sem crédito nem kit disponível devolve blocked, nunca lança", async () => {
  const { session } = fakeSession({
    "spacemolt:get_ship": () => queryOk({ hull: 10, max_hull: 100, docked: true }),
    "spacemolt:repair": () => err("insufficient_credits", "sem crédito suficiente"),
  });

  const result = await checkAndRepair(ctxFor(session));

  assert.deepEqual(result, { status: "blocked", code: "insufficient_credits", message: "sem crédito suficiente" });
});

test("checkInsurance confirma apólice válida sem comprar nada", async () => {
  const { session, calls } = fakeSession({
    "spacemolt_salvage:policies": () => queryOk({ policies: [{ valid: true }] }),
  });

  const result = await checkInsurance(ctxFor(session));

  assert.deepEqual(result, { status: "valid" });
  assert.ok(!calls.some((c) => c.action === "insure"));
});

test("checkInsurance sem apólice válida e autobuy desligado (default) não compra", async () => {
  const { session, calls } = fakeSession({
    "spacemolt_salvage:policies": () => queryOk({ policies: [] }),
  });

  const result = await checkInsurance(ctxFor(session));

  assert.deepEqual(result, { status: "blocked", code: "no_insurance", message: "sem apólice válida e autobuy desligado" });
  assert.ok(!calls.some((c) => c.action === "insure"));
});

test("checkInsurance com autobuy=true compra quando não há apólice válida", async () => {
  const { session, calls } = fakeSession({
    "spacemolt_salvage:policies": () => queryOk({ policies: [] }),
    "spacemolt_salvage:insure": () => mutationOk(),
  });

  const result = await checkInsurance(ctxFor(session), { autobuy: true });

  assert.deepEqual(result, { status: "purchased" });
  assert.ok(calls.some((c) => c.action === "insure"));
});
