// Validação manual do painel "ao vivo" da spec 0012: sobe devlog server + directives
// server de verdade (portas de teste, pra não brigar com instâncias reais), conecta no
// /live como um navegador conectaria (credencial via query string), emite um evento via
// createDevlogClient, e confirma que chega no feed. Roda e sai sozinho -- não fica de pé.
import { createDevlogClient } from "../app/devlog/client.js";
import { startDevlogServer } from "../app/devlog/server.js";
import { startDirectivesServer } from "../app/directives/server.js";

const HTTP_PORT = 15999;
const DEVLOG_PORT = 17999;

process.env.DIRECTIVES_USER = "validacao";
process.env.DIRECTIVES_PASS = "validacao123";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const devlog = startDevlogServer(DEVLOG_PORT);
  const directives = startDirectivesServer(HTTP_PORT, { devlogPort: DEVLOG_PORT });
  await sleep(300); // tempo do directives server conectar no devlog interno

  const received: unknown[] = [];
  const liveSocket = new WebSocket(
    `ws://localhost:${HTTP_PORT}/live?user=validacao&pass=validacao123`
  );
  await new Promise((resolve) => liveSocket.addEventListener("open", resolve));
  liveSocket.addEventListener("message", (ev) => received.push(JSON.parse(String(ev.data))));
  console.log("[1/3] /live conectado com credencial válida.");

  const emitter = createDevlogClient("hillebot-fake", { port: DEVLOG_PORT });
  // O primeiro emit() dispara a conexão (lazy) mas quase certamente se perde -- o cliente
  // só manda se já estiver conectado, "fogo e esqueça". Mesmo padrão de devlog.test.ts.
  emitter.emit({ type: "warmup", level: "info" });
  await sleep(300);
  emitter.emit({ type: "mining_yield", level: "info", payload: { ore: 12 } });
  await sleep(500);

  const got = received.find((e) => (e as { type: string }).type === "mining_yield");
  console.log(got ? "[2/3] evento chegou no feed ao vivo: OK" : "[2/3] FALHOU: evento não chegou");

  const wrongAuthSocket = new WebSocket(`ws://localhost:${HTTP_PORT}/live?user=errado&pass=errado`);
  const rejected = await Promise.race([
    new Promise<boolean>((resolve) => {
      wrongAuthSocket.addEventListener("open", () => resolve(false));
      wrongAuthSocket.addEventListener("error", () => resolve(true));
      wrongAuthSocket.addEventListener("close", () => resolve(true));
    }),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1000)),
  ]);
  console.log(rejected ? "[3/3] credencial errada rejeitada: OK" : "[3/3] FALHOU: abriu sem credencial válida");

  liveSocket.close();
  wrongAuthSocket.close();
  emitter.close();
  directives.close();
  await devlog.close();
}

main()
  .then(() => {
    console.log("validação concluída.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("erro na validação:", err);
    process.exit(1);
  });
