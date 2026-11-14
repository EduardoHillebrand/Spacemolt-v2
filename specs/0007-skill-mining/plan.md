# 0007 — Mining — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Depende de `app/core/navigation.ts`
(`0009`) e `app/core/maintenance.ts` (`0010`) — ambas precisam existir antes desta skill
poder usá-las de verdade (tasks marcam isso explicitamente).

## Arquitetura

```
app/
  skills/
    mining/
      index.ts           # exporta o objeto Skill { name: "mining", planner, executor }
      planner.ts          # decide: minerar aqui, ir pra outro POI, voltar à estação
      executor.ts          # chama mine()/goTo()/checkAndRepair() mecanicamente
      equipment.ts           # sabe mapear tipo de recurso do POI -> módulo de harvester necessário
  roles/
    catalog.ts            # revisão: miner.skills passa a ser ["mining"] só (ver nota abaixo)
```

### Revisão pendente em `catalog.ts` (spec `0002`)

A pesquisa feita pras specs `0009`/`0010` mostrou que `navigation` e `maintenance` não são
skills que competem no loop — são módulos que `mining` chama internamente. Isso significa
que a lista `skills: ["mining", "navigation", "maintenance"]` do papel `miner` em
`roles/catalog.ts` (0002) está desatualizada: deveria ser só `skills: ["mining"]` (o
`goTo`/`checkAndRepair` já estão dentro do Executor de `mining`, não precisam aparecer como
entradas separadas que o `skill_registry` resolveria). Mesma coisa pro `trader`
(`["trading", "navigation"]` → `["trading"]`) e pro `artisan` (`skills: []` →
`["crafting"]`, quando `0011` existir). `SkillName` (em `catalog.ts`) também perde
`"navigation"` e `"maintenance"` como variantes válidas, já que não há mais nenhum objeto
`Skill` registrável com esses nomes.

Essa revisão **faz parte da implementação desta spec** (task 1 abaixo), não de uma spec
nova — é o mesmo tipo de correção documentada que já aconteceu dentro de `0006` (ver
`plan.md` daquela spec). `specs/0002-accounts-and-roles/tasks.md` recebe um item adicional
de nota explicando a mudança, sem apagar o que já foi marcado como feito.

### `equipment.ts` — mapear recurso → módulo necessário

```ts
type ResourceKind = "ore" | "ice" | "gas"; // confirmado na pesquisa: três categorias extraíveis
function requiredHarvester(resource: ResourceKind): string; // "Mining Laser" | "Ice Harvester" | "Gas Harvester"
function hasCompatibleEquipment(ship: Ship, resource: ResourceKind): boolean;
```

### `planner.ts`

```ts
async function planMining(ctx: SkillContext): Promise<Plan> {
  const ship = await ctx.session.send("spacemolt_ship", "get_ship", {});
  const poi = await ctx.session.send("spacemolt", "get_poi", {});

  if (cargoFull(ship)) {
    return planReturnToStation(ctx);
  }
  if (!poi.minableResource || !hasCompatibleEquipment(ship, poi.minableResource) || poi.too_sparse) {
    return planFindNewDeposit(ctx); // escolhe outro POI no mesmo sistema compatível com o equipamento
  }
  return {
    steps: [{ kind: "mine" }],
    invalidate_when: [
      { description: "cargo full", check: (c) => cargoFullNow(c) },
      { description: "deposit too sparse", check: (c) => depositTooSparseNow(c) },
      { description: "no compatible equipment", check: (c) => !hasCompatibleEquipmentNow(c) },
    ],
  };
}
```

- **`planFindNewDeposit`** usa `get_system` pra listar POIs minerável do sistema atual
  compatíveis com o equipamento instalado, escolhe o mais próximo (sem heurística de valor —
  fora do escopo, ver `spec.md`), e devolve um plano cujo primeiro passo é um `goTo` (`0009`)
  até lá.
- **`planReturnToStation`** devolve um plano cujos passos são: `goTo` até a estação mais
  próxima com mercado, `sell`/`deposit` da carga, `checkAndRepair`/`checkInsurance` (`0010`),
  e só então considerar o ciclo "done" (o loop volta a chamar o Planner, que decide minerar
  de novo).

### `executor.ts`

```ts
async function executeMiningStep(plan: Plan, ctx: SkillContext): Promise<ExecutorResult> {
  const step = plan.steps[0];
  switch (step.kind) {
    case "mine": {
      const result = await ctx.session.send("spacemolt", "mine", {});
      return mapMineResult(result); // in_transit, action_pending, too_sparse, equipment missing -> invalidated/error
    }
    case "goTo":
      return toExecutorResult(await goTo(step.destination, ctx)); // 0009 — NavigationResult já quase compatível
    case "sellOrDeposit":
      return toExecutorResult(await sellOrDepositCargo(ctx));
    case "maintain":
      return toExecutorResult(await checkAndRepair(ctx)); // 0010, só na mesma parada de venda
  }
}
```

`toExecutorResult` é um adaptador pequeno — `NavigationResult`/`RepairResult` já foram
desenhados (`0009`/`0010`) pra encaixar quase direto no formato `ExecutorResult` do `0006`.

### Erros documentados mapeados

| Erro do jogo | `ExecutorResult` |
|---|---|
| `too_sparse` / "the beam disperses..." | `invalidated` (depósito esgotado, replanejar) |
| `action_pending` | `running` (tentar de novo no próximo ciclo) |
| `in_transit` | `running` (ainda chegando) |
| falta de harvester compatível | `invalidated` (equipamento não serve, replanejar pra outro POI/esperar upgrade) |
| erro não reconhecido | `error` com `code: "mining_unknown_error"` — nunca lança |

## O que NÃO entra aqui

- Frota multi-nave, otimização de valor por minério, arbitragem de venda, deep-core,
  combate — todos documentados como fora de escopo no `spec.md`.
- Qualquer lógica de combustível/reparo própria — delegada integralmente a `0009`/`0010`.

## Riscos assumidos

- **`planFindNewDeposit` escolhendo "o mais próximo" pode escolher mal** sem noção de
  risco/segurança da zona — aceitável pro escopo inicial (sistemas protegidos/home, segundo
  a pesquisa), revisitar se `HilleBot` migrar pra zonas de baixa segurança por recursos mais
  raros.
- **Limiar de "cargo quase cheio" pra decidir voltar antes de ficar 100% cheio** não é
  definido aqui — a decisão é binária (cheio ou não) por simplicidade inicial; pode valer
  antecipar a volta, mas isso é ajuste fino, não bloqueador.

## Alternativas consideradas e descartadas

- **Vender a carga sendo responsabilidade de `0008-skill-trading`** em vez desta skill:
  rejeitada (ver pesquisa) — `trading` é sobre arbitragem entre estações, um problema
  diferente de "não ficar parado com o cargo cheio". Vender/depositar aqui é só liberar
  espaço, não maximizar lucro.
