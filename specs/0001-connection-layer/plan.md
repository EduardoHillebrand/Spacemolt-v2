# 0001 — Connection Layer — Plan

## Stack

- **TypeScript / Node.js** — runtime de todo o agente (não só desta camada; ver justificativa).
- **`@spacemolt/lib`** (`github.com/SpaceMolt/spacemolt-lib`, WebSocket v2) como base da conexão
  real com o jogo.
- `fetch` nativo do Node pra chamadas HTTP que não passam pela lib (ex.: Decider → Ollama/Claude).

## Por que TypeScript/Node pro projeto todo, não só esta camada

- `@spacemolt/lib` é a lib que a documentação do jogo recomenda pra exatamente nosso caso de
  uso (multi-conta, automação sem supervisão) e já cobre boa parte dos requisitos 2, 5 e 6 da
  spec: reconexão automática com backoff (*close-code-aware*), retry de `rate_limited` em
  mutações, sessão isolada por conta (`Account` própria por conexão), cache de estado em
  memória (que já é "efêmero e reconstruível" — bate com a regra 11 da constituição sem
  esforço extra).
- Jogar esse ganho fora pra reescrever em Python, ou misturar Node (Executor/conexão) com
  Python (Planner/Decider), exigiria uma ponte entre processos — vai contra a simplicidade
  que a constituição pede (regras 4 e 5: sem peso de microserviço).
- Chamadas a Ollama/Claude e qualquer HTTP adicional são triviais em Node (`fetch` nativo) —
  não há perda real em não usar Python aqui. Os scripts Python já escritos neste projeto
  (`scripts/crawl_spacemolt_docs.py`) são ferramentas pontuais, não o runtime do agente, e
  continuam existindo como estão.

## Arquitetura

```
app/
  game_client.ts         # único lugar que importa @spacemolt/lib
  game_client.types.ts   # CommandResult, GameSession — nossos tipos, não os da lib
  rate_limit.ts          # retry/backoff por cima do que a lib não cobrir (queries, HTTP solto)
  errors.ts              # normaliza erro do jogo/lib -> CommandResult (regra 6)
```

- `game_client.ts` expõe uma interface própria, pequena e estável — a única coisa que o
  resto do sistema (Executor, mais pra frente) conhece:
  - `connect(accountName: string): Promise<GameSession>`
  - `GameSession.call(tool: string, action: string, payload: object): Promise<CommandResult>`
  - `GameSession.on(event: string, handler)` — pushes do jogo (chat, scans, combate,
    `player_died`, etc.)
  - `GameSession.initialState` — o que o jogo devolveu no login (nave, posição, créditos,
    carga) — satisfaz o requisito 7 da spec.
- Por dentro, usa `Account` de `@spacemolt/lib` com login por usuário/senha
  (`account.login(username, password)`) — nossas contas são senha, não Clerk, então o
  fluxo `connectOwned`/Clerk da lib não se aplica.
- Credenciais lidas de `accounts/<conta>/credentials.json` só dentro de `game_client.ts`.
  Nenhum outro arquivo do projeto importa `fs` pra ler isso (constituição, regra 12).
- `CommandResult` é tipo nosso:
  ```ts
  type CommandResult =
    | { ok: true; kind: "query"; result: unknown; structuredContent?: unknown }
    | { ok: true; kind: "mutation"; command: string; tick: number; delta: unknown; autoDocked?: boolean; autoUndocked?: boolean }
    | { ok: false; code: string; message: string; details?: Record<string, unknown> };
  ```
  > **Correção feita na implementação**: o rascunho original tinha um único formato de
  > sucesso (`result`/`structuredContent`). Na prática, `account.send()` devolve
  > `QueryResult` (tem `result`/`structuredContent`) ou `MutationResult` (tem
  > `command`/`tick`/`delta`) — formatos diferentes de verdade, não só nomenclatura. O
  > formato de **erro** (a parte mais detalhada deste plano) ficou exatamente como previsto,
  > por isso só esse trecho foi corrigido, não o documento todo.

  Nunca lança exceção pra quem chama (regra 6). Erros de rede/timeout/protocolo da própria
  lib são capturados em `errors.ts` e convertidos pra esse formato também.
- `rate_limit.ts`: a lib retenta `rate_limited` em **mutações**, mas a pesquisa não confirmou
  o mesmo pra **queries** nem pra chamadas HTTP soltas. `GameSession.call` embrulha toda
  chamada com retry exponencial (base 1s, até 5 tentativas, respeitando `details.retry_after`
  quando o erro trouxer isso) como camada extra — redundante com a lib em parte, mas é
  exatamente o requisito 5 da spec e não custa garantir.
- Reautenticação (requisito 2): delegada à lib (reconexão com backoff já documentada).
  > **Achado na validação manual**: isso só funciona se `Account` for criada com
  > `reconnect: true` **e** uma função `credentials` (`{kind: "login", username, password}`)
  > — vem **desligado por padrão**. Sem isso, uma queda de conexão nunca se recupera.
  > `game_client.ts` já passa as duas opções.

## Processo por conta (constituição, regra 4)

- Cada processo Node chama `connect(<nome-da-conta>)` pra **exatamente uma conta** — nunca
  mais de uma por processo.
- PM2 gerencia N processos, um por conta ativa (`hillebot`, `ironvex`, `medici`), cada um
  lendo só o `accounts/<sua-conta>/credentials.json` correspondente.

## O que NÃO entra nesta camada

- Nenhuma lógica de jogo (minerar, vender, etc.) — isso é skill, specs futuras.
- Nenhuma decisão, determinística ou via LLM — isso é Planner/Decider.
- Nenhuma persistência em disco do estado do jogo — a lib já cacheia em memória; se quisermos
  persistir (memória operacional, spec `0003-memory`), aquela spec lê o cache de
  `GameSession`, não duplica lógica de conexão aqui.

## Riscos assumidos (documentados, não escondidos)

- `@spacemolt/lib` é um projeto pequeno (5 estrelas, ~347 commits, poucos mantenedores) —
  mitigação: isolado atrás de `game_client.ts`; nenhum outro arquivo importa a lib
  diretamente, então troca de implementação não vaza pro resto do sistema.
- A política exata de retry/erro da lib não está 100% documentada no README — tratar como
  hipótese a validar numa task de spike (ver `tasks.md`), não como garantia. Se a lib não se
  comportar como esperado, o protocolo WS é simples o suficiente (JSON + `request_id`) pra
  reimplementar na mão sem jogar fora o resto da arquitetura.
- O servidor do jogo muda com frequência (a própria lib avisa isso) — `game_client.ts` é o
  ponto único de ajuste quando isso acontecer.

## Alternativas consideradas e descartadas

- **HTTP API v2 puro, sem a lib**: mais simples de entender, mas perderíamos reconexão,
  retry e multi-conta já resolvidos, e teríamos que reimplementar tudo isso em cima de
  polling — sem eventos *push* (`player_died`, `chat_message`, etc.). Sem ganho claro, só
  mais trabalho.
- **Python + cliente MCP** (como o `spacemolt-gateway` antigo): MCP é desenhado pra uma
  sessão de chat, não automação 24/7 multi-conta — a própria documentação do jogo recomenda
  WebSocket/HTTP pra esse caso. Também reintroduziria a divisão de linguagem sem motivo forte.
