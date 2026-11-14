// Validação manual (0005, tasks 7-9): fan-out entre contas, resiliência sem ouvinte, e
// segredo nunca passa — contra o servidor/porta de produção (7788).
import { spawn } from "node:child_process";
import { createDevlogClient } from "../app/devlog/client.js";
import { startDevlogServer } from "../app/devlog/server.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const server = startDevlogServer();
console.log("servidor devlog de pé na porta 7788");

console.log("\n--- 7: fan-out, iniciando devlog-tail.ts como processo separado ---");
const tail = spawn("node", ["--import", "tsx", "scripts/devlog-tail.ts"], { stdio: "pipe" });
let tailOutput = "";
tail.stdout.on("data", (chunk) => {
  tailOutput += chunk.toString();
});

await sleep(500);

const accountX = createDevlogClient("conta-x");
const accountY = createDevlogClient("conta-y");
accountX.emit({ type: "warmup", level: "info" });
accountY.emit({ type: "warmup", level: "info" });
await sleep(500);

accountX.emit({ type: "mineracao", level: "info", payload: { ore: 42 } });
accountY.emit({ type: "venda", level: "info", payload: { credits: 1000 } });
await sleep(500);

console.log("saída do devlog-tail.ts (deveria ter as duas contas):");
console.log(tailOutput);
const sawX = tailOutput.includes("conta-x") && tailOutput.includes("mineracao");
const sawY = tailOutput.includes("conta-y") && tailOutput.includes("venda");
console.log("viu evento de conta-x?", sawX ? "SIM" : "NAO (falhou)");
console.log("viu evento de conta-y?", sawY ? "SIM" : "NAO (falhou)");

console.log("\n--- 9: segredo nunca passa ---");
tailOutput = "";
accountX.emit({ type: "login_tentativa", level: "info", payload: { username: "hillebot", password: "segredo123" } });
await sleep(500);
console.log("saída do devlog-tail.ts pro evento com password:");
console.log(tailOutput);
const leaked = tailOutput.includes("segredo123");
const redacted = tailOutput.includes("[REDACTED]");
console.log("senha apareceu em texto puro?", leaked ? "SIM (ERRO GRAVE!)" : "NAO (ok)");
console.log("campo veio redigido?", redacted ? "SIM" : "NAO (inesperado)");

console.log("\n--- 8: resiliência -- matando o devlog-tail.ts (ninguém ouvindo) ---");
tail.kill();
await sleep(300);

let threw = false;
try {
  accountX.emit({ type: "depois_do_tail_morrer", level: "info" });
  accountY.emit({ type: "depois_do_tail_morrer", level: "info" });
} catch {
  threw = true;
}
console.log("emit() lançou erro depois do listener morrer?", threw ? "SIM (ERRO!)" : "NAO (ok, continuou rodando)");

accountX.close();
accountY.close();
await server.close();
console.log("\nvalidação concluída");
process.exit(0);
