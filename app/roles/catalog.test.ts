import assert from "node:assert/strict";
import { test } from "node:test";
import { CATALOG, isValidRole } from "./catalog.js";

test("isValidRole aceita os papéis do catálogo", () => {
  for (const role of Object.keys(CATALOG)) {
    assert.equal(isValidRole(role), true);
  }
});

test("isValidRole rejeita papel desconhecido", () => {
  assert.equal(isValidRole("nonexistent"), false);
});

test("todo papel tem skills (lista, mesmo vazia) e objective não vazio", () => {
  for (const [role, def] of Object.entries(CATALOG)) {
    assert.ok(Array.isArray(def.skills), `${role}.skills deveria ser array`);
    assert.ok(def.objective.length > 0, `${role}.objective não deveria ser vazio`);
  }
});
