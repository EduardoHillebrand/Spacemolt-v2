// Usado por todo processo de conta pra emitir eventos (spec 0005). emit() nunca bloqueia
// nem lança exceção — se o servidor não existir, é um no-op de custo quase zero.
import { DEVLOG_PORT } from "./server.js";
import { scrub, type DevlogEvent, type Level } from "./event.js";

export interface DevlogClient {
  emit(event: { type: string; level: Level; payload?: unknown }): void;
  close(): void;
}

interface ClientOptions {
  port?: number;
  /** Intervalo mínimo entre tentativas de reconexão. Default 30s (plan.md). */
  reconnectIntervalMs?: number;
}

export function createDevlogClient(accountName: string, options?: ClientOptions): DevlogClient {
  const port = options?.port ?? DEVLOG_PORT;
  const reconnectIntervalMs = options?.reconnectIntervalMs ?? 30_000;

  let socket: WebSocket | null = null;
  let lastConnectAttempt = 0;
  let closed = false;

  function tryConnect(): void {
    if (closed || socket !== null) return;
    const now = Date.now();
    if (now - lastConnectAttempt < reconnectIntervalMs) return;
    lastConnectAttempt = now;

    try {
      const ws = new WebSocket(`ws://localhost:${port}`);
      ws.addEventListener("open", () => {
        // close() pode ter sido chamado enquanto esta conexão ainda estava em voo --
        // sem essa checagem, um socket que só termina de abrir depois do close() nunca
        // seria fechado, ficando pendente pra sempre (handle que nunca deixa o processo
        // terminar sozinho). Descoberto implementando o subscriber de devlog (spec 0012).
        if (closed) {
          ws.close();
          return;
        }
        socket = ws;
      });
      ws.addEventListener("close", () => {
        socket = null;
      });
      ws.addEventListener("error", () => {
        socket = null;
      });
    } catch {
      // servidor fora do ar -- emit() segue como no-op até a próxima tentativa.
    }
  }

  return {
    emit(event) {
      if (closed) return;
      tryConnect();
      if (socket === null || socket.readyState !== WebSocket.OPEN) return;

      const fullEvent: DevlogEvent = {
        type: event.type,
        level: event.level,
        account: accountName,
        timestamp: new Date().toISOString(),
        payload: event.payload !== undefined ? scrub(event.payload) : undefined,
      };

      try {
        socket.send(JSON.stringify(fullEvent));
      } catch {
        // nunca propaga erro de envio pra quem chamou (requisito 2 da spec).
      }
    },
    close() {
      closed = true;
      socket?.close();
      socket = null;
    },
  };
}
