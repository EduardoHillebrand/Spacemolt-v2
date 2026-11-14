import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkMarkdown } from "./chunker.js";

test("quebra por seção markdown, uma seção pequena = um chunk", () => {
  const markdown = `Intro sem título.\n\n## Primeira Seção\nTexto curto aqui.\n\n## Segunda Seção\nOutro texto curto.`;
  const chunks = chunkMarkdown("teste.md", markdown);

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].section, "(intro)");
  assert.equal(chunks[1].section, "Primeira Seção");
  assert.equal(chunks[2].section, "Segunda Seção");
  assert.ok(chunks.every((c) => c.source === "teste.md"));
});

test("seção grande demais quebra por parágrafo, mantendo a mesma seção", () => {
  const bigParagraph = "x".repeat(1500);
  const markdown = `## Seção Grande\n${bigParagraph}\n\n${bigParagraph}\n\n${bigParagraph}`;
  const chunks = chunkMarkdown("grande.md", markdown);

  assert.ok(chunks.length > 1, "deveria ter quebrado em mais de 1 chunk");
  assert.ok(chunks.every((c) => c.section === "Seção Grande"));
  assert.ok(chunks.every((c) => c.text.length <= 2000 + bigParagraph.length)); // folga de 1 paragrafo
});

test("parágrafo único maior que o teto é quebrado na força bruta, nenhum chunk excede o limite", () => {
  const oneHugeLine = "y".repeat(7666); // achado real: lista longa sem linha em branco no meio
  const markdown = `## Seção Com Lista Gigante\n${oneHugeLine}`;
  const chunks = chunkMarkdown("gigante.md", markdown);

  assert.ok(chunks.length > 1, "deveria ter quebrado em mais de 1 chunk");
  for (const chunk of chunks) {
    assert.ok(chunk.text.length <= 2000, `chunk com ${chunk.text.length} chars excede o teto`);
  }
});

test("markdown vazio não gera chunks", () => {
  assert.deepEqual(chunkMarkdown("vazio.md", ""), []);
});
