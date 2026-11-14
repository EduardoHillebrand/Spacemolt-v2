// Memória de longo prazo por conta (spec 0003-memory, constituição regra 11): cumulativa,
// nunca descartada automaticamente, nunca confundida com estado operacional.
import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { embed as realEmbed } from "../core/embeddings.js";
import { cosineSimilarity } from "../core/similarity.js";

export interface MemoryEntry {
  id: string;
  text: string;
  context?: string;
  created_at: string;
  embedding: number[];
}

interface MemoryFile {
  entries: MemoryEntry[];
}

interface MemoryOptions {
  /** Injetável só pra teste (sem rede). Produção usa sempre o embed() real do Ollama. */
  embedFn?: (text: string) => Promise<number[]>;
  /** Injetável só pra teste. Produção usa sempre `accounts/`. */
  accountsDir?: string;
}

const DEFAULT_ACCOUNTS_DIR = "accounts";

export async function remember(
  accountName: string,
  text: string,
  context?: string,
  options?: MemoryOptions
): Promise<void> {
  const embedFn = options?.embedFn ?? realEmbed;
  // Embedding primeiro, de propósito: se falhar (ex: Ollama fora), nenhuma escrita acontece
  // e o arquivo existente fica intocado — nunca um estado parcial.
  const embedding = await embedFn(text);

  const accountsDir = options?.accountsDir ?? DEFAULT_ACCOUNTS_DIR;
  const file = readMemoryFile(accountName, accountsDir);
  const entry: MemoryEntry = {
    id: `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    context,
    created_at: new Date().toISOString(),
    embedding,
  };
  file.entries.push(entry);
  writeMemoryFileAtomic(accountName, accountsDir, file);
}

export async function recall(
  accountName: string,
  query: string,
  topK = 5,
  options?: MemoryOptions
): Promise<MemoryEntry[]> {
  const accountsDir = options?.accountsDir ?? DEFAULT_ACCOUNTS_DIR;
  const file = readMemoryFile(accountName, accountsDir);
  if (file.entries.length === 0) return [];

  const embedFn = options?.embedFn ?? realEmbed;
  const queryEmbedding = await embedFn(query);

  return file.entries
    .map((entry) => ({ entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((scored) => scored.entry);
}

export function list(accountName: string, options?: MemoryOptions): MemoryEntry[] {
  const accountsDir = options?.accountsDir ?? DEFAULT_ACCOUNTS_DIR;
  return readMemoryFile(accountName, accountsDir).entries;
}

function memoryPath(accountName: string, accountsDir: string): string {
  return `${accountsDir}/${accountName}/memory.json`;
}

function readMemoryFile(accountName: string, accountsDir: string): MemoryFile {
  const path = memoryPath(accountName, accountsDir);
  if (!existsSync(path)) return { entries: [] };
  return JSON.parse(readFileSync(path, "utf-8")) as MemoryFile;
}

function writeMemoryFileAtomic(accountName: string, accountsDir: string, data: MemoryFile): void {
  const path = memoryPath(accountName, accountsDir);
  const tmpPath = `${path}.tmp`;
  const bakPath = `${path}.bak`;

  if (existsSync(path)) {
    copyFileSync(path, bakPath);
  }
  writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  renameSync(tmpPath, path); // rename é atômico no mesmo filesystem: nunca fica parcial
}
