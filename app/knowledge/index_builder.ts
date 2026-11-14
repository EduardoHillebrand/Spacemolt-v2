// Constrói knowledge_base/index.json a partir dos arquivos de referência (spec 0004).
// Idempotente: pode rodar de novo a qualquer momento depois de atualizar a documentação.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { embed as realEmbed } from "../core/embeddings.js";
import { chunkMarkdown, type Chunk } from "./chunker.js";

export interface IndexedChunk extends Chunk {
  id: string;
  embedding: number[];
}

export interface KnowledgeIndex {
  chunks: IndexedChunk[];
  built_at: string;
}

const DEFAULT_KB_DIR = "knowledge_base";

interface BuildOptions {
  embedFn?: (text: string) => Promise<number[]>;
  kbDir?: string;
  onProgress?: (done: number, total: number) => void;
}

export async function build(options?: BuildOptions): Promise<void> {
  const embedFn = options?.embedFn ?? realEmbed;
  const kbDir = options?.kbDir ?? DEFAULT_KB_DIR;

  const files = listSourceFiles(kbDir);
  const rawChunks: Chunk[] = [];
  for (const path of files) {
    const markdown = readFileSync(path, "utf-8");
    rawChunks.push(...chunkMarkdown(path, markdown));
  }

  const chunks: IndexedChunk[] = [];
  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    let embedding: number[];
    try {
      embedding = await embedWithRetry(embedFn, chunk.text);
    } catch (err) {
      const preview = chunk.text.slice(0, 80).replace(/\n/g, "\\n");
      throw new Error(
        `Falha ao embedar chunk ${i}/${rawChunks.length} (${chunk.source} > ${chunk.section}, ${chunk.text.length} chars): "${preview}..." -- ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
    chunks.push({ ...chunk, id: `${chunk.source}#${i}`, embedding });
    options?.onProgress?.(i + 1, rawChunks.length);
  }

  const index: KnowledgeIndex = { chunks, built_at: new Date().toISOString() };
  writeFileSync(`${kbDir}/index.json`, JSON.stringify(index));
}

// ~1000 chamadas sequenciais ao Ollama local esbarram em erro transiente de vez em quando
// (achado rodando o build real contra a base inteira) — vale a pena um retry pequeno em vez
// de jogar fora o trabalho já feito.
async function embedWithRetry(
  embedFn: (text: string) => Promise<number[]>,
  text: string,
  attempts = 3
): Promise<number[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await embedFn(text);
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await sleep(1000 * attempt);
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listSourceFiles(kbDir: string): string[] {
  const files: string[] = [];

  const distilledDir = join(kbDir, "distilled");
  if (existsSync(distilledDir)) {
    files.push(
      ...readdirSync(distilledDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => join(distilledDir, name))
    );
  }

  const skillManualPath = join(kbDir, "SKILL_MANUAL.md");
  if (existsSync(skillManualPath)) {
    files.push(skillManualPath);
  }

  return files;
}
