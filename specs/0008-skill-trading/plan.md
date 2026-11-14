# 0008 — Trading — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Depende de `app/core/navigation.ts`
(`0009`), `app/core/maintenance.ts` (`0010`), e da memória de longo prazo (`0003`,
`app/memory/long_term_memory.ts`) já implementada.

## Arquitetura

```
app/
  skills/
    trading/
      index.ts            # exporta o objeto Skill { name: "trading", planner, executor }
      planner.ts            # decide: comprar aqui, viajar pra vender lá, ou buscar nova rota
      executor.ts             # chama buy/sell/create_*_order/goTo mecanicamente
      profitability.ts          # calcula lucro líquido de uma rota conhecida (ask origem, bid destino, imposto)
```

### `profitability.ts`

```ts
interface KnownRoute {
  buyStationId: string;
  sellStationId: string;
  itemId: string;
  lastSeenAskPrice: number;   // na origem — o que se paga
  lastSeenBidPrice: number;    // no destino — o que se recebe
}

function estimateNetProfit(route: KnownRoute, quantity: number, saleTaxRateBps: number): number {
  const grossProfit = (route.lastSeenBidPrice - route.lastSeenAskPrice) * quantity;
  const tax = route.lastSeenAskPrice * quantity * (saleTaxRateBps / 10_000); // imposto cobrado na compra
  return grossProfit - tax;
}
```

Preços guardados são sempre "última vez observada", nunca tratados como garantidos — o
Planner reconsulta (`view_market`/`estimate_purchase`) antes de comprar de verdade; a
memória de longo prazo (ver abaixo) serve só pra **priorizar qual rota vale reconsultar
primeiro**, não como fonte de verdade de preço.

### Memória de longo prazo como catálogo de rotas conhecidas

```ts
// gravar ao encontrar um spread bom:
await ctx.memory.remember(
  `Rota ${buyStation} -> ${sellStation} pro item ${itemId}: spread ~${spread} crédito/unidade`,
  "trading-route"
);

// recuperar candidatas antes de decidir pra onde ir:
const candidates = await ctx.memory.recall("rota rentável comprar vender", 5);
```

Usa o mecanismo já existente de `0003` (`remember`/`recall`) sem nenhuma extensão — é só mais
um tipo de conteúdo guardado ali, igual a "lições aprendidas" já previsto na constituição
(regra 11).

### `planner.ts`

```ts
async function planTrading(ctx: SkillContext): Promise<Plan> {
  const ship = await ctx.session.send("spacemolt_ship", "get_ship", {});

  if (ship.docked && hasUnsoldProfitableCargo(ship)) {
    return planSellHere(ctx); // já está na estação certa pra vender o que carrega
  }
  if (!ship.docked || cargoHasRoomAndCreditAllow(ship)) {
    const route = await pickBestKnownRoute(ctx); // candidatos via memory.recall, reconfirmados via view_market
    if (route) return planBuyThenTravel(ctx, route);
  }
  return planScoutNewRoute(ctx); // sem rota conhecida boa -> visita uma estação Solarian ainda não avaliada
}
```

- **`planBuyThenTravel`**: comprar na estação atual (se já lá) ou `goTo` até a estação de
  origem da rota, comprar, depois `goTo` até a estação de destino, vender.
- **`planScoutNewRoute`**: quando não há rota conhecida boa na memória, visita uma estação
  Solarian ainda não avaliada (lista fixa pequena no início — nenhuma descoberta automática
  de "todas as estações do império", conforme fora de escopo no `spec.md`) só pra observar
  preço, sem comprar — alimenta a memória pra ciclos futuros.
- **Condições de invalidação do plano**: cargo fica cheio antes do esperado; crédito cai
  abaixo do necessário pra terminar a compra planejada; preço no destino caiu abaixo do
  limiar de lucro mínimo entre a compra e a venda (reconsultado via `view_market` antes de
  vender, nunca confiando só no valor memorizado).

### `executor.ts`

```ts
async function executeTradingStep(plan: Plan, ctx: SkillContext): Promise<ExecutorResult> {
  const step = plan.steps[0];
  switch (step.kind) {
    case "goTo":
      return toExecutorResult(await goTo(step.destination, ctx)); // 0009
    case "buy": {
      const estimate = await ctx.session.send("spacemolt_market", "estimate_purchase", { id: step.itemId, quantity: step.quantity });
      if (!estimate.affordable) return { status: "invalidated", reason: "insufficient_credits" };
      const result = await ctx.session.send("spacemolt_market", "buy", { id: step.itemId, quantity: step.quantity, deliver_to: "storage" });
      return mapTradeResult(result); // item_not_available -> sugere create_buy_order no próximo plano
    }
    case "sell": {
      const result = await ctx.session.send("spacemolt_market", "sell", { id: step.itemId, quantity: step.quantity });
      return mapTradeResult(result);
    }
    case "maintain":
      return toExecutorResult(await checkAndRepair(ctx)); // 0010, mesma parada de compra/venda
  }
}
```

### Erros documentados mapeados

| Erro do jogo | `ExecutorResult` |
|---|---|
| `insufficient_credits` | `invalidated` (replanejar com quantidade menor ou outra rota) |
| `item_not_available` | `invalidated` (Planner decide entre `create_buy_order` ou outra rota) |
| `cargo_full` | `invalidated` (voltar pra vender antes de comprar mais) |
| `no_market` | `invalidated` (estação errada, Planner escolhe outra) |
| `price_too_high` | `error` (teto de 1 trilhão — cenário anômalo, não replanejável de forma simples) |
| erro não reconhecido | `error` com `code: "trading_unknown_error"` — nunca lança |

## O que NÃO entra aqui

- Cruzar fronteira de império, transferência entre contas, scouting exaustivo, gestão de
  ordens de longo prazo — todos documentados como fora de escopo no `spec.md`.
- Qualquer lógica de combustível/reparo própria — delegada a `0009`/`0010`.

## Riscos assumidos

- **Lista inicial de estações conhecidas pra "scout" pode ser pequena/manual no início** —
  aceitável; cresce organicamente via memória conforme a conta visita mais lugares.
- **Preço memorizado pode ficar velho** (mercado flutua) — mitigado por sempre reconsultar
  antes de agir de verdade (`view_market`/`estimate_purchase`), a memória só prioriza, nunca
  decide sozinha.

## Alternativas consideradas e descartadas

- **Scan automático de todas as estações do império a cada ciclo**: daria dados mais
  completos, mas custa tempo/ações toda vez e contradiz o escopo inicial deliberadamente
  pequeno (poucas estações conhecidas hoje) — revisitar se o número de estações visitadas
  crescer o suficiente pra justificar.
- **Guardar preços numa estrutura própria em vez da memória de longo prazo (`0003`)**:
  rejeitada — reusar `remember`/`recall` evita inventar um segundo mecanismo de persistência
  só pra isso, e a constituição (regra 11) já prevê memória de longo prazo como o lugar pra
  "fatos acumulados que valem a pena lembrar entre sessões", que é exatamente o que uma rota
  de arbitragem boa é.
