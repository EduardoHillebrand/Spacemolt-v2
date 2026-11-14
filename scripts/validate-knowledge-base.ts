// Validação manual (0004, tasks 8-10): relevância, atualização sem código, velocidade.
import { search } from "../app/knowledge/query.js";

console.log("--- 8: relevância (pergunta com palavras diferentes do texto original) ---");
const t0 = Date.now();
const results = await search("quanto custa viajar X saltos com Y combustível?", 3);
console.log(`tempo da busca: ${Date.now() - t0}ms`);
for (const r of results) {
  console.log(`  [${r.source} > ${r.section}] ${r.text.slice(0, 80).replace(/\n/g, " ")}...`);
}
const foundFuel = results.some((r) => /fuel/i.test(r.source) || /combustível|fuel/i.test(r.text));
console.log("achou conteúdo de combustível no top 3?", foundFuel ? "SIM" : "NAO (falhou)");

console.log("\n--- 10: velocidade ---");
const timings: number[] = [];
for (const q of ["como minerar ouro", "o que é uma estação pirata", "como declarar guerra a um império"]) {
  const start = Date.now();
  await search(q, 5);
  timings.push(Date.now() - start);
}
console.log("tempos das 3 buscas (ms):", timings);
console.log("média:", (timings.reduce((a, b) => a + b, 0) / timings.length).toFixed(0), "ms");

process.exit(0);
