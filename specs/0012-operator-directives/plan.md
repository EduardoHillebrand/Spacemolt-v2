# 0012 — Operator Directives — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. **Nenhuma dependência nova**: o servidor
web usa `node:http` nativo (sem Express) — só GET/POST simples e uma página estática,
não justifica um framework. Autenticação via `.env` (já gitignored), carregado com a flag
nativa `node --env-file=.env` (suportada desde Node 20, confirmar com Node ≥22 do projeto
— validação manual, task 8) em vez de adicionar o pacote `dotenv`.

## Arquitetura

```
app/
  directives/
    directive.ts         # Directive, readDirective(account), writeDirective(account, patch) — único lugar que lê/escreve accounts/<conta>/directive.json
    server.ts              # servidor HTTP nativo: GET/POST por conta, auth básica, serve a página estática
  loop/
    skill_interface.ts       # SkillContext ganha `directive: { preferences: Record<string, unknown>; note: string }`
    run_account_loop.ts        # relê a diretiva a cada ciclo; `paused` interrompe antes de chamar planner/executor
  skills/
    mining/
      planner.ts                # usa ctx.directive.preferences.preferredResource quando presente
static/
  directives.html             # única página — lista de contas (de roles.json) + formulário de preferences/note/paused
scripts/
  run-directives-server.ts    # entrypoint do processo (PM2), análogo a scripts/run-devlog-server.ts
.env                           # DIRECTIVES_USER, DIRECTIVES_PASS — já gitignored, nunca versionado
```

### `app/directives/directive.ts`

```ts
export interface Directive {
  paused: boolean;
  // Namespaced por SkillName — cada skill só lê a própria chave (ex.: preferences.mining).
  preferences: Record<string, Record<string, unknown>>;
  note: string;
  updatedAt: string;
}

const DEFAULT_DIRECTIVE: Directive = { paused: false, preferences: {}, note: "", updatedAt: "" };

function readDirective(accountName: string): Directive; // lê accounts/<conta>/directive.json, devolve DEFAULT_DIRECTIVE se não existir
function writeDirective(accountName: string, patch: Partial<Directive>): Directive; // merge + escrita atômica (tmp+rename, mesmo padrão de long_term_memory.ts)
```

Mesmo padrão de `accounts/<conta>/memory.json` (spec `0003`): instância de dado por conta,
não segredo, mas ainda assim não versionado (dado operacional que muda com frequência, não
decisão de projeto como `roles.json`).

### `app/directives/server.ts`

```ts
function startDirectivesServer(port: number = DIRECTIVES_PORT): { close(): void };
```

Rotas:
- `GET /api/accounts` — lista contas conhecidas (lê `roles.json`, spec `0002`) — público,
  só nomes e papel atual, nada sensível.
- `GET /api/directive/:account` — devolve a diretiva da conta (auth básica).
- `POST /api/directive/:account` — atualiza (merge parcial, mesmo padrão do `set_strategy`
  do projeto antigo) — auth básica.
- `GET /` — serve `static/directives.html`.

Porta: `DIRECTIVES_PORT = 5000` — **não é uma porta nova**: `log/infra.md` já registra que o
Cloudflare Tunnel existente (`hillebrand-ia`) roteia `spacemolt.hillebrand.ia.br` pra essa
porta, exatamente onde rodava o dashboard Flask do projeto antigo (confirmado pelo usuário:
este servidor **substitui** aquele). Reaproveitar a porta significa que nenhuma mudança é
necessária no `config.yml` do túnel — só rodar este processo nela em vez do antigo.

Auth básica: compara contra `process.env.DIRECTIVES_USER`/`DIRECTIVES_PASS` lidos de
`.env` — **nunca aparece em log nem devlog** (mesma garantia de `scrub()`, spec `0005`,
regra 6 da constituição). Sem essas variáveis definidas, o servidor recusa escrever
(paths de GET continuam liberados só pra leitura, já que não expõem segredo nenhum).

### `static/directives.html`

Página única, sem framework de frontend — mesmo espírito minimalista do resto do projeto.
Lista as contas (`GET /api/accounts`), um formulário por conta (campo de recurso preferido
pra mineração, textarea de nota livre, toggle de pausa), grava via `POST
/api/directive/:account`. Pede usuário/senha (auth básica do browser, nada de JS de login
customizado).

### `skill_interface.ts` — `SkillContext` ganha `directive`

```ts
export interface SkillContext {
  session: GameSession;
  objective: string;
  directive: {
    preferences: Record<string, unknown>; // já filtrado pro namespace da skill ativa, não o objeto todo
    note: string;
  };
  memory: { recall; remember };
  knowledgeBase: { search };
  decider: { ask };
}
```

`run_account_loop.ts` monta `ctx.directive.preferences` já recortado
(`directive.preferences[activeSkill.name] ?? {}`) antes de passar pro planner — cada skill
nunca vê a diretiva de outra, mesmo padrão de isolamento da constituição (regra 5).

### `run_account_loop.ts` — pausa

```ts
while (true) {
  const directive = readDirective(accountName);
  if (directive.paused) {
    emitOncePerPause({ type: "account_paused", level: "info" }); // não repete o evento every poll
    await sleep(NO_SKILL_POLL_MS); // mesma constante já usada pro caso "sem skill pro papel"
    continue;
  }
  ctx.directive = { preferences: directive.preferences[activeSkill?.name ?? ""] ?? {}, note: directive.note };
  // ... resto do loop já existente (advance, etc.)
}
```

### `app/skills/mining/planner.ts` — preferência leve

```ts
async function findPreferredOrAnyMinablePoi(ctx: SkillContext): Promise<string | null> {
  const preferred = ctx.directive.preferences.preferredResource as string | undefined;
  if (preferred) {
    const match = await findMinablePoi(ctx, preferred); // tenta achar um POI do recurso pedido primeiro
    if (match !== null) return match;
    // não achou compatível com a preferência -- cai pro comportamento padrão, nunca trava.
  }
  return findMinablePoi(ctx); // comportamento já existente, sem filtro
}
```

`findMinablePoi` (já existente, `app/skills/mining/state.ts`) ganha um parâmetro opcional
de filtro por recurso — **depende de `get_system`/`get_poi` exporem o tipo de recurso por
POI, o que ainda não está confirmado** (mesma lacuna já registrada nos `tasks.md` de `0007`)
— até a validação manual confirmar o nome do campo, o filtro é melhor-esforço: se o campo
não existir na resposta, nenhum POI "bate" com a preferência, e o comportamento cai pro
padrão de qualquer forma (nunca um erro, só a preferência fica sem efeito até os campos
serem confirmados).

## O que NÃO entra aqui

- Dashboard de observabilidade (`0013-dashboard-ui`, renumerada) — só a página mínima de
  diretriz entra nesta spec.
- Preferências concretas pra trading/crafting — o schema já comporta, nenhum campo usado.
- Qualquer interpretação de `note` por código — só chega ao Decider como string, quando
  alguma skill já fosse perguntar algo mesmo.

## Riscos assumidos

- **Filtro de recurso em mineração pode não ter efeito até a validação manual confirmar os
  nomes de campo de `get_system`/`get_poi`** — aceitável, documentado, nunca bloqueante
  (preferência não atendida cai pro comportamento padrão, não é erro).
- **`node --env-file` pode não funcionar igual em todo setup (PM2, Windows)** — precisa de
  validação manual (task 8); se não funcionar, cai pra uma leitura manual de `.env` sem
  dependência nova (poucas linhas, não justifica `dotenv` só por isso).
- **Servidor HTTP novo é mais uma superfície exposta, e esta é alcançável de fora** (pedido
  explícito do usuário — substitui o dashboard antigo no mesmo túnel/porta, `log/infra.md`).
  Mitigação: a confidencialidade da senha em trânsito depende do Cloudflare Tunnel
  terminar TLS na borda (`spacemolt.hillebrand.ia.br` com DNS proxied — já era a postura do
  dashboard antigo, não uma regressão); toda tentativa de auth que falhar é registrada via
  devlog (`type: "directive_auth_failed"`, sem nunca logar a senha tentada, mesma garantia
  de `scrub()`) pra dar visibilidade de tentativa de força bruta, sem um rate-limit
  dedicado nesta primeira versão — se abuso real aparecer, é mais barato resolver no
  Cloudflare (regra de WAF/rate-limit na borda) que reimplementar isso aqui.

## Alternativas consideradas e descartadas

- **Diretiva 100% texto livre, sempre via Decider** (como o projeto antigo fazia):
  descartada — faria toda decisão de mineração depender do recurso lento e compartilhado
  (constituição, regra 3), quando "prefira ferro" é perfeitamente mecânico.
- **Reaproveitar o WebSocket do devlog pra também escrever diretiva**: descartada —
  devlog é canal de **leitura** (eventos saindo das contas), misturar um canal de escrita
  de controle no mesmo protocolo/porta confundiria a responsabilidade de cada um
  (constituição, regra 10 trata devlog como observabilidade, não controle).
- **Adicionar `dotenv` como dependência**: descartada enquanto `node --env-file` (nativo,
  Node ≥20) resolver — o projeto já exige Node ≥22 (spec `0001`), então a flag nativa está
  disponível sem custo extra.
