import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandResult } from "./game_client.types.js";
import { withRateLimitRetry } from "./rate_limit.js";

const ok: CommandResult = { ok: true, kind: "query", result: "ok", structuredContent: {} };
const rateLimited: CommandResult = {
  ok: false,
  code: "rate_limited",
  message: "Too many requests",
  details: { retry_after: 0 }, // 0s nesse teste, pra não deixar o teste lento
};
const notFound: CommandResult = { ok: false, code: "not_found", message: "Unknown command" };

test("sucesso de primeira não retenta", async () => {
  let calls = 0;
  const call = async () => {
    calls++;
    return ok;
  };
  const result = await withRateLimitRetry(call)("spacemolt", "get_status");
  assert.equal(calls, 1);
  assert.deepEqual(result, ok);
});

test("erro que não é rate limit não retenta", async () => {
  let calls = 0;
  const call = async () => {
    calls++;
    return notFound;
  };
  const result = await withRateLimitRetry(call)("spacemolt", "x");
  assert.equal(calls, 1);
  assert.deepEqual(result, notFound);
});

test("rate_limited retenta e devolve sucesso quando se recupera", async () => {
  let calls = 0;
  const call = async () => {
    calls++;
    return calls < 3 ? rateLimited : ok;
  };
  const result = await withRateLimitRetry(call)("spacemolt", "get_status");
  assert.equal(calls, 3);
  assert.deepEqual(result, ok);
});

test("rate_limited persistente esgota as tentativas e devolve o último erro", async () => {
  let calls = 0;
  const call = async () => {
    calls++;
    return rateLimited;
  };
  const result = await withRateLimitRetry(call)("spacemolt", "get_status");
  assert.equal(calls, 5);
  assert.deepEqual(result, rateLimited);
});

test("http_error 429 é tratado como rate limit", async () => {
  let calls = 0;
  const http429: CommandResult = { ok: false, code: "http_error", message: "429", details: { status: 429 } };
  const call = async () => {
    calls++;
    return calls < 2 ? http429 : ok;
  };
  const result = await withRateLimitRetry(call)("spacemolt", "get_map");
  assert.equal(calls, 2);
  assert.deepEqual(result, ok);
});
