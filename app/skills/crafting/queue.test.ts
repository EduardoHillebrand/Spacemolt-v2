import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult, GameSession } from "../../game_client.types.js";
import type { SkillContext } from "../../loop/skill_interface.js";
import { hasJobRunning, readQueue } from "./queue.js";

function fakeSession(handler: () => CommandResult) {
  return { accountName: "test", call: async () => handler() } as unknown as GameSession;
}

function ctxFor(session: GameSession): SkillContext {
  return { session } as SkillContext;
}

function queryOk(result: unknown): CommandResult {
  return { ok: true, kind: "query", result };
}

test("readQueue devolve null quando a chamada falha, nunca lança", async () => {
  const session = fakeSession(() => ({ ok: false, code: "connection_closed", message: "x" }));
  assert.equal(await readQueue(ctxFor(session)), null);
});

test("hasJobRunning é true com qualquer job não completado", () => {
  assert.equal(hasJobRunning({ jobs: [{ completed: false }] }), true);
  assert.equal(hasJobRunning({ jobs: [{}] }), true); // completed ausente -> trata como em andamento
});

test("hasJobRunning é false sem jobs ou com todos completados", async () => {
  assert.equal(hasJobRunning({ jobs: [] }), false);
  assert.equal(hasJobRunning({}), false);
  assert.equal(hasJobRunning({ jobs: [{ completed: true }] }), false);

  const session = fakeSession(() => queryOk({ jobs: [{ completed: true }] }));
  const queue = await readQueue(ctxFor(session));
  assert.ok(queue !== null);
  assert.equal(hasJobRunning(queue), false);
});
