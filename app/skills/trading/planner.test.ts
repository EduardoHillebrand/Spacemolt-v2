import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { SkillContext } from "../../loop/skill_interface.js";
import { planTrading } from "./planner.js";
import type { TradingActivity } from "./activity.js";

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

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

function err(code: string, message = "erro"): CommandResult {
  return { ok: false, code, message };
}

function activityOf(plan: { steps: unknown[] }): TradingActivity {
  return plan.steps[0] as TradingActivity;
}

test("get_ship falhando devolve atividade fail, nunca lança", async () => {
  const session = fakeSession({ "spacemolt:get_ship": () => err("connection_closed") });
  const plan = await planTrading(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "fail", code: "get_ship_failed", message: "não foi possível ler o estado da nave" });
});

test("nave docada sempre vira stationStop", async () => {
  const session = fakeSession({ "spacemolt:get_ship": () => queryOk({ docked: true }) });
  const plan = await planTrading(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "stationStop" });
});

test("não docada (recuperação após interrupção): viaja pra estação mais próxima", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false }),
    "spacemolt:get_system": () => queryOk({ pois: [{ id: "belt_1" }, { id: "station_1", has_base: true }] }),
  });
  const plan = await planTrading(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "travelToPoi", poiId: "station_1" });
});

test("não docada, nenhuma estação encontrada: espera", async () => {
  const session = fakeSession({
    "spacemolt:get_ship": () => queryOk({ docked: false }),
    "spacemolt:get_system": () => queryOk({ pois: [] }),
  });
  const plan = await planTrading(ctxFor(session));
  assert.deepEqual(activityOf(plan), { kind: "wait", reason: "no_station_found" });
});
