# 0006 — Agent Loop — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Nenhuma dependência nova.

## Arquitetura

```
app/
  main.ts                    # entrypoint do processo de uma conta (lê o nome da conta, chama o loop)
  loop/
    run_account_loop.ts       # a função principal — o loop em si
    skill_registry.ts          # Role -> lista de Skill ativas (consulta app/roles/account_role.ts, spec 0002)
    skill_interface.ts          # contrato Skill / Plan / ExecutorResult, comum a toda skill
  core/
    decider.ts                  # ask(question): Promise<string> — único lugar que chama a LLM
```

### `skill_interface.ts` — o contrato que toda skill implementa

```ts
type InvalidationCondition = { description: string; check: (ctx: SkillContext) => boolean };

type Plan = { steps: Step[]; invalidate_when: InvalidationCondition[] };

type ExecutorResult =
  | { status: "running" }                              // ainda rodando, chame de novo
  | { status: "done" }                                  // terminou com sucesso
  | { status: "invalidated"; reason: string }            // condição disparou, volta pro planner
  | { status: "error"; code: string; message: string };  // regra 6 — nunca exceção

interface Skill {
  name: SkillName;
  planner: (ctx: SkillContext) => Promise<Plan>;
  executor: (plan: Plan, ctx: SkillContext) => Promise<ExecutorResult>;
}

type SkillContext = {
  session: GameSession;        // spec 0001
  objective: string;            // da role ativa, spec 0002
  memory: { recall; remember }; // spec 0003
  knowledgeBase: { search };    // spec 0004
  decider: { ask };              // app/core/decider.ts
};
```

Qualquer skill futura (`0007+`) implementa só isso — o loop nunca conhece o funcionamento
interno de nenhuma skill, só esse contrato (constituição, regra 5).

### `core/decider.ts` — implementação mínima do Decider

```ts
function ask(question: string): Promise<string>;
```

Hoje: chama o Ollama local (mesmo endpoint de `app/core/embeddings.ts`, spec `0003`, mas
`/api/chat` ou `/api/generate`). Backend pluggable por design (constituição, regra 3) — troca
de Ollama pra Claude é mudar só este arquivo. Escopo bem pequeno de propósito: isso aqui só
"faz a pergunta, devolve a resposta"; formatação de prompt por skill é problema de cada
skill, não deste arquivo.

### `loop/skill_registry.ts`

```ts
function resolve(skillNames: SkillName[]): Skill[];
```

Traduz a lista de nomes de skill da role ativa (`getRoleDefinition`, spec `0002`) pros
objetos `Skill` de verdade — um mapa fixo de `SkillName -> Skill`, que cresce conforme as
specs `0007+` forem implementadas. Se a role pede uma skill que ainda não existe (ex.:
`artisan` hoje, lista vazia no catálogo), `resolve` devolve lista vazia — tratado como caso
válido pelo loop (ver abaixo), não erro.

### `loop/run_account_loop.ts` — o loop em si

```ts
async function runAccountLoop(accountName: string): Promise<never> {
  const session = await connect(accountName);                     // 0001
  const { current: role } = getRole(accountName);                 // 0002
  const { skills: skillNames, objective } = getRoleDefinition(role);
  const activeSkills = skillRegistry.resolve(skillNames);          // 0007+

  if (activeSkills.length === 0) {
    emit({ type: "no_skills_for_role", level: "warning", payload: { role } });
    // espera (poll leve) até a role mudar ou skills existirem — não é erro, é estado válido.
  }

  let activeSkill = chooseSkill(activeSkills); // hoje: a primeira da lista, ver nota abaixo
  let plan: Plan | null = null;
  let consecutiveErrors = 0;

  while (true) {
    const ctx = buildContext(session, objective); // memory + knowledgeBase + decider

    if (plan === null) {
      plan = await activeSkill.planner(ctx);
      emit({ type: "plan_created", level: "info", payload: { skill: activeSkill.name } });
    }

    const result = await activeSkill.executor(plan, ctx);

    switch (result.status) {
      case "running":
        continue;
      case "done":
        plan = null;
        consecutiveErrors = 0;
        activeSkill = chooseSkill(activeSkills); // pode trocar ou continuar na mesma
        break;
      case "invalidated":
        emit({ type: "plan_invalidated", level: "info", payload: { reason: result.reason } });
        plan = null;
        break;
      case "error":
        emit({ type: "skill_error", level: "error", payload: { code: result.code, message: result.message } });
        plan = null;
        consecutiveErrors++;
        await backoff(consecutiveErrors); // evita loop de erro em velocidade total
        break;
    }
  }
}
```

- **Nunca mais de um plano ativo**: a variável `plan` é única por conta, atualizada
  estritamente de forma sequencial dentro do `while` — satisfaz o requisito 2 diretamente
  pela estrutura do código, não por um lock explícito.
- **`chooseSkill` hoje é trivial**: devolve a primeira skill da lista (ordem do
  `catalog.ts`, spec `0002`). Critério documentado, fácil de trocar quando existir mais de
  uma skill competindo pelo mesmo papel (fora do escopo desta spec).
- **Erro nunca para o loop**: `consecutiveErrors` + `backoff()` evita que um erro repetido
  (ex.: skill mal configurada) martele o jogo/Decider em velocidade máxima — sem isso, um
  bug numa skill poderia gerar centenas de chamadas por segundo.
- **`buildContext`**: monta o `SkillContext` com acesso a `memory` (spec `0003`,
  `knowledgeBase` (spec `0004`) e `decider` (`core/decider.ts`) — toda skill recebe os três
  prontos, usar ou não é decisão de cada uma.

### `app/main.ts`

```ts
const accountName = process.argv[2] ?? process.env.ACCOUNT_NAME;
runAccountLoop(accountName);
```

Trivial de propósito — é só o que o PM2 chama (`node app/main.ts hillebot`, um processo por
conta, constituição regra 4). Toda a substância fica em `run_account_loop.ts`.

## O que NÃO entra aqui

- Implementação de qualquer skill de verdade (`0007+`) — `skill_registry.ts` só tem o
  mecanismo de lookup, o mapa fica vazio até a primeira skill existir.
- Lógica sofisticada de `chooseSkill` pra múltiplas skills competindo — documentado como
  trivial de propósito, revisitar quando o cenário existir.
- Formato de prompt que cada skill manda pro Decider — isso é de cada skill, não de
  `core/decider.ts`.

## Riscos assumidos

- `chooseSkill` trivial pode não ser a decisão certa quando houver mais de uma skill ativa
  pro mesmo papel — aceitável porque hoje (spec `0002`) cada papel mapeia pra uma skill
  clara; reavaliar quando isso deixar de ser verdade.
- `core/decider.ts` com escopo mínimo pode precisar crescer (histórico de conversa,
  templates de prompt por skill) — tratado como evolução natural do arquivo, não como
  spec nova, enquanto a complexidade continuar pequena.

## Alternativas consideradas e descartadas

- **Loop específico por skill** (cada skill cuida do próprio "ficar vivo"): duplicaria a
  lógica de replanejamento/erro/escolha em toda skill nova — exatamente o que a constituição
  (regra 5) pede pra subir pra `core`/`loop`.
- **Múltiplos planos concorrentes por conta** (ex.: uma skill de navegação rodando "por
  baixo" de uma de mineração): mais poder, mas contradiz a serialização de mutações por
  conta que a própria `@spacemolt/lib` já impõe (pesquisa da spec `0001`) — não ganharia
  nada na prática, só complexidade.
