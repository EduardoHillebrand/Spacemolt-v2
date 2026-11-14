// Validação manual (0006, tasks 7-10): role sem skill, ciclo completo com skill fake,
// replanejamento, erro não derruba -- tudo contra a conta real ironvex.
import { readFileSync, writeFileSync } from "node:fs";
import { createDevlogClient } from "../app/devlog/client.js";
import { startDevlogServer } from "../app/devlog/server.js";
import { runAccountLoop } from "../app/loop/run_account_loop.js";
import { registerForTest, unregisterForTest } from "../app/loop/skill_registry.js";
import type { ExecutorResult, Skill } from "../app/loop/skill_interface.js";
import type { DevlogEvent } from "../app/devlog/event.js";

const ACCOUNT = "ironvex";
const ROLES_PATH = "roles.json";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setRole(current: string, intended: string | null): void {
  const roles = JSON.parse(readFileSync(ROLES_PATH, "utf-8"));
  roles[ACCOUNT] = { current, intended };
  writeFileSync(ROLES_PATH, JSON.stringify(roles, null, 2) + "\n");
}

const originalRolesFile = readFileSync(ROLES_PATH, "utf-8");
const originalEntry = JSON.parse(originalRolesFile)[ACCOUNT];

const devlogEvents: DevlogEvent[] = [];
const server = startDevlogServer();
await sleep(300); // dá tempo do listener TCP do servidor terminar de abrir antes de conectar
const listener = createDevlogClient("_validation_listener");
// Reaproveita o client só pra conectar; escuta via WS cru pra ver tudo (inclusive de ironvex).
const rawListener = new WebSocket("ws://localhost:7788");
await new Promise((resolve) => rawListener.addEventListener("open", resolve));
rawListener.addEventListener("message", (ev) => {
  const parsed = JSON.parse(String(ev.data));
  devlogEvents.push(parsed);
});

let executorScript: ExecutorResult[] = [];
let plannerCalls = 0;
let executorCalls = 0;

const fakeMiningSkill: Skill = {
  name: "mining",
  planner: async () => {
    plannerCalls++;
    return { steps: [], invalidate_when: [] };
  },
  executor: async () => {
    executorCalls++;
    if (executorScript.length > 0) return executorScript.shift()!;
    return { status: "running" };
  },
};

try {
  console.log("--- 7: papel sem skill (artisan, lista vazia no catálogo) ---");
  setRole("artisan", null);

  const loopStartedAt = Date.now();
  const loopPromise = runAccountLoop(ACCOUNT);
  let loopCrashed = false;
  loopPromise.catch((err) => {
    loopCrashed = true;
    console.log("loop rejeitou:", err);
  });

  await sleep(12000); // conectar no jogo de verdade + ao menos 1 ciclo de poll depois
  console.log(`(login + 1a rodada levaram ~${Date.now() - loopStartedAt}ms; eventos vistos até agora: ${devlogEvents.length})`);
  const sawNoSkillWarning = devlogEvents.some((e) => e.type === "no_skills_for_role" && e.account === ACCOUNT);
  console.log("viu aviso 'no_skills_for_role'?", sawNoSkillWarning ? "SIM" : "NAO (falhou)");
  console.log("loop crashou?", loopCrashed ? "SIM (ERRO!)" : "NAO (continuou rodando, ok)");

  console.log("\n--- 8: ciclo completo com skill fake (troca pra miner com 'mining' registrada) ---");
  registerForTest(fakeMiningSkill);
  setRole("miner", null);
  await sleep(6000); // próximo poll do loop recarrega role+skills

  const planCreatedCount1 = devlogEvents.filter((e) => e.type === "plan_created" && e.account === ACCOUNT).length;
  console.log("planner chamado?", plannerCalls > 0 ? "SIM" : "NAO (falhou)");
  console.log("'plan_created' no devlog?", planCreatedCount1 > 0 ? "SIM" : "NAO (falhou)");
  console.log("executor chamado várias vezes (plano ativo mantido)?", executorCalls > 1 ? "SIM" : "NAO");

  console.log("\n--- 9: replanejamento (invalidated) ---");
  const plannerCallsBefore = plannerCalls;
  executorScript.push({ status: "invalidated", reason: "teste manual de replanejamento" });
  await sleep(1000);
  const sawInvalidated = devlogEvents.some((e) => e.type === "plan_invalidated" && e.account === ACCOUNT);
  console.log("'plan_invalidated' no devlog?", sawInvalidated ? "SIM" : "NAO (falhou)");
  console.log("planner foi chamado de novo depois (replanejou)?", plannerCalls > plannerCallsBefore ? "SIM" : "NAO (falhou)");

  console.log("\n--- 10: erro não derruba o loop ---");
  executorScript.push({ status: "error", code: "teste_manual", message: "erro de teste deliberado" });
  await sleep(1000);
  const sawError = devlogEvents.some(
    (e) => e.type === "skill_error" && e.account === ACCOUNT && (e.payload as any)?.code === "teste_manual"
  );
  console.log("'skill_error' no devlog?", sawError ? "SIM" : "NAO (falhou)");

  await sleep(500);
  const executorCallsBeforeRecovery = executorCalls;
  await sleep(1500);
  console.log(
    "executor continuou sendo chamado depois do erro (loop seguiu vivo)?",
    executorCalls > executorCallsBeforeRecovery ? "SIM" : "NAO (falhou)"
  );
} finally {
  unregisterForTest("mining");
  writeFileSync(ROLES_PATH, originalRolesFile);
  console.log(`\nroles.json restaurado (${ACCOUNT}: ${JSON.stringify(originalEntry)})`);
  rawListener.close();
  listener.close();
  server.close(); // não espera -- process.exit abaixo encerra tudo de qualquer forma
  process.exit(0);
}
