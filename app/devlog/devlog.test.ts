import assert from "node:assert/strict";
import { test } from "node:test";
import { createDevlogClient } from "./client.js";
import { startDevlogServer } from "./server.js";

const TEST_PORT = 17788; // porta diferente da real (7788), pra não colidir
const UNUSED_PORT = 17789; // porta sem servidor nenhum, de propósito

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("emit() nunca lança nem bloqueia mesmo sem servidor nenhum", async () => {
  const client = createDevlogClient("conta-fantasma", { port: UNUSED_PORT });
  assert.doesNotThrow(() => {
    client.emit({ type: "algo", level: "info" });
    client.emit({ type: "outra_coisa", level: "error", payload: { x: 1 } });
  });
  client.close();
});

test("fan-out: um cliente recebe o evento do outro, mas não o próprio", async () => {
  const server = startDevlogServer(TEST_PORT);
  try {
    const received: { to: string; event: unknown }[] = [];

    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
    await new Promise((resolve) => ws.addEventListener("open", resolve));
    ws.addEventListener("message", (ev) => received.push({ to: "raw-listener", event: JSON.parse(String(ev.data)) }));

    const clientA = createDevlogClient("conta-a", { port: TEST_PORT });
    const clientB = createDevlogClient("conta-b", { port: TEST_PORT });

    clientA.emit({ type: "warmup", level: "info" });
    clientB.emit({ type: "warmup", level: "info" });
    await sleep(300); // tempo pra conectar e o primeiro emit (que dispara o connect) valer

    clientA.emit({ type: "mineracao_concluida", level: "info", payload: { ore: 10 } });
    await sleep(200);

    const got = received.find((r) => (r.event as { type: string }).type === "mineracao_concluida");
    assert.ok(got, "o listener cru deveria ter recebido o evento de A");
    assert.equal((got!.event as { account: string }).account, "conta-a");

    ws.close();
    clientA.close();
    clientB.close();
  } finally {
    await server.close();
  }
});

test("evento malformado é descartado, não propagado", async () => {
  const server = startDevlogServer(TEST_PORT + 1);
  try {
    const received: unknown[] = [];
    const listener = new WebSocket(`ws://localhost:${TEST_PORT + 1}`);
    await new Promise((resolve) => listener.addEventListener("open", resolve));
    listener.addEventListener("message", (ev) => received.push(JSON.parse(String(ev.data))));

    const sender = new WebSocket(`ws://localhost:${TEST_PORT + 1}`);
    await new Promise((resolve) => sender.addEventListener("open", resolve));

    sender.send(JSON.stringify({ type: "sem_os_outros_campos" })); // malformado
    sender.send("isso nem é JSON");
    await sleep(200);

    assert.equal(received.length, 0, "nenhum evento malformado deveria ter sido repassado");

    listener.close();
    sender.close();
  } finally {
    await server.close();
  }
});
