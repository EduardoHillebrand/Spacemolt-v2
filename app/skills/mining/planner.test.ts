import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { SkillContext } from "../../loop/skill_interface.js";
import { planMining } from "./planner.js";
import type { MiningActivity } from "./activity.js";

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

function ctxFor(session: GameSession, preferences: Record<string, unknown> = {}): SkillContext {
  return { session, directive: { preferences, note: "" } } as SkillContext;
}

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

function err(code: string, message = "erro"): CommandResult {
  return { ok: false, code, message };
}

function activityOf(plan: { steps: unknown[] }): MiningActivity {
  return plan.steps[0] as MiningActivity;
}

test("get_ship falhando devolve atividade fail, nunca lança", async () => {
  const session = fakeSession({ "spacemolt:get_ship": () => err("connection_closed") });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "fail", code: "get_ship_failed", message: "não foi possível ler o estado da nave" });
});

test("nave docada sempre vira stationStop, cargo cheio ou não", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: true, cargo_used: 0, cargo_capacity: 100 }),
  });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "stationStop" });
});

test("cargo cheio e não docada: viaja pra estação encontrada em get_system", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 100, cargo_capacity: 100 }),
    "spacemolt:get_system": () => queryOk({ pois: [{ id: "belt_1" }, { id: "station_1", has_base: true }] }),
  });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "travelToPoi", poiId: "station_1" });
});

test("cargo cheio, não docada, nenhuma estação encontrada: espera", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 100, cargo_capacity: 100 }),
    "spacemolt:get_system": () => queryOk({ pois: [{ id: "belt_1" }] }),
  });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "wait", reason: "no_station_found" });
});

test("cargo não cheio e POI atual tem node trabalhável: minera", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 10, cargo_capacity: 100 }),
    "spacemolt:get_poi": () => queryOk({ resources: [{ too_sparse: false, remaining: 500 }] }),
  });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "mine" });
});

test("cargo não cheio, POI atual sem node trabalhável: viaja pro próximo POI minerável", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 10, cargo_capacity: 100 }),
    "spacemolt:get_poi": () => queryOk({ resources: [{ too_sparse: true }] }),
    "spacemolt:get_system": () => queryOk({ pois: [{ id: "belt_2", minable: true }] }),
  });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "travelToPoi", poiId: "belt_2" });
});

test("cargo não cheio, nenhum POI minerável em lugar nenhum: espera", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 10, cargo_capacity: 100 }),
    "spacemolt:get_poi": () => queryOk({ resources: [] }),
    "spacemolt:get_system": () => queryOk({ pois: [{ id: "belt_2" }] }),
  });
  const plan = await planMining(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "wait", reason: "no_minable_poi_found" });
});

test("diretriz 0012 com preferredResource: prefere o POI minerável compatível entre vários candidatos", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 10, cargo_capacity: 100 }),
    "spacemolt:get_poi": () => queryOk({ resources: [{ too_sparse: true }] }),
    "spacemolt:get_system": () =>
      queryOk({
        pois: [
          { id: "belt_ice", minable: true, resource_type: "ice" },
          { id: "belt_iron", minable: true, resource_type: "iron" },
        ],
      }),
  });
  const plan = await planMining(ctxFor(session, { preferredResource: "iron" }));
  assert.deepEqual(activityOf(plan), { kind: "travelToPoi", poiId: "belt_iron" });
});

test("diretriz 0012 com preferredResource sem nenhum POI compatível: cai pro primeiro minerável, nunca espera por isso", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false, cargo_used: 10, cargo_capacity: 100 }),
    "spacemolt:get_poi": () => queryOk({ resources: [{ too_sparse: true }] }),
    "spacemolt:get_system": () => queryOk({ pois: [{ id: "belt_ice", minable: true, resource_type: "ice" }] }),
  });
  const plan = await planMining(ctxFor(session, { preferredResource: "iron" }));
  assert.deepEqual(activityOf(plan), { kind: "travelToPoi", poiId: "belt_ice" });
});
