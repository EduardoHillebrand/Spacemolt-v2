# 0009 — Navigation — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Nenhuma dependência nova.

## Arquitetura

```
app/
  core/
    navigation.ts     # goTo(destination, ctx) — único lugar que chama travel/jump/find_route/refuel/scan
  game_client.types.ts  # ganha os tipos de resultado de goTo (NavigationResult)
```

Mora em `app/core/`, não em `app/skills/` — não é uma skill registrada (ver nota de
arquitetura no `spec.md`). Importado diretamente por `app/skills/mining/`, `app/skills/
trading/` e `app/skills/crafting/` (specs `0007`, `0008`, `0011`), nunca pelo loop
(`run_account_loop.ts`) diretamente.

### Tipos

```ts
export type Destination =
  | { kind: "poi"; poiId: string }          // mesmo sistema, via travel
  | { kind: "system"; systemId: string };    // sistema remoto, via find_route + jump(s)

export type NavigationResult =
  | { status: "arrived" }
  | { status: "blocked"; code: string; message: string; retryAfterSeconds?: number }
  | { status: "invalidated"; reason: string }; // risco de rota detectado, quem chamou decide
```

`NavigationResult` imita o formato de `ExecutorResult` (spec `0006`) de propósito — quem
chama `goTo` de dentro do próprio `executor` de uma skill consegue repassar o resultado quase
direto pro `switch` que já existe lá, sem tradução extra.

### `goTo(destination, ctx)`

```ts
async function goTo(destination: Destination, ctx: SkillContext): Promise<NavigationResult> {
  const route = destination.kind === "poi"
    ? { steps: [{ type: "travel", poiId: destination.poiId }] }
    : await findRoute(ctx.session, destination.systemId); // find_route: total_jumps, fuel_per_jump, estimated_fuel

  for (const step of route.steps) {
    const fuelNeeded = step.type === "jump" ? route.fuelPerJump : route.estimatedFuelForTravel;
    await ensureFuel(ctx.session, fuelNeeded); // refuel se faltar, ordem: reserva de facção -> estação -> fuel cell

    const result = step.type === "jump"
      ? await ctx.session.send("spacemolt", "jump", { target_system: step.systemId })
      : await ctx.session.send("spacemolt", "travel", { target_poi: step.poiId });

    const mapped = mapGameResultToNavigationResult(result); // no_fuel, in_transit, action_pending, station_under_attack, etc.
    if (mapped.status !== "arrived") return mapped; // para no primeiro obstáculo, não tenta "resolver" por conta própria
  }

  return { status: "arrived" };
}
```

- **`find_route` não inclui o último trecho intra-sistema** (POI até a estação de destino,
  segundo a pesquisa) — `goTo` completa isso explicitamente com um `travel` final quando o
  destino é um POI dentro do sistema de chegada, não assume que `find_route` já cobre tudo.
- **`ensureFuel` é proativo, não reativo**: calcula o que o próximo trecho vai custar
  (`fuel_per_jump`/`estimated_fuel` de `find_route`, ou uma estimativa equivalente pro
  `travel` dentro do sistema) e reabastece *antes* de tentar, em vez de tentar e reagir ao
  erro `no_fuel` depois — evita o cenário documentado de "nave parada sem resgate
  automático".
- **Nunca decide continuar diante de risco de rota**: se o passo seguinte cruzaria uma
  fronteira com fiscalização de contrabando, um sistema sem polícia, ou outro sinal de risco
  que `scan`/`get_system` exponha, `goTo` **não para proativamente por isso** — ele só
  reporta o que a própria chamada de `jump`/`travel` devolver. Checar risco *antes* de
  comprometer a viagem é responsabilidade de quem chama, via a função de scan exposta
  separadamente (ver abaixo) — não é embutido em `goTo` porque custaria uma chamada extra em
  toda viagem, mesmo quando o chamador não precisa dessa informação.

### Scan opcional (função separada, mesma módulo)

```ts
async function scoutDestination(destination: Destination, ctx: SkillContext): Promise<ScoutInfo>;
```

Chama `get_system`/`scan` pro destino, devolve o que existir (nível de polícia, contagem de
naves, se catalogado) sem mover a nave. Quem chama decide se usa isso antes de `goTo`.

## O que NÃO entra aqui

- Nenhuma lógica de "pra onde ir" — só recebe o destino já decidido.
- Registro no `skill_registry` (spec `0006`) — não é uma `Skill`, é uma função de
  `app/core/`.
- Tratamento de combate/fuga em trânsito — ver riscos abaixo.

## Riscos assumidos

- **Comportamento de nave destruída em trânsito não está documentado** (confirmado na
  pesquisa) — `goTo` vai tratar qualquer coisa inesperada como `{status: "blocked", code:
  "unknown_transit_error", ...}` até uma validação manual real revelar o formato
  verdadeiro. Não é hipótese arriscada do código, é lacuna de documentação do jogo.
- **`ensureFuel` pode subestimar o custo de um `travel` intra-sistema** se a fórmula de
  tempo/distância (`chargedDistance / velocidade efetiva`) não for exposta diretamente pela
  API em algum campo pronto — pode precisar de uma validação manual medindo consumo real
  antes de confiar 100% na estimativa pra decidir reabastecer.

## Alternativas consideradas e descartadas

- **Navigation como skill própria no loop** (ideia original do backlog): rejeitada porque a
  API não tem "navegar" como atividade com objetivo — o loop escolheria essa skill pra rodar
  e ela não teria nada de útil pra decidir sozinha (pra onde ir é sempre decisão de outra
  skill). Ver nota de arquitetura no `spec.md`.
- **Checar risco de rota automaticamente dentro de `goTo`**: mais seguro por padrão, mas
  custa uma chamada de API extra em toda viagem, inclusive nas triviais (ex. ir da estação
  pro POI vizinho dentro da mesma zona protegida). Preferiu-se expor `scoutDestination`
  como função separada, opcional, pra quem decide se o custo vale.
