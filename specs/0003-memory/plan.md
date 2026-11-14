# 0003 — Memory — Plan

## Stack

TypeScript/Node, mesmo runtime das specs `0001`/`0002`. Pra embeddings, chamada HTTP direta
ao Ollama local (`http://localhost:11434/api/embeddings`, modelo `nomic-embed-text` — já
instalado, ver `log/infra.md`). Nenhuma dependência de vector DB — ver "alternativas
descartadas".

## Arquitetura

```
app/
  core/
    embeddings.ts           # único lugar que chama o Ollama pra gerar embedding de um texto
                             # (compartilhado com a spec 0004-knowledge-base-integration,
                             # que também precisa de embedding — por isso mora em core/,
                             # não em memory/; constituição regra 5: "se duas coisas
                             # precisam do mesmo, sobe pra core/")
  memory/
    operational_state.ts   # formaliza a regra: estado vem do GameSession, nunca é persistido como fonte de verdade
    long_term_memory.ts      # remember() / recall() / list()
accounts/<conta>/
  memory.json               # memória de longo prazo da conta — gitignorado (dentro de accounts/)
```

### Por que `memory.json` dentro de `accounts/` (gitignorado), diferente de `roles.json`

`roles.json` (spec `0002`) é **configuração do projeto** — muda raramente, por decisão
deliberada, e vale ter no histórico do git. `memory.json` é **dado de instância** — cresce
continuamente enquanto o agente joga, do jeito que `state.json`/`strategy.json` cresciam nos
projetos antigos. Não teria sentido poluir o `git log` com cada lição registrada. Fica junto
de `credentials.json` porque os dois são "tudo que é específico desta conta rodando", mesmo
que só um dos dois seja segredo.

### `operational_state.ts` — não é armazenamento novo

Satisfaz o requisito 1 só **formalizando** uma regra, não criando um mecanismo: o estado
operacional já vive no cache em memória do `GameSession` (spec `0001`, via `@spacemolt/lib`).
Este arquivo expõe um helper `snapshot(session)` (devolve um objeto plano do estado atual,
útil pra log/dashboard depois) e documenta no código: **nada aqui é gravado em disco como
fonte de verdade** — se precisar, é só reconectar e reconstruir.

### `app/core/embeddings.ts`

```ts
function embed(text: string): Promise<number[]>;
```

Chama `POST http://localhost:11434/api/embeddings` com `model: "nomic-embed-text"`. Único
lugar que fala com esse endpoint — se o modelo de embedding mudar, só este arquivo muda.

### `long_term_memory.ts`

```ts
function remember(accountName: string, text: string, context?: string): Promise<void>;
function recall(accountName: string, query: string, topK?: number): Promise<MemoryEntry[]>;
function list(accountName: string): Promise<MemoryEntry[]>;
```

- `remember`: calcula o embedding do texto (`embeddings.ts`), acrescenta uma entrada a
  `accounts/<conta>/memory.json` e **grava no disco imediatamente** (write-through, não
  buffer em memória) — coerente com o requisito 7 (perda é grave).
- `recall`: calcula o embedding da pergunta, compara (similaridade de cosseno, força bruta —
  ver "alternativas descartadas") contra todas as entradas da conta, devolve as `topK` mais
  relevantes. Satisfaz o requisito 4 (relevância, não palavra exata).
- Formato de `memory.json`:
  ```json
  {
    "entries": [
      {
        "id": "2026-11-14T10:00:00.000Z-a1b2c3",
        "text": "Rota Sol-Sirius costuma ter piratas Crimson perto do meio do caminho.",
        "context": "navigation",
        "created_at": "2026-11-14T10:00:00.000Z",
        "embedding": [0.0123, -0.0456, "..."]
      }
    ]
  }
  ```

### Escrita segura (requisito 7: perda de memória de longo prazo é grave)

`remember` escreve em arquivo temporário e faz rename atômico pro `memory.json` final, e
mantém a versão anterior como `memory.json.bak` antes de sobrescrever — proteção simples
contra escrita parcial corromper o único registro cumulativo que não é reconstruível.

### Captain's Log nativo como rede de segurança (requisito 6)

Um helper pequeno, não um mecanismo novo: se `list(accountName)` devolver vazio (conta nova
pro agente, mesmo que já exista no jogo), usa o texto do Captain's Log como primeiro
contexto pro Planner, em vez de partir de zero absoluto. Não grava isso em `memory.json`
automaticamente — é só um contexto de partida.

> **Correção feita na implementação**: o texto do Captain's Log **não** vem dentro de
> `GameSession.initialState` (a lib não expõe esse campo no payload de login). Vem pedindo
> explicitamente via `session.call("spacemolt_social", "captains_log_list", {})`, que devolve
> a entrada mais recente (`structuredContent.entry.entry`). Validado contra uma conta real —
> encontrou uma entrada de fato escrita pelo agente antigo (`D:\Projects\SpaceMolt`) há
> meses. Comportamento pro resto do sistema é o mesmo, só a origem do dado mudou.

## O que NÃO entra aqui

- Decisão de **quando** chamar `remember`/`recall` — isso é Planner, specs futuras.
- Qualquer persistência do estado operacional em disco — fica só no `GameSession` (spec
  `0001`).
- Memória compartilhada entre contas — spec `0011`.

## Riscos assumidos

- Busca por similaridade é força bruta (compara contra todas as entradas, sem índice) — na
  escala de uma conta jogando sozinha (centenas a poucos milhares de lições ao longo de
  meses), isso é rápido o suficiente e simples de entender. Reavaliar só se isso virar
  gargalo de verdade.
- Dependência do Ollama local pra gerar embedding em `remember`/`recall` — se o Ollama cair,
  a memória de longo prazo fica indisponível (não corrompida, só inacessível até voltar).
  Aceitável por agora; não bloqueia o resto do agente (constituição, regra 3 — Decider já é
  tratado como recurso que pode falhar/ficar lento).

## Alternativas consideradas e descartadas

- **Vector DB dedicado** (ex.: Chroma, Qdrant): resolve escala que este projeto não tem —
  mais uma peça de infra pra manter rodando, sem ganho real no volume de dados esperado.
- **Persistir o estado operacional em disco** "pra garantir": contradiz o requisito 1 da
  spec (ele é reconstruível de propósito) e duplicaria fonte de verdade com o jogo.
