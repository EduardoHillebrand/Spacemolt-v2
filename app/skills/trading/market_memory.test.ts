import assert from "node:assert/strict";
import { test } from "node:test";
import type { SkillContext } from "../../loop/skill_interface.js";
import type { MemoryEntry } from "../../memory/long_term_memory.js";
import { bestRouteFromObservations, recallObservations, rememberObservation, type PriceObservation } from "./market_memory.js";

function fakeEntry(context: string | undefined): MemoryEntry {
  return { id: "x", text: "qualquer coisa", context, created_at: "2026-01-01T00:00:00Z", embedding: [] };
}

function ctxWithMemory(entries: MemoryEntry[]) {
  const remembered: { text: string; context?: string }[] = [];
  const ctx = {
    memory: {
      remember: async (text: string, context?: string) => {
        remembered.push({ text, context });
      },
      recall: async () => entries,
    },
  } as unknown as SkillContext;
  return { ctx, remembered };
}

test("rememberObservation grava o dado estruturado em context como JSON", async () => {
  const { ctx, remembered } = ctxWithMemory([]);
  const obs: PriceObservation = { poiId: "station_a", itemId: "iron_ore", askPrice: 10, bidPrice: 8 };

  await rememberObservation(ctx, obs);

  assert.equal(remembered.length, 1);
  assert.deepEqual(JSON.parse(remembered[0].context!), obs);
});

test("recallObservations ignora entradas que não são observações válidas, sem lançar", async () => {
  const valid: PriceObservation = { poiId: "station_a", itemId: "iron_ore", askPrice: 10, bidPrice: 8 };
  const { ctx } = ctxWithMemory([
    fakeEntry(JSON.stringify(valid)),
    fakeEntry("não é JSON nenhum"),
    fakeEntry(JSON.stringify({ not: "an observation" })),
    fakeEntry(undefined),
  ]);

  const result = await recallObservations(ctx);

  assert.deepEqual(result, [valid]);
});

test("bestRouteFromObservations acha o melhor spread entre estações diferentes pro mesmo item", () => {
  const observations: PriceObservation[] = [
    { poiId: "station_a", itemId: "iron_ore", askPrice: 10, bidPrice: 9 },
    { poiId: "station_b", itemId: "iron_ore", askPrice: 12, bidPrice: 20 },
    { poiId: "station_c", itemId: "iron_ore", askPrice: 11, bidPrice: 11 },
  ];

  const route = bestRouteFromObservations(observations);

  assert.deepEqual(route, {
    buyPoiId: "station_a",
    sellPoiId: "station_b",
    itemId: "iron_ore",
    lastSeenAskPrice: 10,
    lastSeenBidPrice: 20,
  });
});

test("bestRouteFromObservations nunca propõe comprar e vender na mesma estação", () => {
  const observations: PriceObservation[] = [{ poiId: "station_a", itemId: "iron_ore", askPrice: 10, bidPrice: 50 }];
  assert.equal(bestRouteFromObservations(observations), null);
});

test("bestRouteFromObservations devolve null sem nenhum par lucrativo", () => {
  const observations: PriceObservation[] = [
    { poiId: "station_a", itemId: "iron_ore", askPrice: 20, bidPrice: 5 },
    { poiId: "station_b", itemId: "iron_ore", askPrice: 25, bidPrice: 10 },
  ];
  assert.equal(bestRouteFromObservations(observations), null);
});
