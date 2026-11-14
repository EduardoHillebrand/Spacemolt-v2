import assert from "node:assert/strict";
import { test } from "node:test";
import { ConnectionClosedError, HttpError, SpacemoltError } from "@spacemolt/lib";
import { toCommandResult } from "./errors.js";

test("normaliza SpacemoltError preservando code/message/details", () => {
  const err = new SpacemoltError("already_docked", "Already docked", { details: { foo: "bar" } });
  const result = toCommandResult(err);
  assert.deepEqual(result, {
    ok: false,
    code: "already_docked",
    message: "Already docked",
    details: { foo: "bar" },
  });
});

test("normaliza HttpError com status/url/attempts/retryAfterMs em details", () => {
  const err = new HttpError("GET https://x -> 503 Service Unavailable", {
    status: 503,
    url: "https://x",
    attempts: 3,
    retryAfterMs: 2000,
  });
  const result = toCommandResult(err);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "http_error");
    assert.deepEqual(result.details, { status: 503, url: "https://x", attempts: 3, retryAfterMs: 2000 });
  }
});

test("normaliza ConnectionClosedError com closeCode/reason em details", () => {
  const err = new ConnectionClosedError("WebSocket connection closed", 4002, "auth_timeout");
  const result = toCommandResult(err);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "connection_closed");
    assert.deepEqual(result.details, { closeCode: 4002, reason: "auth_timeout" });
  }
});

test("normaliza erro genérico (não da lib) como unknown_error, nunca lança", () => {
  const result = toCommandResult(new TypeError("fetch failed"));
  assert.deepEqual(result, { ok: false, code: "unknown_error", message: "fetch failed" });
});

test("normaliza valor não-Error (ex: string lançada) sem lançar", () => {
  const result = toCommandResult("algo estranho");
  assert.deepEqual(result, { ok: false, code: "unknown_error", message: "algo estranho" });
});
