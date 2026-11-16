import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { startDirectivesServer } from "./server.js";

const TEST_PORT = 15001; // longe das portas já usadas por devlog (7788/17788/17789)
const ACCOUNTS_DIR = "accounts.directive-server.test";
const ROLES_PATH = "roles.directive-server.test.json";
const ACCOUNT = "testacct";
const BASE_URL = `http://localhost:${TEST_PORT}`;

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
