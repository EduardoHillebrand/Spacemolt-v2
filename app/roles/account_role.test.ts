import assert from "node:assert/strict";
import { unlinkSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { getRole, getRoleDefinition } from "./account_role.js";

const TEST_ROLES_PATH = "roles.test.json";

function withRolesFile(content: unknown, fn: () => void): void {
  writeFileSync(TEST_ROLES_PATH, JSON.stringify(content));
  try {
    fn();
  } finally {
    unlinkSync(TEST_ROLES_PATH);
  }
}

test("getRole devolve o papel atual e pretendido", () => {
  withRolesFile({ foo: { current: "miner", intended: "artisan" } }, () => {
    const role = getRole("foo", TEST_ROLES_PATH);
    assert.deepEqual(role, { current: "miner", intended: "artisan" });
  });
});

test("getRole lança erro claro pra conta desconhecida", () => {
  withRolesFile({}, () => {
    assert.throws(() => getRole("desconhecida", TEST_ROLES_PATH), /desconhecida/);
  });
});

test("getRole lança erro claro pra papel inválido no arquivo", () => {
  withRolesFile({ foo: { current: "nao_existe", intended: null } }, () => {
    assert.throws(() => getRole("foo", TEST_ROLES_PATH), /invalid current role/);
  });
});

test("getRoleDefinition devolve skills e objective pro papel", () => {
  const def = getRoleDefinition("miner");
  assert.ok(def.skills.includes("mining"));
  assert.ok(def.objective.length > 0);
});

test("getRoleDefinition lança erro claro pra papel desconhecido", () => {
  // @ts-expect-error -- testando deliberadamente com valor fora do tipo Role
  assert.throws(() => getRoleDefinition("nonexistent"), /Unknown role/);
});
