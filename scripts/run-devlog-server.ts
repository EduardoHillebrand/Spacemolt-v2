// Entrypoint standalone pro processo do devlog server (spec 0005, task 6 — entrada no PM2).
// server.ts só exporta a função; este script é o que de fato fica de pé.
import { DEVLOG_PORT, startDevlogServer } from "../app/devlog/server.js";

startDevlogServer();
console.log(`devlog server rodando na porta ${DEVLOG_PORT}`);
