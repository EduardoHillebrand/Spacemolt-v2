import assert from "node:assert/strict";
import { test } from "node:test";
import { hasRequiredFields, scrub } from "./event.js";

test("scrub redige chave sensível no nível raiz", () => {
  const result = scrub({ password: "abc123", other: "fica" });
  assert.deepEqual(result, { password: "[REDACTED]", other: "fica" });
});

test("scrub redige chave sensível em profundidade (objeto aninhado)", () => {
  const result = scrub({ nested: { token: "xyz", keep: "fica" } });
  assert.deepEqual(result, { nested: { token: "[REDACTED]", keep: "fica" } });
});

test("scrub redige chave sensível dentro de array de objetos", () => {
  const result = scrub({ items: [{ secret: "s1" }, { credential: "c1", ok: 1 }] });
  assert.deepEqual(result, { items: [{ secret: "[REDACTED]" }, { credential: "[REDACTED]", ok: 1 }] });
});

test("scrub não altera valores sem chave sensível", () => {
  const result = scrub({ a: 1, b: [1, 2, 3], c: "texto normal" });
  assert.deepEqual(result, { a: 1, b: [1, 2, 3], c: "texto normal" });
});

test("hasRequiredFields aceita evento completo", () => {
  assert.equal(
    hasRequiredFields({ type: "x", account: "hillebot", level: "info", timestamp: "2026-01-01T00:00:00Z" }),
    true
  );
});

test("hasRequiredFields rejeita evento incompleto ou malformado", () => {
  assert.equal(hasRequiredFields({ type: "x" }), false);
  assert.equal(hasRequiredFields({ type: "x", account: "a", level: "nao_existe", timestamp: "t" }), false);
  assert.equal(hasRequiredFields("string qualquer"), false);
  assert.equal(hasRequiredFields(null), false);
});
