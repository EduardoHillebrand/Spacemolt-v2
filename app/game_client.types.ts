// Tipos próprios da camada de conexão (spec 0001-connection-layer). O único tipo que vem
// da lib é `GameState` (re-exportado só como type, sem custo em runtime) — reescrevê-lo à
// mão duplicaria e desalinharia do que o jogo de fato devolve.
import type { GameState } from "@spacemolt/lib";

export type { GameState };

export type CommandResult =
  | { ok: true; kind: "query"; result: unknown; structuredContent?: unknown }
  | {
      ok: true;
      kind: "mutation";
      command: string;
      tick: number;
      delta: unknown;
      autoDocked?: boolean;
      autoUndocked?: boolean;
    }
  | { ok: false; code: string; message: string; details?: Record<string, unknown> };

export interface GameSession {
  readonly accountName: string;
  /** Estado devolvido pelo login — congelado, não atualiza (constituição, regra 11: não é fonte de verdade). */
  readonly initialState: Readonly<GameState>;
  /** Estado atual, lido ao vivo do cache da lib — chame de novo a cada vez que precisar. */
  getState(): Readonly<GameState>;
  call(tool: string, action: string, payload?: Record<string, unknown>): Promise<CommandResult>;
  on(eventType: string, handler: (payload: unknown) => void): () => void;
}

// Tipos da spec 0009-skill-navigation (módulo app/core/navigation.ts).
export type Destination =
  | { kind: "poi"; poiId: string }
  | { kind: "system"; systemId: string; poiId?: string };

export type NavigationResult =
  | { status: "arrived" }
  | { status: "blocked"; code: string; message: string; retryAfterSeconds?: number };

// Tipos da spec 0010-skill-maintenance (módulo app/core/maintenance.ts).
export type RepairResult =
  | { status: "repaired"; method: "credits" | "repair_kit" }
  | { status: "not_needed" }
  | { status: "blocked"; code: string; message: string };

export type InsuranceResult =
  | { status: "valid" }
  | { status: "purchased" }
  | { status: "blocked"; code: string; message: string };
