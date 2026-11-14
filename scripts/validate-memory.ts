// Validação manual (0003-memory, tasks 7-9): persistência, relevância semântica e
// isolamento entre contas, usando o Ollama real (nomic-embed-text).
import { mkdirSync, rmSync } from "node:fs";
import { list, recall, remember } from "../app/memory/long_term_memory.js";

const A = "_validation_test_a";
const B = "_validation_test_b";
mkdirSync(`accounts/${A}`, { recursive: true });
mkdirSync(`accounts/${B}`, { recursive: true });

console.log("--- 7: persistência (registra, e 'relê' como se fosse um processo novo) ---");
await remember(A, "A rota entre Sol e Sirius costuma ter piratas da facção Crimson.");
const afterRemember = list(A);
console.log("entradas depois do remember:", afterRemember.length);
// "reiniciar o processo" == só ler de novo do disco, sem reusar nada em memória:
const rereadEntries = list(A);
console.log("entradas relendo do disco:", rereadEntries.length, "-", rereadEntries[0]?.text);

console.log("\n--- 8: relevância (pergunta com palavras diferentes do texto original) ---");
const results = await recall(A, "quais perigos existem no caminho até Sirius?", 3);
console.log("top resultado:", results[0]?.text);
console.log("relevante?", results[0]?.text.includes("Crimson") ? "SIM" : "NAO (falhou)");

console.log("\n--- 9: isolamento entre contas ---");
await remember(B, "Esse NPC de Nebula paga muito mal, evitar vender lá.");
const recallFromA = await recall(A, "NPC que paga mal");
const leaked = recallFromA.some((e) => e.text.includes("Nebula"));
console.log("lição da conta B apareceu no recall da conta A?", leaked ? "SIM (ERRO!)" : "NAO (isolado, OK)");

rmSync(`accounts/${A}`, { recursive: true, force: true });
rmSync(`accounts/${B}`, { recursive: true, force: true });
console.log("\nvalidação concluída, contas de teste removidas");
