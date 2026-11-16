import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { Plan, SkillContext } from "../../loop/skill_interface.js";
import type { MemoryEntry } from "../../memory/long_term_memory.js";
import { executeTradingStep } from "./executor.js";
import type { TradingActivity } from "./activity.js";
import type { PriceObservation } from "./market_memory.js";

type Handler = (payload: Record<string, unknown> | undefined) => CommandResult;

function fakeCtx(handlers: Record<string, Handler>, memoryEntries: MemoryEntry[] = []) {
  const calls: { tool: string; action: string; payload?: Record<string, unknown> }[] = [];
  const remembered: { text: string; context?: string }[] = [];

  const session = {
    accountName: "test",
    call: async (tool: string, action: string, payload?: Record<string, unknown>) => {
      calls.push({ tool, action, payload });
      const handler = handlers[`${tool}:${action}`];
      if (!handler) throw new Error(`sem handler fake pra ${tool}:${action}`);
      return handler(payload);
    },
  } as unknown as GameSession;

  const ctx = {
    session,
    memory: {
      remember: async (text: string, context?: string) => {
        remembered.push({ text, context });
      },
      recall: async () => memoryEntries,
    },
  } as unknown as SkillContext;

  return { ctx, calls, remembered };
}

function planFor(activity: TradingActivity): Plan {
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

function observationEntry(obs: PriceObservation): MemoryEntry {
  return { id: "x", text: "obs", context: JSON.stringify(obs), created_at: "2026-01-01T00:00:00Z", embedding: [] };
}

test("travelToPoi: chegada devolve done", async () => {
  const { ctx } = fakeCtx({ "spacemolt:travel": () => mutationOk() });
  const result = await executeTradingStep(planFor({ kind: "travelToPoi", poiId: "station_a" }), ctx);
  assert.deepEqual(result, { status: "done" });
});

test("travelToPoi: bloqueio no jogo invalida o plano", async () => {
  const { ctx } = fakeCtx({ "spacemolt:travel": () => err("no_fuel", "sem combustível") });
  const result = await executeTradingStep(planFor({ kind: "travelToPoi", poiId: "station_a" }), ctx);
  assert.deepEqual(result, { status: "invalidated", reason: "no_fuel: sem combustível" });
});

test("wait: devolve done pra reavaliar do zero no próximo ciclo", async () => {
  const { ctx } = fakeCtx({});
  const result = await executeTradingStep(planFor({ kind: "wait", reason: "no_station_found" }), ctx);
  assert.deepEqual(result, { status: "done" });
});

test("fail: vira error estruturado com o código/mensagem do planner", async () => {
  const { ctx } = fakeCtx({});
  const result = await executeTradingStep(planFor({ kind: "fail", code: "get_ship_failed", message: "x" }), ctx);
  assert.deepEqual(result, { status: "error", code: "get_ship_failed", message: "x" });
});

test("stationStop: falha ao vender cargo existente vira erro, nunca chega a observar mercado", async () => {
  const { ctx, calls } = fakeCtx({ "spacemolt:get_cargo": () => err("connection_closed") });
  const result = await executeTradingStep(planFor({ kind: "stationStop" }), ctx);
  assert.deepEqual(result, { status: "error", code: "connection_closed", message: "erro" });
  assert.ok(!calls.some((c) => c.tool === "spacemolt_market"));
});

test("stationStop: sem rota lucrativa nenhuma, só observa o mercado local e undoca", async () => {
  const { ctx, calls, remembered } = fakeCtx({
    "spacemolt:get_cargo": () => queryOk({ items: [] }),
    "spacemolt:get_ship": () => queryOk({ hull: 100, max_hull: 100, docked: true }),
    "spacemolt_salvage:policies": () => queryOk({ policies: [{ valid: true }] }),
    "spacemolt:get_poi": () => queryOk({ id: "station_here" }),
    "spacemolt_market:view_market": () => queryOk({ items: [] }), // nada observável agora
    "spacemolt:undock": () => mutationOk(),
  });

  const result = await executeTradingStep(planFor({ kind: "stationStop" }), ctx);

  assert.deepEqual(result, { status: "done" });
  assert.ok(calls.some((c) => c.action === "undock"));
  assert.equal(remembered.length, 0, "nada pra observar, nada pra gravar");
});

test("stationStop: acha rota lucrativa combinando observação nova com memória antiga, e a executa inteira", async () => {
  const historical = observationEntry({ poiId: "station_other", itemId: "iron_ore", askPrice: 5, bidPrice: 3 });

  const { ctx, calls, remembered } = fakeCtx(
    {
      "spacemolt:get_cargo": () => queryOk({ items: [] }),
      "spacemolt:get_ship": () => queryOk({ hull: 100, max_hull: 100, docked: true }),
      "spacemolt_salvage:policies": () => queryOk({ policies: [{ valid: true }] }),
      "spacemolt:get_poi": () => queryOk({ id: "station_here" }),
      "spacemolt_market:view_market": () => queryOk({ items: [{ item_id: "iron_ore", best_ask: 8, best_bid: 20 }] }),
      "spacemolt:get_empire_info": () => queryOk({ rate_bps: 0 }),
      "spacemolt:travel": () => mutationOk(),
      "spacemolt_market:estimate_purchase": () => queryOk({ affordable: true }),
      "spacemolt:buy": () => mutationOk(),
      "spacemolt:sell": () => mutationOk(),
    },
    [historical]
  );

  const result = await executeTradingStep(planFor({ kind: "stationStop" }), ctx);

  assert.deepEqual(result, { status: "done" });
  // Rota escolhida deveria ser comprar em station_other (ask 5) e vender aqui (bid 20) --
  // nunca o contrário (station_here tem ask 8, pior que station_other).
  assert.ok(calls.some((c) => c.action === "travel" && c.payload?.id === "station_other"));
  assert.ok(calls.some((c) => c.action === "buy" && c.payload?.id === "iron_ore"));
  assert.ok(calls.some((c) => c.action === "sell" && c.payload?.id === "iron_ore"));
  assert.ok(remembered.length >= 1, "deveria ter gravado ao menos a observação local e a confirmação de venda");
});

test("stationStop: bloqueio indo pra estação de compra invalida o plano, nunca tenta comprar", async () => {
  const historical = observationEntry({ poiId: "station_other", itemId: "iron_ore", askPrice: 5, bidPrice: 3 });

  const { ctx, calls } = fakeCtx(
    {
      "spacemolt:get_cargo": () => queryOk({ items: [] }),
      "spacemolt:get_ship": () => queryOk({ hull: 100, max_hull: 100, docked: true }),
      "spacemolt_salvage:policies": () => queryOk({ policies: [{ valid: true }] }),
      "spacemolt:get_poi": () => queryOk({ id: "station_here" }),
      "spacemolt_market:view_market": () => queryOk({ items: [{ item_id: "iron_ore", best_ask: 8, best_bid: 20 }] }),
      "spacemolt:get_empire_info": () => queryOk({ rate_bps: 0 }),
      "spacemolt:travel": () => err("no_fuel", "sem combustível"),
    },
    [historical]
  );

  const result = await executeTradingStep(planFor({ kind: "stationStop" }), ctx);

  assert.deepEqual(result, { status: "invalidated", reason: "no_fuel: sem combustível" });
  assert.ok(!calls.some((c) => c.action === "buy"));
});
