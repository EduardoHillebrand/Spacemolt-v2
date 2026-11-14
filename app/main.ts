// Entrypoint do processo de uma conta (spec 0006) — trivial de propósito, é só o que o
// PM2 chama (um processo por conta, constituição regra 4). Toda a substância fica em
// loop/run_account_loop.ts.
import { runAccountLoop } from "./loop/run_account_loop.js";

const accountName = process.argv[2] ?? process.env.ACCOUNT_NAME;

if (!accountName) {
  console.error("Uso: node app/main.ts <conta>  (ou defina a variável de ambiente ACCOUNT_NAME)");
  process.exit(1);
}

runAccountLoop(accountName).catch((err) => {
  console.error(`runAccountLoop falhou pra conta "${accountName}":`, err);
  process.exit(1);
});
