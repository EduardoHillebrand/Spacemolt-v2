// Único módulo que lê/escreve accounts/<conta>/directive.json (spec 0012). Dado de
// instância por conta, não segredo, mas ainda assim fora do git (mesmo padrão de
// accounts/<conta>/memory.json, spec 0003) — muda com frequência, não é decisão de
// projeto como roles.json.
import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

export interface Directive {
  paused: boolean;
  /** Namespaced por SkillName — cada skill só lê a própria chave (ex.: preferences.mining). */
  preferences: Record<string, Record<string, unknown>>;
  note: string;
  updatedAt: string;
}

const DEFAULT_DIRECTIVE: Directive = { paused: false, preferences: {}, note: "", updatedAt: "" };
const DEFAULT_ACCOUNTS_DIR = "accounts";

export function readDirective(accountName: string, accountsDir: string = DEFAULT_ACCOUNTS_DIR): Directive {
  const path = directivePath(accountName, accountsDir);
  if (!existsSync(path)) return { ...DEFAULT_DIRECTIVE };

  try {
    const raw = JSON.parse(readFileSync(path, "utf-8")) as Partial<Directive>;
    return {
      paused: raw.paused ?? false,
      preferences: raw.preferences ?? {},
      note: raw.note ?? "",
      updatedAt: raw.updatedAt ?? "",
    };
  } catch {
    // Arquivo corrompido nunca derruba o loop (constituição, regra 6) -- cai pro default,
    // equivalente a "sem diretriz nenhuma" até alguém escrever de novo.
    return { ...DEFAULT_DIRECTIVE };
  }
}

/** Merge parcial: `preferences` funde por chave de skill (não substitui as outras skills). */
export function writeDirective(
  accountName: string,
  patch: Partial<Directive>,
  accountsDir: string = DEFAULT_ACCOUNTS_DIR
): Directive {
  const current = readDirective(accountName, accountsDir);
  const next: Directive = {
    paused: patch.paused ?? current.paused,
    preferences: patch.preferences ? { ...current.preferences, ...patch.preferences } : current.preferences,
    note: patch.note ?? current.note,
    updatedAt: new Date().toISOString(),
  };
  writeDirectiveAtomic(accountName, accountsDir, next);
  return next;
}

function directivePath(accountName: string, accountsDir: string): string {
  return `${accountsDir}/${accountName}/directive.json`;
}

function writeDirectiveAtomic(accountName: string, accountsDir: string, data: Directive): void {
  const path = directivePath(accountName, accountsDir);
  const tmpPath = `${path}.tmp`;
  const bakPath = `${path}.bak`;

  if (existsSync(path)) {
    copyFileSync(path, bakPath);
  }
  writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  renameSync(tmpPath, path); // rename é atômico no mesmo filesystem: nunca fica parcial
}
