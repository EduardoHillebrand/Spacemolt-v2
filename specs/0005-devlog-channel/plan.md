# 0005 — Devlog Channel — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. WebSocket puro (`ws` ou o suporte nativo do
Node, a decidir na implementação) — sem dependência de broker de mensagens (Redis, etc.):
na escala de poucas contas e um dashboard, isso seria infraestrutura demais pro problema.

Padrão já validado no projeto anterior (`spacemolt-gateway`): canal de log via WebSocket,
fan-out pra múltiplos assinantes, zero custo sem cliente conectado.

## Arquitetura

```
app/
  devlog/
    server.ts       # processo único, standalone — o canal em si
    client.ts        # usado por TODO processo de conta pra emitir eventos
    event.ts          # tipo DevlogEvent + scrub()
scripts/
  devlog-tail.ts      # CLI mínimo: conecta e imprime eventos, pra debug manual
```

### `event.ts` — o envelope e a limpeza de segredos

```ts
type Level = "info" | "warning" | "error";

type DevlogEvent = {
  type: string;        // ex.: "command_executed", "decision_made", "error"
  account: string;      // preenchido automaticamente pelo client, nunca pelo chamador
  level: Level;
  timestamp: string;    // ISO 8601
  payload?: unknown;    // livre, mas passa por scrub() antes de sair
};

function scrub(value: unknown): unknown;
```

`scrub()` percorre o payload recursivamente e redige (`"[REDACTED]"`) qualquer campo cuja
chave bata com `/password|token|secret|credential/i`, em qualquer profundidade. Roda **em
todo** evento, sem exceção, dentro do próprio `client.ts` — é assim que o requisito 6 da
spec (nenhum dado sensível passa) fica garantido pelo código, não só por convenção de quem
chama `emit()`.

### `server.ts` — o canal em si

Processo **único e compartilhado** (não é por conta, ao contrário de `game_client` — spec
`0001`), rodando como seu próprio processo PM2. WebSocket na porta `7788` (mesma convenção
do projeto anterior). Protocolo simétrico e simples: qualquer cliente conectado pode mandar
um `DevlogEvent`; o servidor repassa (fan-out) pra todos os **outros** clientes conectados.
Não guarda nada em disco, não mantém histórico (requisito 5) — só repassa enquanto alguém
está ouvindo.

Validação mínima no servidor: evento sem os campos obrigatórios do envelope é descartado
(log local no próprio servidor, não propagado) — defesa extra, já que `client.ts` é quem
deveria estar garantindo isso antes de mandar.

### `client.ts` — usado por todo processo de conta

```ts
function emit(event: { type: string; level: Level; payload?: unknown }): void;
```

- Preenche `account` (lido da config do processo, nunca passado por quem chama — requisito
  1/4) e `timestamp` automaticamente, aplica `scrub()`, e manda pro `server.ts`.
- **Síncrono do ponto de vista de quem chama**: `emit()` nunca bloqueia nem lança exceção.
  Por dentro, mantém uma conexão WebSocket ao `server.ts` e tenta reconectar em segundo
  plano com backoff (no máximo 1 tentativa a cada 30s) se cair — sem fila de eventos
  perdidos durante a queda, eles são simplesmente descartados (requisito 2: nunca atrasa ou
  trava quem publica; requisito 5: o canal não é histórico).
- Se o `server.ts` nunca esteve de pé (ex.: ainda não implementado/rodando), `emit()` é
  efetivamente um no-op de custo quase zero — qualquer feature pode chamar `emit()` desde já
  sem se preocupar se o canal já existe.

### `scripts/devlog-tail.ts`

CLI mínimo (`node scripts/devlog-tail.ts [--account <nome>]`) que conecta no `server.ts` e
imprime os eventos recebidos no terminal, com filtro opcional por conta. É o "assinante de
teste" — a `0012-dashboard-ui` vai construir seu próprio consumidor depois, mas este CLI já
serve pra validar o canal sozinho, sem depender da UI existir.

## Processo (constituição, regra 4 — mas este é a exceção deliberada)

Único processo compartilhado entre todas as contas, gerenciado pelo PM2 junto dos processos
por conta. Não viola a regra 4 (que é sobre isolamento de *estado de jogo* por conta) — este
canal não guarda estado de nenhuma conta, só repassa mensagem.

## O que NÃO entra aqui

- Exposição externa (internet, dashboard mobile) — fica pra `0012-dashboard-ui`, que decide
  como (e se) conectar isso ao túnel Cloudflare existente com segurança.
- Persistência de eventos — se vier a existir, outra spec.
- Autenticação de quem conecta — hoje é só `localhost`, sem necessidade.

## Riscos assumidos

- Ponto único de falha (um processo só) é aceitável *de propósito*: se cair, o requisito 2
  garante que nada mais para — só se perde observabilidade temporariamente, nunca o
  funcionamento do agente.
- Sem fila/replay: quem se conecta tarde não vê eventos passados. Aceitável porque o
  objetivo é observar o "agora", não auditoria histórica (isso seria outra spec).

## Alternativas consideradas e descartadas

- **Arquivo de log compartilhado + tail**: mais simples, mas não dá fan-out em tempo real
  nativo pra múltiplos assinantes remotos (dashboard mobile), e mistura "log pra humano ler"
  com "evento estruturado pra máquina consumir".
- **Broker de mensagens dedicado** (Redis pub/sub, etc.): resolve escala que este projeto
  não tem — mais uma peça de infra pra manter rodando, sem ganho real pro volume esperado
  (poucas contas, um dashboard).
