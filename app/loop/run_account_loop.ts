// O loop em si (spec 0006): decide qual skill rodar pro papel da conta, mantém o ciclo
// vivo, aciona replanejamento, nunca para por erro (constituição, regras 2, 2.1, 6).
import { ask } from "../core/decider.js";
import { createDevlogClient, type DevlogClient } from "../devlog/client.js";
import { connect } from "../game_client.js";
import { search as searchKnowledgeBase } from "../knowledge/query.js";
import { recall, remember } from "../memory/long_term_memory.js";
import { getRole, getRoleDefinition } from "../roles/account_role.js";
import { resolve } from "./skill_registry.js";
import type { Plan, Skill, SkillContext } from "./skill_interface.js";

const NO_SKILL_POLL_MS = 5000;
const MAX_BACKOFF_MS = 30000;

export interface LoopState {
  plan: Plan | null;
  consecutiveErrors: number;
}

export interface AdvanceResult extends LoopState {
  skillDone: boolean;
  backoffMs?: number;
}

/**
 * Um passo do loop, isolado e testável sem rede/sleep: dado o estado atual e uma skill,
 * roda planner (se precisar) + executor, e devolve o próximo estado. Nunca lança — uma
 * exceção real do planner/executor (bug na skill, não erro do jogo) é tratada igual a um
 * `{status:"error"}` estruturado (requisito 5 da spec).
 */
export async function advance(
  state: LoopState,
  skill: Skill,
  ctx: SkillContext,
  devlog: Pick<DevlogClient, "emit">
): Promise<AdvanceResult> {
  let plan = state.plan;

  try {
    if (plan === null) {
      plan = await skill.planner(ctx);
      devlog.emit({ type: "plan_created", level: "info", payload: { skill: skill.name } });
    }

    const result = await skill.executor(plan, ctx);

    switch (result.status) {
      case "running":
        return { plan, consecutiveErrors: 0, skillDone: false };
      case "done":
        return { plan: null, consecutiveErrors: 0, skillDone: true };
      case "invalidated":
        devlog.emit({ type: "plan_invalidated", level: "info", payload: { reason: result.reason } });
        return { plan: null, consecutiveErrors: state.consecutiveErrors, skillDone: false };
      case "error":
        return handleError(result.code, result.message, state.consecutiveErrors, devlog);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return handleError("skill_threw", message, state.consecutiveErrors, devlog);
  }
}

function handleError(
  code: string,
  message: string,
  previousConsecutiveErrors: number,
  devlog: Pick<DevlogClient, "emit">
): AdvanceResult {
  devlog.emit({ type: "skill_error", level: "error", payload: { code, message } });
  const consecutiveErrors = previousConsecutiveErrors + 1;
  return { plan: null, consecutiveErrors, skillDone: false, backoffMs: backoffMs(consecutiveErrors) };
}

export async function runAccountLoop(accountName: string): Promise<never> {
  const session = await connect(accountName);
  const devlog = createDevlogClient(accountName);

  const ctx: SkillContext = {
    session,
    objective: "",
    memory: {
      recall: (query, topK) => recall(accountName, query, topK),
      remember: (text, context) => remember(accountName, text, context),
    },
    knowledgeBase: {
      search: (question, topK) => searchKnowledgeBase(question, topK),
    },
    decider: { ask },
  };

  let activeSkills = loadActiveSkills(accountName, ctx, devlog);
  let activeSkill = chooseSkill(activeSkills);
  let state: LoopState = { plan: null, consecutiveErrors: 0 };

  while (true) {
    if (activeSkill === null) {
      await sleep(NO_SKILL_POLL_MS);
      activeSkills = loadActiveSkills(accountName, ctx, devlog);
      activeSkill = chooseSkill(activeSkills);
      continue;
    }

    const next = await advance(state, activeSkill, ctx, devlog);
    state = { plan: next.plan, consecutiveErrors: next.consecutiveErrors };

    if (next.skillDone) {
      activeSkill = chooseSkill(activeSkills);
    }
    if (next.backoffMs !== undefined) {
      await sleep(next.backoffMs);
    } else {
      // Cede o event loop a cada iteração. Sem isso, uma skill cujo executor resolve quase
      // instantaneamente (bug, ou um "running" rápido demais) pode travar o processo numa
      // fila de microtasks que nunca deixa timers/I/O (nem o próprio devlog) rodarem.
      await yieldEventLoop();
    }
  }
}

function loadActiveSkills(accountName: string, ctx: SkillContext, devlog: Pick<DevlogClient, "emit">): Skill[] {
  const { current: role } = getRole(accountName);
  const { skills: skillNames, objective } = getRoleDefinition(role);
  ctx.objective = objective;

  const skills = resolve(skillNames);
  if (skills.length === 0) {
    devlog.emit({ type: "no_skills_for_role", level: "warning", payload: { role } });
  }
  return skills;
}

// Hoje trivial de propósito (spec 0006, requisito 3): a primeira skill da lista, na ordem
// do catalog.ts (spec 0002). Revisitar quando mais de uma skill competir pelo mesmo papel.
function chooseSkill(skills: Skill[]): Skill | null {
  return skills[0] ?? null;
}

function backoffMs(consecutiveErrors: number): number {
  return Math.min(1000 * 2 ** (consecutiveErrors - 1), MAX_BACKOFF_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
