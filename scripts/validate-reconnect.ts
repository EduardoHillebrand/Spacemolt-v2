// Validação manual (tasks.md, item 9): força uma queda de conexão NÃO deliberada (fecha o
// WebSocket cru direto, sem passar por account.close()) e confirma que a lib reautentica
// sozinha e que uma chamada seguinte funciona sem reiniciar o processo.
import { readFileSync } from "node:fs";
import { Account } from "@spacemolt/lib";

const creds = JSON.parse(readFileSync("accounts/hillebot/credentials.json", "utf-8")) as {
  username: string;
  password: string;
};

const wsRef: { current: WebSocket | undefined } = { current: undefined };

const account = new Account({
  url: "wss://game.spacemolt.com/ws/v2",
  reconnect: true,
  credentials: () => ({ kind: "login" as const, username: creds.username, password: creds.password }),
  webSocketFactory: (url: string) => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    return ws;
  },
});

account.on("reconnected", () => console.log(">>> evento 'reconnected' recebido"));

await account.connect();
await account.login({ username: creds.username, password: creds.password });
console.log("1) login OK, credits:", account.credits);

console.log("2) forcando fechamento anormal do socket cru (sem account.close())...");
wsRef.current?.close();

await new Promise((resolve) => setTimeout(resolve, 5000));

console.log("3) chamando get_status apos a queda, sem reiniciar o processo...");
const status = await account.commands.spacemolt.get_status();
console.log("   get_status OK, keys:", Object.keys(status.structuredContent ?? {}));

account.close();
console.log("validacao concluida");
