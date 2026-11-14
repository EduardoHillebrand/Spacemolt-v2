// Contrato que toda skill implementa (spec 0006). O loop nunca conhece o funcionamento
// interno de nenhuma skill, só isto (constituição, regra 5).
import type { GameSession } from "../game_client.types.js";
import type { IndexedChunk } from "../knowledge/index_builder.js";
import type { MemoryEntry } from "../memory/long_term_memory.js";
import type { SkillName } from "../roles/catalog.js";

export interface InvalidationCondition {
  description: string;
  check: (ctx: SkillContext) => boolean;
}

export interface Plan {
  steps: unknown[];
  invalidate_when: InvalidationCondition[];
}

export type ExecutorResult =
  | { status: "running" }
  | { status: "done" }
  | { status: "invalidated"; reason: string }
  | { status: "error"; code: string; message: string };

export interface SkillContext {
  session: GameSession;
  objective: string;
  memory: {
    recall: (query: string, topK?: number) => Promise<MemoryEntry[]>;
    remember: (text: string, context?: string) => Promise<void>;
  };
  knowledgeBase: {
    search: (question: string, topK?: number) => Promise<IndexedChunk[]>;
  };
  decider: {
    ask: (question: string) => Promise<string>;
  };
}

export interface Skill {
  name: SkillName;
  planner: (ctx: SkillContext) => Promise<Plan>;
  executor: (plan: Plan, ctx: SkillContext) => Promise<ExecutorResult>;
}
