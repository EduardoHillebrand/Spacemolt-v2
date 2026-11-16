// Consome todos os eventos do canal de devlog (spec 0005) -- pra quem só observa (servidor
// de diretriz, spec 0012; futuro dashboard, 0013), nunca pra quem também participa como
// conta de jogo (essas usam client.ts/emit()). Reconecta com backoff fixo e curto -- quem
// só escuta quer voltar rápido depois de uma queda, ao contrário do emissor (client.ts),
// que pode esperar mais sem perder nada crítico.
import { DEVLOG_PORT } from "./server.js";
import { hasRequiredFields, type DevlogEvent } from "./event.js";

export interface DevlogSubscriber {
  close(): void;
}

interface SubscriberOptions {
  port?: number;
  reconnectIntervalMs?: number;
}

export function createDevlogSubscriber(
  onEvent: (event: DevlogEvent) => void,
  options?: SubscriberOptions
): DevlogSubscriber {
  const port = options?.port ?? DEVLOG_PORT;
  const reconnectIntervalMs = options?.reconnectIntervalMs ?? 5_000;

  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect(): void {
    if (closed) return;
    try {
      const ws = new WebSocket(`ws://localhost:${port}`);
      ws.addEventListener("open", () => {
        // Mesma corrida do app/devlog/client.ts: close() pode ter sido chamado enquanto
        // esta conexão ainda estava em voo -- sem checar `closed` aqui, o socket nunca
        // seria fechado, ficando pendente pra sempre (é exatamente isso que travava os
        // testes deste arquivo até esta correção).
        if (closed) {
          ws.close();
          return;
        }
        socket = ws;
      });
      ws.addEventListener("message", (ev) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(ev.data));
        } catch {
          return; // mensagem malformada -- nunca derruba o consumidor
        }
        if (hasRequiredFields(parsed)) onEvent(parsed);
      });
      ws.addEventListener("close", scheduleReconnect);
      ws.addEventListener("error", scheduleReconnect);
    } catch {
      scheduleReconnect();
    }
  }

  function scheduleReconnect(): void {
    socket = null;
    if (closed || reconnectTimer !== null) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectIntervalMs);
  }

  connect();

  return {
    close() {
      closed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
    },
  };
}
