// Busca por relevância na base de conhecimento (spec 0004). Índice carregado uma vez por
// processo; reload() força recarregar sem reiniciar.
import { existsSync, readFileSync } from "node:fs";
import { embed as realEmbed } from "../core/embeddings.js";
import { cosineSimilarity } from "../core/similarity.js";
import type { IndexedChunk, KnowledgeIndex } from "./index_builder.js";

const DEFAULT_KB_DIR = "knowledge_base";

let cachedIndex: KnowledgeIndex | null = null;

export function reload(kbDir: string = DEFAULT_KB_DIR): void {
  const path = `${kbDir}/index.json`;
  if (!existsSync(path)) {
    throw new Error(`Índice não encontrado em ${path} — rode scripts/build-knowledge-index.ts primeiro`);
  }
  cachedIndex = JSON.parse(readFileSync(path, "utf-8")) as KnowledgeIndex;
}

interface SearchOptions {
  embedFn?: (text: string) => Promise<number[]>;
  kbDir?: string;
}

export async function search(question: string, topK = 5, options?: SearchOptions): Promise<IndexedChunk[]> {
  if (!cachedIndex) reload(options?.kbDir);

  const embedFn = options?.embedFn ?? realEmbed;
  const queryEmbedding = await embedFn(question);

  return cachedIndex!.chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((scored) => scored.chunk);
}
