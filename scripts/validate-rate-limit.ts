// Validação manual (tasks.md, item 10): dispara chamadas em sequência rápida numa conta e
// confirma que as respostas chegam certas, só mais lentas, sem erro não tratado.
import { connect } from "../app/game_client.js";

const session = await connect("hillebot");

const N = 40;
console.log(`disparando ${N} chamadas get_status em paralelo...`);
const t0 = Date.now();

const results = await Promise.all(
  Array.from({ length: N }, () => session.call("spacemolt", "get_status"))
);

const elapsed = Date.now() - t0;
const ok = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

console.log(`concluido em ${elapsed}ms`);
console.log(`ok: ${ok}/${N}`);
if (failed.length > 0) {
  console.log("falhas (esperado: nenhuma, so rate_limited deveria ter sido absorvido):");
  for (const f of failed) console.log("  ", f);
} else {
  console.log("nenhuma falha -- rate limit (se ocorreu) foi absorvido corretamente");
}

process.exit(failed.length > 0 ? 1 : 0);
