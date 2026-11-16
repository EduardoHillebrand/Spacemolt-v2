import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../game_client.types.js";
import type { SkillContext } from "../loop/skill_interface.js";
import { goTo, scoutDestination } from "./navigation.js";

type Handler = (payload: Record<string, unknown> | undefined) => CommandResult;

function fakeSession(handlers: Record<string, Handler>) {
  const calls: { tool: string; action: string; payload?: Record<string, unknown> }[] = [];
  const session = {
    accountName: "test",
    call: async (tool: string, action: string, payload?: Record<string, unknown>) => {
      calls.push({ tool, action, payload });
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

function ok(): CommandResult {
  return { ok: true, kind: "mutation", command: "x", tick: 1, delta: {} };
}

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

function err(code: string, message = "erro"): CommandResult {
  return { ok: false, code, message };
}

test("goTo pra um POI do sistema atual chama travel direto, sem find_route", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:travel": () => ok(),
  });

  const result = await goTo({ kind: "poi", poiId: "main_belt" }, ctxFor(session));

  assert.deepEqual(result, { status: "arrived" });
  assert.deepEqual(calls, [{ tool: "spacemolt", action: "travel", payload: { id: "main_belt" } }]);
});

test("goTo pra um sistema remoto segue o `route` de find_route, salto a salto, e o travel final", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:find_route": () =>
      queryOk({ found: true, route: ["sys_b", "sys_c"], fuel_per_jump: 9, target_poi: "station_c" }),
    "spacemolt:get_ship": () => queryOk({ fuel: 100 }),
    "spacemolt:jump": () => ok(),
    "spacemolt:travel": () => ok(),
  });

  const result = await goTo({ kind: "system", systemId: "sys_c" }, ctxFor(session));

  assert.deepEqual(result, { status: "arrived" });
  assert.deepEqual(
    calls.map((c) => `${c.action}:${c.payload?.id}`),
    ["find_route:sys_c", "get_ship:undefined", "jump:sys_b", "get_ship:undefined", "jump:sys_c", "travel:station_c"]
  );
});

test("combustível insuficiente dispara refuel antes do próximo salto, sem a skill precisar pedir", async () => {
  let fuel = 5; // abaixo do necessário pro salto (9 * 1.2 margem)
  const { session, calls } = fakeSession({
    "spacemolt:find_route": () => queryOk({ found: true, route: ["sys_b"], fuel_per_jump: 9 }),
    "spacemolt:get_ship": () => queryOk({ fuel }),
    "spacemolt:refuel": () => {
      fuel = 100;
      return ok();
    },
    "spacemolt:jump": () => ok(),
  });

  const result = await goTo({ kind: "system", systemId: "sys_b" }, ctxFor(session));

  assert.deepEqual(result, { status: "arrived" });
  assert.ok(calls.some((c) => c.action === "refuel"), "deveria ter reabastecido antes do jump");
});

test("find_route sem rota encontrada devolve blocked com code no_route, nunca lança", async () => {
  const { session } = fakeSession({
    "spacemolt:find_route": () => queryOk({ found: false }),
  });

  const result = await goTo({ kind: "system", systemId: "sys_isolado" }, ctxFor(session));

  assert.deepEqual(result, { status: "blocked", code: "no_route", message: "find_route não encontrou caminho até o destino" });
});

test("erro num salto do meio da rota para a viagem ali, sem tentar os passos seguintes", async () => {
  let jumpCalls = 0;
  const { session, calls } = fakeSession({
    "spacemolt:find_route": () => queryOk({ found: true, route: ["sys_b", "sys_c"], fuel_per_jump: 9, target_poi: "station_c" }),
    "spacemolt:get_ship": () => queryOk({ fuel: 100 }),
    "spacemolt:jump": () => {
      jumpCalls++;
      return jumpCalls === 1 ? ok() : err("no_fuel", "sem combustível");
    },
    "spacemolt:travel": () => ok(),
  });

  const result = await goTo({ kind: "system", systemId: "sys_c" }, ctxFor(session));

  assert.deepEqual(result, { status: "blocked", code: "no_fuel", message: "sem combustível" });
  assert.equal(jumpCalls, 2, "deveria ter tentado os dois jumps");
  assert.ok(!calls.some((c) => c.action === "travel"), "nunca deveria ter tentado o travel final depois do erro");
});

test("destino já é o sistema atual (route vazio) chega direto, sem tentar nenhum jump", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:find_route": () => queryOk({ found: true, route: [], target_poi: "station_a" }),
    "spacemolt:get_ship": () => queryOk({ fuel: 100 }),
    "spacemolt:travel": () => ok(),
  });

  const result = await goTo({ kind: "system", systemId: "sys_atual" }, ctxFor(session));

  assert.deepEqual(result, { status: "arrived" });
  assert.ok(!calls.some((c) => c.action === "jump"));
  assert.ok(calls.some((c) => c.action === "travel"), "ainda precisa do travel final até o POI pedido");
});

test("scoutDestination lê police_level/ship_count via scan sem mover a nave", async () => {
  const { session, calls } = fakeSession({
    "spacemolt:scan": () => queryOk({ police_level: 3, ship_count: 7 }),
  });

  const info = await scoutDestination({ kind: "poi", poiId: "belt_x" }, ctxFor(session));

  assert.equal(info.policeLevel, 3);
  assert.equal(info.shipCount, 7);
  assert.equal(calls.length, 1);
});

test("scoutDestination nunca lança quando o scan falha, só devolve o erro como dado", async () => {
  const { session } = fakeSession({
    "spacemolt:scan": () => err("scan_unavailable"),
  });

  const info = await scoutDestination({ kind: "system", systemId: "sys_x" }, ctxFor(session));

  assert.equal(info.policeLevel, undefined);
  assert.deepEqual(info.raw, { ok: false, code: "scan_unavailable", message: "erro" });
});
