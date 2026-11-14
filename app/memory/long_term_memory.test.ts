import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { test } from "node:test";
import { list, recall, remember } from "./long_term_memory.js";

const ACCOUNTS_DIR = "accounts.test";
const ACCOUNT = "fake-account";

// Embeddings de mentira, controlados: cada texto conhecido mapeia pra um vetor fixo, pra
// dar pra prever qual entrada deveria ganhar no recall().
const VECTORS: Record<string, number[]> = {
  "rota sol-sirius tem pirata": [1, 0, 0],
  "esse npc paga mal": [0, 1, 0],
  "pergunta sobre pirata na rota": [0.9, 0.1, 0],
  "pergunta sobre pagamento de npc": [0.1, 0.9, 0],
};

async function fakeEmbed(text: string): Promise<number[]> {
  const vector = VECTORS[text];
  if (!vector) throw new Error(`fakeEmbed: texto de teste desconhecido: "${text}"`);
  return vector;
}

function freshDir(): void {
  rmSync(ACCOUNTS_DIR, { recursive: true, force: true });
  mkdirSync(`${ACCOUNTS_DIR}/${ACCOUNT}`, { recursive: true });
}

test("remember grava e persiste; list devolve tudo", async () => {
  freshDir();
  await remember(ACCOUNT, "rota sol-sirius tem pirata", "navigation", {
    embedFn: fakeEmbed,
    accountsDir: ACCOUNTS_DIR,
  });
  await remember(ACCOUNT, "esse npc paga mal", "trading", { embedFn: fakeEmbed, accountsDir: ACCOUNTS_DIR });

  const entries = list(ACCOUNT, { accountsDir: ACCOUNTS_DIR });
  assert.equal(entries.length, 2);
  assert.equal(entries[0].text, "rota sol-sirius tem pirata");
  assert.equal(entries[1].context, "trading");
});

test("recall devolve ordenado por similaridade, não por palavra exata", async () => {
  freshDir();
  await remember(ACCOUNT, "rota sol-sirius tem pirata", "navigation", {
    embedFn: fakeEmbed,
    accountsDir: ACCOUNTS_DIR,
  });
  await remember(ACCOUNT, "esse npc paga mal", "trading", { embedFn: fakeEmbed, accountsDir: ACCOUNTS_DIR });

  const results = await recall(ACCOUNT, "pergunta sobre pirata na rota", 2, {
    embedFn: fakeEmbed,
    accountsDir: ACCOUNTS_DIR,
  });
  assert.equal(results[0].text, "rota sol-sirius tem pirata");
});

test("remember falha ao computar embedding não deixa estado parcial", async () => {
  freshDir();
  await remember(ACCOUNT, "esse npc paga mal", "trading", { embedFn: fakeEmbed, accountsDir: ACCOUNTS_DIR });
  const before = readFileSync(`${ACCOUNTS_DIR}/${ACCOUNT}/memory.json`, "utf-8");

  await assert.rejects(
    remember(ACCOUNT, "texto nao mapeado no fake", undefined, { embedFn: fakeEmbed, accountsDir: ACCOUNTS_DIR })
  );

  const after = readFileSync(`${ACCOUNTS_DIR}/${ACCOUNT}/memory.json`, "utf-8");
  assert.equal(after, before, "memory.json não deveria ter mudado quando embed() falha");
});

test("escrita atômica mantém memory.json.bak íntegro após a segunda escrita", async () => {
  freshDir();
  await remember(ACCOUNT, "rota sol-sirius tem pirata", "navigation", {
    embedFn: fakeEmbed,
    accountsDir: ACCOUNTS_DIR,
  });
  const afterFirst = readFileSync(`${ACCOUNTS_DIR}/${ACCOUNT}/memory.json`, "utf-8");

  await remember(ACCOUNT, "esse npc paga mal", "trading", { embedFn: fakeEmbed, accountsDir: ACCOUNTS_DIR });

  const bakPath = `${ACCOUNTS_DIR}/${ACCOUNT}/memory.json.bak`;
  assert.ok(existsSync(bakPath), ".bak deveria existir depois da segunda escrita");
  const bakContent = readFileSync(bakPath, "utf-8");
  assert.equal(bakContent, afterFirst, ".bak deveria ser exatamente o estado anterior à última escrita");

  const current = JSON.parse(readFileSync(`${ACCOUNTS_DIR}/${ACCOUNT}/memory.json`, "utf-8"));
  assert.equal(current.entries.length, 2);
});

test("cleanup", () => {
  rmSync(ACCOUNTS_DIR, { recursive: true, force: true });
});
