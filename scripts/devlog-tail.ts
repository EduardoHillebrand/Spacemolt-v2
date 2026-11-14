// Assinante de teste do canal de devlog (spec 0005) — valida o canal sozinho, sem precisar
// da UI do dashboard (0012) existir.
//
// Uso: node scripts/devlog-tail.ts [--account <nome>]
import { DEVLOG_PORT } from "../app/devlog/server.js";
import { hasRequiredFields } from "../app/devlog/event.js";

const args = process.argv.slice(2);
const accountIdx = args.indexOf("--account");
const accountFilter = accountIdx !== -1 ? args[accountIdx + 1] : undefined;

const ws = new WebSocket(`ws://localhost:${DEVLOG_PORT}`);

ws.addEventListener("open", () => {
  console.log(`conectado ao devlog (porta ${DEVLOG_PORT})${accountFilter ? `, filtrando conta=${accountFilter}` : ""}`);
});

ws.addEventListener("message", (ev) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(ev.data));
  } catch {
    return;
  }
  if (!hasRequiredFields(parsed)) return;
  if (accountFilter && parsed.account !== accountFilter) return;

  console.log(`[${parsed.timestamp}] [${parsed.level}] [${parsed.account}] ${parsed.type}`, parsed.payload ?? "");
});

ws.addEventListener("error", () => {
  console.error(`não foi possível conectar ao devlog na porta ${DEVLOG_PORT} -- o servidor está de pé?`);
});

ws.addEventListener("close", () => {
  console.log("conexão com o devlog encerrada");
});
