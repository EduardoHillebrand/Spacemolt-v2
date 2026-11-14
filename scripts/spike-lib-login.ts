// Spike descartável — valida as suposições do plan.md da 0001-connection-layer antes de
// construir a abstração em cima. Não faz parte do runtime do agente.
import { readFileSync } from "node:fs";
import { Account } from "@spacemolt/lib";

const accountName = process.argv[2] ?? "hillebot";
const creds = JSON.parse(
  readFileSync(`accounts/${accountName}/credentials.json`, "utf-8")
) as { username: string; password: string };

const account = new Account({ url: "wss://game.spacemolt.com/ws/v2" });
await account.connect();
await account.login({ username: creds.username, password: creds.password });

console.log("login OK");
console.log("credits:", account.credits);
console.log("ship class:", account.ship?.class_id);
console.log("location:", account.location);

console.log("\n--- testando query (get_status) ---");
const status = await account.commands.spacemolt.get_status();
console.log("get_status structuredContent keys:", Object.keys(status.structuredContent ?? {}));

console.log("\n--- testando erro de comando (ação impossível no estado atual) ---");
try {
  // undock enquanto já undocked (ou outra ação invalida) deve rejeitar com SpacemoltError
  await account.commands.spacemolt.dock({ id: "___invalido___" });
  console.log("comando inválido NÃO rejeitou (inesperado)");
} catch (err) {
  console.log("erro capturado, tipo:", err?.constructor?.name);
  console.log("code:", (err as any).code);
  console.log("message:", (err as any).message);
}

account.close();
console.log("\nspike concluído");
