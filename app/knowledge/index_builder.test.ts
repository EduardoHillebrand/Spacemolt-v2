import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { build } from "./index_builder.js";
import { reload, search } from "./query.js";

const FIXTURE_DIR = "knowledge_base.test";
const MARKDOWN = "## Fuel\nFuel costs scale with distance.\n\n## Combat\nWeapons deal damage based on tier.";

const VECTORS: Record<string, number[]> = {
  "## Fuel\nFuel costs scale with distance.": [1, 0],
  "## Combat\nWeapons deal damage based on tier.": [0, 1],
  "pergunta sobre combustivel": [0.9, 0.1],
};

async function fakeEmbed(text: string): Promise<number[]> {
  const vector = VECTORS[text];
  if (!vector) throw new Error(`fakeEmbed: texto de teste desconhecido: "${text}"`);
  return vector;
}

function setupFixture(): void {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
  mkdirSync(`${FIXTURE_DIR}/distilled`, { recursive: true });
  writeFileSync(`${FIXTURE_DIR}/distilled/fake.md`, MARKDOWN);
}

function teardownFixture(): void {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
}

test("build() gera index.json com os chunks embedados", async () => {
  setupFixture();
  await build({ embedFn: fakeEmbed, kbDir: FIXTURE_DIR });

  const index = JSON.parse(readFileSync(`${FIXTURE_DIR}/index.json`, "utf-8"));
  assert.equal(index.chunks.length, 2);
  assert.equal(index.chunks[0].section, "Fuel");
  assert.deepEqual(index.chunks[0].embedding, [1, 0]);
  assert.equal(index.chunks[1].section, "Combat");

  teardownFixture();
});

test("build() retenta embedding que falha uma vez antes de desistir", async () => {
  setupFixture();
  let calls = 0;
  const flaky = async (text: string): Promise<number[]> => {
    calls++;
    if (calls === 1) throw new Error("erro transiente simulado");
    return fakeEmbed(text);
  };

  await build({ embedFn: flaky, kbDir: FIXTURE_DIR });
  assert.ok(calls > 2, "deveria ter retentado pelo menos uma vez");

  const index = JSON.parse(readFileSync(`${FIXTURE_DIR}/index.json`, "utf-8"));
  assert.equal(index.chunks.length, 2);

  teardownFixture();
});

test("search() devolve o chunk mais relevante pra pergunta", async () => {
  setupFixture();
  await build({ embedFn: fakeEmbed, kbDir: FIXTURE_DIR });
  reload(FIXTURE_DIR); // força carregar o índice desta fixture, não o de outro teste

  const results = await search("pergunta sobre combustivel", 1, { embedFn: fakeEmbed, kbDir: FIXTURE_DIR });
  assert.equal(results[0].section, "Fuel");

  teardownFixture();
});

test("reload() lança erro claro se o índice não existir", () => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
  assert.throws(() => reload(FIXTURE_DIR), /Índice não encontrado/);
});
