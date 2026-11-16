import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { readDirective, writeDirective } from "./directive.js";

const ACCOUNTS_DIR = "accounts.directive.test";
const ACCOUNT = "fake-account";

function freshDir(): void {
  rmSync(ACCOUNTS_DIR, { recursive: true, force: true });
  mkdirSync(`${ACCOUNTS_DIR}/${ACCOUNT}`, { recursive: true });
}

test("readDirective sem arquivo devolve o default, nunca lança", () => {
  freshDir();
  const directive = readDirective(ACCOUNT, ACCOUNTS_DIR);
  assert.deepEqual(directive, { paused: false, preferences: {}, note: "", updatedAt: "" });
});

test("readDirective com arquivo corrompido cai pro default, nunca lança", () => {
  freshDir();
  const path = `${ACCOUNTS_DIR}/${ACCOUNT}/directive.json`;
  writeFileSync(path, "{ isso não é json válido");
  const directive = readDirective(ACCOUNT, ACCOUNTS_DIR);
  assert.equal(directive.paused, false);
});

test("writeDirective grava e readDirective lê de volta", () => {
  freshDir();
  const written = writeDirective(ACCOUNT, { paused: true, note: "foca em ferro" }, ACCOUNTS_DIR);
  assert.equal(written.paused, true);
  assert.equal(written.note, "foca em ferro");
  assert.ok(written.updatedAt.length > 0);

  const read = readDirective(ACCOUNT, ACCOUNTS_DIR);
  assert.deepEqual(read, written);
});

test("writeDirective faz merge de preferences por skill, não substitui outras skills", () => {
  freshDir();
  writeDirective(ACCOUNT, { preferences: { mining: { preferredResource: "iron" } } }, ACCOUNTS_DIR);
  const second = writeDirective(ACCOUNT, { preferences: { trading: { avoidEmpire: "crimson" } } }, ACCOUNTS_DIR);

  assert.deepEqual(second.preferences, {
    mining: { preferredResource: "iron" },
    trading: { avoidEmpire: "crimson" },
  });
});

test("writeDirective substitui a skill inteira quando ela vem de novo no patch", () => {
  freshDir();
  writeDirective(ACCOUNT, { preferences: { mining: { preferredResource: "iron" } } }, ACCOUNTS_DIR);
  const second = writeDirective(ACCOUNT, { preferences: { mining: { preferredResource: "ice" } } }, ACCOUNTS_DIR);

  assert.deepEqual(second.preferences.mining, { preferredResource: "ice" });
});

test("writeDirective preserva campos não tocados pelo patch (merge parcial no nível do documento)", () => {
  freshDir();
  writeDirective(ACCOUNT, { note: "nota original", paused: true }, ACCOUNTS_DIR);
  const second = writeDirective(ACCOUNT, { paused: false }, ACCOUNTS_DIR);

  assert.equal(second.note, "nota original");
  assert.equal(second.paused, false);
});

test("escrita atômica mantém directive.json.bak íntegro após a segunda escrita", () => {
  freshDir();
  writeDirective(ACCOUNT, { note: "primeira" }, ACCOUNTS_DIR);
  const afterFirst = readFileSync(`${ACCOUNTS_DIR}/${ACCOUNT}/directive.json`, "utf-8");

  writeDirective(ACCOUNT, { note: "segunda" }, ACCOUNTS_DIR);

  const bakPath = `${ACCOUNTS_DIR}/${ACCOUNT}/directive.json.bak`;
  assert.ok(existsSync(bakPath));
  assert.equal(readFileSync(bakPath, "utf-8"), afterFirst);
});

test("cleanup", () => {
  rmSync(ACCOUNTS_DIR, { recursive: true, force: true });
});
