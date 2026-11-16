import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { createDevlogClient } from "../devlog/client.js";
import { startDevlogServer } from "../devlog/server.js";
import { startDirectivesServer } from "./server.js";

const TEST_PORT = 15001; // longe das portas já usadas por devlog (7788/17788/17789)
// node --test roda arquivos de teste em paralelo (processos separados, mas portas são
// globais do SO) -- 17800 fica fora da faixa 17788-17793 já usada por devlog.test.ts e
// subscriber.test.ts, pra nunca colidir mesmo com os dois rodando ao mesmo tempo.
const TEST_DEVLOG_PORT = 17800;
const ACCOUNTS_DIR = "accounts.directive-server.test";
const ROLES_PATH = "roles.directive-server.test.json";
const ACCOUNT = "testacct";
const BASE_URL = `http://localhost:${TEST_PORT}`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ORIGINAL_USER = process.env.DIRECTIVES_USER;
const ORIGINAL_PASS = process.env.DIRECTIVES_PASS;

function setup(): void {
  rmSync(ACCOUNTS_DIR, { recursive: true, force: true });
  mkdirSync(`${ACCOUNTS_DIR}/${ACCOUNT}`, { recursive: true });
  writeFileSync(ROLES_PATH, JSON.stringify({ [ACCOUNT]: { current: "miner", intended: null } }));
  process.env.DIRECTIVES_USER = "op";
  process.env.DIRECTIVES_PASS = "s3cret";
}

function teardown(): void {
  rmSync(ACCOUNTS_DIR, { recursive: true, force: true });
  rmSync(ROLES_PATH, { force: true });
  if (ORIGINAL_USER === undefined) delete process.env.DIRECTIVES_USER;
  else process.env.DIRECTIVES_USER = ORIGINAL_USER;
  if (ORIGINAL_PASS === undefined) delete process.env.DIRECTIVES_PASS;
  else process.env.DIRECTIVES_PASS = ORIGINAL_PASS;
}

function authHeader(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

test("GET /api/accounts é público, lista contas de roles.json sem exigir auth", async () => {
  setup();
  const handle = startDirectivesServer(TEST_PORT, { accountsDir: ACCOUNTS_DIR, rolesPath: ROLES_PATH });
  try {
    const resp = await fetch(`${BASE_URL}/api/accounts`);
    assert.equal(resp.status, 200);
    const accounts = await resp.json();
    assert.ok(accounts.some((a: { name: string; role: string }) => a.name === ACCOUNT && a.role === "miner"));
  } finally {
    handle.close();
    teardown();
  }
});

test("GET /api/directive/:account sem credencial devolve 401, nunca expõe a diretiva", async () => {
  setup();
  const handle = startDirectivesServer(TEST_PORT, { accountsDir: ACCOUNTS_DIR, rolesPath: ROLES_PATH });
  try {
    const resp = await fetch(`${BASE_URL}/api/directive/${ACCOUNT}`);
    assert.equal(resp.status, 401);
  } finally {
    handle.close();
    teardown();
  }
});

test("GET /api/directive/:account com credencial errada devolve 401", async () => {
  setup();
  const handle = startDirectivesServer(TEST_PORT, { accountsDir: ACCOUNTS_DIR, rolesPath: ROLES_PATH });
  try {
    const resp = await fetch(`${BASE_URL}/api/directive/${ACCOUNT}`, {
      headers: { Authorization: authHeader("op", "senha-errada") },
    });
    assert.equal(resp.status, 401);
  } finally {
    handle.close();
    teardown();
  }
});

test("sem DIRECTIVES_USER/PASS configuradas, recusa sempre -- nunca abre em aberto", async () => {
  setup();
  delete process.env.DIRECTIVES_USER;
  delete process.env.DIRECTIVES_PASS;
  const handle = startDirectivesServer(TEST_PORT, { accountsDir: ACCOUNTS_DIR, rolesPath: ROLES_PATH });
  try {
    const resp = await fetch(`${BASE_URL}/api/directive/${ACCOUNT}`, {
      headers: { Authorization: authHeader("qualquer", "coisa") },
    });
    assert.equal(resp.status, 401);
  } finally {
    handle.close();
    teardown();
  }
});

test("GET/POST com credencial certa lê e escreve a diretiva de verdade", async () => {
  setup();
  const handle = startDirectivesServer(TEST_PORT, { accountsDir: ACCOUNTS_DIR, rolesPath: ROLES_PATH });
  try {
    const auth = authHeader("op", "s3cret");

    const initial = await fetch(`${BASE_URL}/api/directive/${ACCOUNT}`, { headers: { Authorization: auth } });
    assert.equal(initial.status, 200);
    assert.deepEqual(await initial.json(), { paused: false, preferences: {}, note: "", updatedAt: "" });

    const postResp = await fetch(`${BASE_URL}/api/directive/${ACCOUNT}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ paused: true, preferences: { mining: { preferredResource: "iron" } } }),
    });
    assert.equal(postResp.status, 200);
    const posted = await postResp.json();
    assert.equal(posted.paused, true);
    assert.deepEqual(posted.preferences, { mining: { preferredResource: "iron" } });

    const after = await fetch(`${BASE_URL}/api/directive/${ACCOUNT}`, { headers: { Authorization: auth } });
    assert.deepEqual(await after.json(), posted);
  } finally {
    handle.close();
    teardown();
  }
});

test("/live sem credencial na query string nunca completa o handshake", async () => {
  setup();
  const handle = startDirectivesServer(TEST_PORT, {
    accountsDir: ACCOUNTS_DIR,
    rolesPath: ROLES_PATH,
    devlogPort: TEST_DEVLOG_PORT,
  });
  try {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/live`);
    const outcome = await Promise.race([
      new Promise<"open" | "error-or-close">((resolve) => {
        ws.addEventListener("open", () => resolve("open"));
        ws.addEventListener("error", () => resolve("error-or-close"));
        ws.addEventListener("close", () => resolve("error-or-close"));
      }),
      // socket.destroy() no servidor fecha a conexão crua antes do handshake de WS
      // terminar -- alguns clientes não disparam error/close de forma confiável nesse
      // caso, então um timeout curto garante que "nunca abriu" também conta como sucesso.
      new Promise<"error-or-close">((resolve) => setTimeout(() => resolve("error-or-close"), 1000)),
    ]);
    assert.equal(outcome, "error-or-close");
    ws.close();
  } finally {
    handle.close();
    teardown();
  }
});

test("/live com credencial certa recebe eventos do devlog em tempo real", async () => {
  setup();
  const devlogServer = startDevlogServer(TEST_DEVLOG_PORT);
  const handle = startDirectivesServer(TEST_PORT, {
    accountsDir: ACCOUNTS_DIR,
    rolesPath: ROLES_PATH,
    devlogPort: TEST_DEVLOG_PORT,
  });
  try {
    const received: unknown[] = [];
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/live?user=op&pass=s3cret`);
    await new Promise((resolve) => ws.addEventListener("open", resolve));
    ws.addEventListener("message", (ev) => received.push(JSON.parse(String(ev.data))));

    await sleep(300); // tempo pro servidor de diretriz conectar no devlog interno

    const emitter = createDevlogClient(`${ACCOUNT}-emitter`, { port: TEST_DEVLOG_PORT });
    emitter.emit({ type: "warmup", level: "info" });
    await sleep(300);
    emitter.emit({ type: "mining_yield", level: "info", payload: { ore: 7 } });
    await sleep(300);

    const got = received.find((e) => (e as { type: string }).type === "mining_yield");
    assert.ok(got, "o feed ao vivo deveria ter recebido o evento vindo do devlog");

    ws.close();
    emitter.close();
  } finally {
    handle.close();
    await devlogServer.close();
    teardown();
  }
});
