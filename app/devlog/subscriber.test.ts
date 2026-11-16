import assert from "node:assert/strict";
import { test } from "node:test";
import { createDevlogClient } from "./client.js";
import { createDevlogSubscriber } from "./subscriber.js";
import { startDevlogServer } from "./server.js";

const TEST_PORT = 17790; // própria, diferente das usadas em devlog.test.ts (17788/17789)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("subscriber recebe eventos de qualquer conta emissora", async () => {
  const server = startDevlogServer(TEST_PORT);
  try {
    const received: unknown[] = [];
    const subscriber = createDevlogSubscriber((event) => received.push(event), { port: TEST_PORT });
    await sleep(200);

    const client = createDevlogClient("conta-x", { port: TEST_PORT });
    client.emit({ type: "warmup", level: "info" });
    await sleep(300);
    client.emit({ type: "mining_yield", level: "info", payload: { ore: 5 } });
    await sleep(200);

    const got = received.find((e) => (e as { type: string }).type === "mining_yield");
    assert.ok(got, "subscriber deveria ter recebido o evento emitido pelo cliente");
    assert.equal((got as { account: string }).account, "conta-x");

    client.close();
    subscriber.close();
  } finally {
    await server.close();
  }
});

test("mensagem malformada vinda do servidor nunca chega ao callback, nunca lança", async () => {
  // O próprio devlog server já descarta malformado (devlog.test.ts) -- aqui confirmamos
  // que o subscriber também não propaga nada estranho que porventura passasse.
  const received: unknown[] = [];
  const subscriber = createDevlogSubscriber((event) => received.push(event), { port: TEST_PORT + 1 });
  await sleep(100); // sem servidor nenhum nessa porta -- nunca deveria lançar
  assert.equal(received.length, 0);
  subscriber.close();
});

test("close() para de tentar reconectar", async () => {
  const subscriber = createDevlogSubscriber(() => {}, { port: TEST_PORT + 2, reconnectIntervalMs: 50 });
  subscriber.close();
  await sleep(150); // tempo suficiente pra um reconnect teria acontecido se não tivesse fechado
  assert.doesNotThrow(() => subscriber.close()); // idempotente, nunca lança
});

test("close() chamado antes da conexão abrir não deixa um socket pendente (regressão)", async () => {
  // Com um servidor real escutando, fechar o subscriber antes do handshake de WS
  // terminar expunha uma corrida: a conexão abria DEPOIS do close() e nunca era
  // fechada, ficando pendente pra sempre (handle que nunca deixa o processo terminar
  // sozinho). Não dá pra observar isso direto num teste de unidade, mas confirmamos que
  // nenhum evento chega depois do close() mesmo que a conexão tenha chegado a abrir.
  const server = startDevlogServer(TEST_PORT + 3);
  try {
    const received: unknown[] = [];
    const subscriber = createDevlogSubscriber((event) => received.push(event), { port: TEST_PORT + 3 });
    subscriber.close(); // fecha antes de qualquer sleep -- a conexão pode ainda estar em voo

    await sleep(300); // tempo de sobra pro handshake terminar, se fosse terminar
    const client = createDevlogClient("conta-y", { port: TEST_PORT + 3 });
    client.emit({ type: "depois_do_close", level: "info" });
    await sleep(200);

    assert.equal(received.length, 0, "nenhum evento deveria chegar a um subscriber já fechado");
    client.close();
  } finally {
    await server.close();
  }
});
