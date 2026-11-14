import assert from "node:assert/strict";
import { test } from "node:test";
import { advance, type LoopState } from "./run_account_loop.js";
import type { Plan, Skill, SkillContext } from "./skill_interface.js";

// ctx de mentira -- advance() nunca toca em session/memory/knowledgeBase/decider de verdade,
// então um objeto vazio tipado basta.
const FAKE_CTX = {} as SkillContext;

function fakeDevlog() {
  const events: { type: string; level: string; payload?: unknown }[] = [];
  return { events, emit: (e: { type: string; level: string; payload?: unknown }) => events.push(e) };
}

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    name: "mining",
    planner: async () => ({ steps: [], invalidate_when: [] }) satisfies Plan,
    executor: async () => ({ status: "running" }),
    ...overrides,
  };
}

const INITIAL_STATE: LoopState = { plan: null, consecutiveErrors: 0 };

test("plano é criado quando não há plano ativo, e devlog recebe plan_created", async () => {
  let plannerCalls = 0;
  const skill = makeSkill({
    planner: async () => {
      plannerCalls++;
      return { steps: ["a"], invalidate_when: [] };
    },
    executor: async () => ({ status: "running" }),
  });
  const devlog = fakeDevlog();

  const next = await advance(INITIAL_STATE, skill, FAKE_CTX, devlog);

  assert.equal(plannerCalls, 1);
  assert.deepEqual(next.plan, { steps: ["a"], invalidate_when: [] });
  assert.ok(devlog.events.some((e) => e.type === "plan_created"));
});

test("'running' mantém o mesmo plano (nunca dois planos simultâneos) e zera erros", async () => {
  const existingPlan: Plan = { steps: ["x"], invalidate_when: [] };
  let plannerCalls = 0;
  const skill = makeSkill({
    planner: async () => {
      plannerCalls++;
      return { steps: [], invalidate_when: [] };
    },
    executor: async () => ({ status: "running" }),
  });

  const next = await advance({ plan: existingPlan, consecutiveErrors: 2 }, skill, FAKE_CTX, fakeDevlog());

  assert.equal(plannerCalls, 0, "não deveria ter chamado o planner de novo com plano já ativo");
  assert.equal(next.plan, existingPlan);
  assert.equal(next.consecutiveErrors, 0);
  assert.equal(next.skillDone, false);
});

test("'done' limpa o plano e sinaliza skillDone pro loop escolher skill de novo", async () => {
  const skill = makeSkill({ executor: async () => ({ status: "done" }) });
  const next = await advance(
    { plan: { steps: [], invalidate_when: [] }, consecutiveErrors: 0 },
    skill,
    FAKE_CTX,
    fakeDevlog()
  );

  assert.equal(next.plan, null);
  assert.equal(next.skillDone, true);
});

test("'invalidated' limpa o plano (replanejamento no próximo ciclo) e registra o motivo", async () => {
  const skill = makeSkill({ executor: async () => ({ status: "invalidated", reason: "cargo cheio antes do esperado" }) });
  const devlog = fakeDevlog();

  const next = await advance({ plan: { steps: [], invalidate_when: [] }, consecutiveErrors: 0 }, skill, FAKE_CTX, devlog);

  assert.equal(next.plan, null);
  assert.equal(next.skillDone, false);
  assert.ok(devlog.events.some((e) => e.type === "plan_invalidated" && (e.payload as any).reason.includes("cargo")));
});

test("'error' estruturado não derruba: limpa o plano, soma consecutiveErrors, devolve backoff", async () => {
  const skill = makeSkill({ executor: async () => ({ status: "error", code: "rate_limited", message: "429" }) });
  const devlog = fakeDevlog();

  const next = await advance({ plan: { steps: [], invalidate_when: [] }, consecutiveErrors: 1 }, skill, FAKE_CTX, devlog);

  assert.equal(next.plan, null);
  assert.equal(next.consecutiveErrors, 2);
  assert.ok(next.backoffMs && next.backoffMs > 0);
  assert.ok(devlog.events.some((e) => e.type === "skill_error"));
});

test("exceção real do executor (bug na skill) é tratada como erro, não derruba o loop", async () => {
  const skill = makeSkill({
    executor: async () => {
      throw new Error("bug inesperado na skill");
    },
  });
  const devlog = fakeDevlog();

  const next = await advance({ plan: { steps: [], invalidate_when: [] }, consecutiveErrors: 0 }, skill, FAKE_CTX, devlog);

  assert.equal(next.consecutiveErrors, 1);
  assert.ok(devlog.events.some((e) => e.type === "skill_error" && (e.payload as any).code === "skill_threw"));
});

test("exceção real do planner também é tratada como erro, não derruba o loop", async () => {
  const skill = makeSkill({
    planner: async () => {
      throw new Error("planner mal configurado");
    },
  });
  const devlog = fakeDevlog();

  const next = await advance(INITIAL_STATE, skill, FAKE_CTX, devlog);

  assert.equal(next.consecutiveErrors, 1);
  assert.ok(devlog.events.some((e) => e.type === "skill_error"));
});

test("backoff cresce com erros consecutivos (nunca martela em velocidade máxima)", async () => {
  const skill = makeSkill({ executor: async () => ({ status: "error", code: "x", message: "x" }) });
  const devlog = fakeDevlog();

  const first = await advance({ plan: null, consecutiveErrors: 0 }, skill, FAKE_CTX, devlog);
  const second = await advance({ plan: null, consecutiveErrors: first.consecutiveErrors }, skill, FAKE_CTX, devlog);

  assert.ok(second.backoffMs! > first.backoffMs!, "backoff deveria crescer com mais erros consecutivos");
});
