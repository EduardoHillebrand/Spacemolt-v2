// O canal em si (spec 0005): processo único e compartilhado (exceção deliberada à
// constituição regra 4 — não guarda estado de jogo de ninguém). Fan-out simétrico: todo
// cliente conectado recebe o que qualquer outro cliente publica. Sem histórico (requisito
// 5) — só repassa enquanto alguém está ouvindo.
import { WebSocketServer, type WebSocket } from "ws";
import { hasRequiredFields } from "./event.js";

export const DEVLOG_PORT = 7788;

export interface DevlogServerHandle {
  close(): Promise<void>;
}

export function startDevlogServer(port: number = DEVLOG_PORT): DevlogServerHandle {
  const wss = new WebSocketServer({ port });
  const clients = new Set<WebSocket>();

  wss.on("connection", (socket) => {
    clients.add(socket);

    socket.on("message", (data) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        console.warn("[devlog] mensagem não-JSON descartada");
        return;
      }

      if (!hasRequiredFields(parsed)) {
        console.warn("[devlog] evento sem os campos obrigatórios descartado");
        return;
      }

      const serialized = JSON.stringify(parsed);
      for (const other of clients) {
        if (other !== socket && other.readyState === other.OPEN) {
          other.send(serialized);
        }
      }
    });

    socket.on("close", () => clients.delete(socket));
  });

  return {
    close: () =>
      new Promise((resolve) => {
        wss.close(() => resolve());
      }),
  };
}
