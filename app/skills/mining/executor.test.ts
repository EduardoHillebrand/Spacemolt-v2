import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { Plan, SkillContext } from "../../loop/skill_interface.js";
import { executeMiningStep } from "./executor.js";
import type { MiningActivity } from "./activity.js";

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

function planFor(activity: MiningActivity): Plan {
  return { steps: [activity], invalidate_when: [] };
}

function mutationOk(): CommandResult {
  return { ok: true, kind: "mutation", command: "x", tick: 1, delta: {} };
}

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

function err(code: string, message = "erro"): CommandResult {
  return { ok: false, code, message };
}

test("mine: sucesso com cargo ainda não cheio devolve running", async () => {
  const { session } = fakeSession({
    "spacemolt:mine": () => mutationOk(),
    "spacemolt:get_ship": () => queryOk({ cargo_used: 10, cargo_capacity: 100 }),
  });
  const result = await executeMiningStep(planFor({ kind: "mine" }), ctxFor(session));
  assert.deepEqual(result, { status: "running" });
});

test("mine: sucesso que deixa o cargo cheio devolve done (replaneja no próximo ciclo)", async () => {
  const { session } = fakeSession({
    "spacemolt:mine": () => mutationOk(),
    "spacemolt:get_ship": () => queryOk({ cargo_used: 100, cargo_capacity: 100 }),
  });
  const result = await executeMiningStep(planFor({ kind: "mine" }), ctxFor(session));
  assert.deepEqual(result, { status: "done" });
});

test("mine: deposit_too_sparse invalida o plano", async () => {
  const { session } = fakeSession({ "spacemolt:mine": () => err("deposit_too_sparse", "raleou") });
  const result = await executeMiningStep(planFor({ kind: "mine" }), ctxFor(session));
  assert.deepEqual(result, { status: "invalidated", reason: "deposit_too_sparse" });
});

test("mine: action_pending/in_transit continuam running, nunca erro", async () => {
  const { session } = fakeSession({ "spacemolt:mine": () => err("action_pending", "aguarde") });
  const result = await executeMiningStep(planFor({ kind: "mine" }), ctxFor(session));
  assert.deepEqual(result, { status: "running" });
});

test("mine: erro não reconhecido vira error estruturado, nunca lança", async () => {
  const { session } = fakeSession({ "spacemolt:mine": () => err("laser_overheated", "esquenta demais") });
  const result = await executeMiningStep(planFor({ kind: "mine" }), ctxFor(session));
  assert.deepEqual(result, { status: "error", code: "laser_overheated", message: "esquenta demais" });
});

test("travelToPoi: chegada com sucesso devolve done", async () => {
  const { session } = fakeSession({ "spacemolt:travel": () => mutationOk() });
  const result = await executeMiningStep(planFor({ kind: "travelToPoi", poiId: "belt_1" }), ctxFor(session));
  assert.deepEqual(result, { status: "done" });
});

test("travelToPoi: bloqueio no jogo invalida o plano com o código real", async () => {
  const { session } = fakeSession({ "spacemolt:travel": () => err("no_fuel", "sem combustível") });
  const result = await executeMiningStep(planFor({ kind: "travelToPoi", poiId: "belt_1" }), ctxFor(session));
  assert.deepEqual(result, { status: "invalidated", reason: "no_fuel: sem combustível" });
});

test("stationStop: vende toda a carga, repara/confere seguro, e undoca", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:get_cargo": () => queryOk({ items: [{ id: "iron_ore", quantity: 40 }] }),
    "spacemolt:sell": () => mutationOk(),
    "spacemolt:get_ship": () => queryOk({ hull: 100, max_hull: 100, docked: true }),
    "spacemolt_salvage:policies": () => queryOk({ policies: [{ valid: true }] }),
    "spacemolt:undock": () => mutationOk(),
  });

  const result = await executeMiningStep(planFor({ kind: "stationStop" }), ctxFor(session));

  assert.deepEqual(result, { status: "done" });
  assert.ok(calls.some((c) => c.action === "sell"));
  assert.ok(calls.some((c) => c.action === "undock"));
});

test("stationStop: falha ao ler cargo vira erro, nunca tenta undocar sem vender", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:get_cargo": () => err("connection_closed"),
  });

  const result = await executeMiningStep(planFor({ kind: "stationStop" }), ctxFor(session));

  assert.deepEqual(result, { status: "error", code: "connection_closed", message: "erro" });
  assert.ok(!calls.some((c) => c.action === "undock"));
});

test("stationStop: undock falhando vira erro, mesmo depois de vender/reparar com sucesso", async () => {
  const { session } = fakeSession({
    "spacemolt:get_cargo": () => queryOk({ items: [] }),
    "spacemolt:get_ship": () => queryOk({ hull: 100, max_hull: 100, docked: true }),
    "spacemolt_salvage:policies": () => queryOk({ policies: [{ valid: true }] }),
    "spacemolt:undock": () => err("station_under_attack"),
  });

  const result = await executeMiningStep(planFor({ kind: "stationStop" }), ctxFor(session));

  assert.deepEqual(result, { status: "error", code: "station_under_attack", message: "erro" });
});

test("wait: devolve done pra reavaliar do zero no próximo ciclo", async () => {
  const { session } = fakeSession({});
  const result = await executeMiningStep(planFor({ kind: "wait", reason: "no_minable_poi_found" }), ctxFor(session));
  assert.deepEqual(result, { status: "done" });
});

test("fail: vira error estruturado com o código/mensagem do planner", async () => {
  const { session } = fakeSession({});
  const result = await executeMiningStep(
    planFor({ kind: "fail", code: "get_ship_failed", message: "x" }),
    ctxFor(session)
  );
  assert.deepEqual(result, { status: "error", code: "get_ship_failed", message: "x" });
});
