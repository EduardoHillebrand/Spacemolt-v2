# 0011 — Crafting — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Depende de `app/core/maintenance.ts`
(`0010`, pra checar seguro/casco se a nave precisar se mover até a instalação) e,
opcionalmente, `app/core/navigation.ts` (`0009`, se a instalação não for onde a nave já
está). Não depende de `0008-skill-trading` nem de `0013` — consome material já presente,
não o adquire.

## Arquitetura

```
app/
  skills/
    crafting/
      index.ts            # exporta o objeto Skill { name: "crafting", planner, executor }
      planner.ts            # decide: qual receita, quanto, se vale (via dry_run), se há skill suficiente
      executor.ts             # queue/craft/poll de status mecanicamente
```

### `planner.ts`

```ts
async function planCrafting(ctx: SkillContext): Promise<Plan> {
  const queue = await ctx.session.send("spacemolt_facility", "craft", { action: "queue" });
  if (queue.jobs.some((j) => !j.completed)) {
    return planWaitForJob(ctx, queue.jobs[0]); // já tem job rodando — só acompanhar, nunca reemitir craft
  }

  const recipe = await chooseRecipe(ctx); // qual receita tem material suficiente no storage da instalação
  if (!recipe) {
    return planIdle(ctx); // sem material suficiente pra nenhuma receita conhecida — estado válido, não erro
  }

  const charSkill = await ctx.session.send("spacemolt_catalog", "get", { type: "character_skills" });
  const recipeInfo = await ctx.session.send("spacemolt_catalog", "get", { type: "recipes", id: recipe.id });
  if (charSkill.level < recipeInfo.minimumSkillLevel) {
    return { steps: [], invalidate_when: [], /* reportado como erro claro no executor, ver mapeamento abaixo */ };
  }

  const quote = await ctx.session.send("spacemolt_facility", "craft", { recipe_id: recipe.id, quantity: recipe.quantity, dry_run: true });
  if (!quote.affordable) {
    return planIdle(ctx);
  }

  return {
    steps: [{ kind: "enqueue", recipeId: recipe.id, quantity: recipe.quantity }, { kind: "waitForCompletion" }],
    invalidate_when: [
      { description: "storage material changed enough to invalidate the quote", check: (c) => materialsChangedSignificantly(c) },
    ],
  };
}
```

- **`chooseRecipe`**: olha o storage da instalação atual e o catálogo de receitas
  conhecidas (lista pequena, fixa no início — crescer conforme a conta aprender receitas
  novas não é escopo desta versão), escolhe a primeira receita cujos materiais de entrada
  estão disponíveis em quantidade suficiente.
- **`planWaitForJob`**: não chama `craft` de novo — só consulta `action: "queue"` (leitura,
  não enfileira nada novo) a cada ciclo do loop, até `completed: true`. Isso evita o erro de
  double-spend documentado (reemitir `craft` duplica o job) sem precisar integrar o canal de
  notificação push do jogo (`crafting_update`) nesta versão — ver alternativas descartadas.
- **Receita skill-gated sem nível suficiente**: devolve um plano vazio que o Executor
  reconhece e reporta como `error` com `code: "insufficient_character_skill"` — nunca tenta
  enfileirar mesmo assim.

### `executor.ts`

```ts
async function executeCraftingStep(plan: Plan, ctx: SkillContext): Promise<ExecutorResult> {
  const step = plan.steps[0];
  switch (step?.kind) {
    case "enqueue": {
      const result = await ctx.session.send("spacemolt_facility", "craft", { recipe_id: step.recipeId, quantity: step.quantity });
      return mapCraftResult(result); // insufficient_materials -> error, rental_overdue -> error, ok -> running
    }
    case "waitForCompletion": {
      const queue = await ctx.session.send("spacemolt_facility", "craft", { action: "queue" });
      const job = queue.jobs[0];
      if (!job) return { status: "error", code: "job_missing", message: "..." };
      return job.completed ? { status: "done" } : { status: "running" };
    }
    default:
      return { status: "error", code: "insufficient_character_skill", message: "..." };
  }
}
```

### Erros documentados mapeados

| Erro do jogo | `ExecutorResult` |
|---|---|
| storage insuficiente no enqueue | `error` (`insufficient_materials`) — não enfileirou, replanejar escolhendo outra receita ou esperar material |
| receita skill-gated sem nível | `error` (`insufficient_character_skill`) — detectado no planner antes de tentar |
| aluguel de facility atrasado | `error` (`rental_overdue`) — fila congelada, fora do escopo resolver automaticamente |
| erro não reconhecido | `error` com `code: "crafting_unknown_error"` — nunca lança |

## O que NÃO entra aqui

- Aquisição de material (compra ou transferência entre contas) — fora do escopo, ver
  `spec.md`.
- Venda do bem craftado — `0008`.
- Field Workshop undocked, gestão de aluguel — fora do escopo, ver `spec.md`.
- Integração com o canal de notificação push do jogo (`crafting_update`) — ver alternativas
  descartadas.

## Riscos assumidos

- **Lista de receitas conhecidas fixa e pequena no início** — cresce manualmente conforme a
  conta aprender receitas novas; não há descoberta automática de "todas as receitas
  possíveis" nesta versão.
- **Polling de `action: "queue"` a cada ciclo do loop em vez de assinar notificação push**:
  mais simples de implementar (reusa o mesmo padrão de leitura que outras skills já fazem),
  ao custo de uma chamada de leitura extra por ciclo enquanto um job está rodando — aceitável
  porque é uma leitura, não uma mutação, e não duplica o job (requisito 3 da spec).
- **Fatores de velocidade do Workshop (×1–3 vs. ×1–5) não reconciliados**: não bloqueia a
  skill (ela só espera a notificação/consulta de conclusão), mas pode deixar expectativa de
  tempo errada em qualquer dashboard futuro (`0012`) que tente estimar ETA.

## Alternativas consideradas e descartadas

- **Assinar o canal de notificação push do jogo (`crafting_update`) em vez de pollar a
  fila**: mais eficiente, mas exigiria estender `app/game_client.ts` (spec `0001`) pra
  expor um canal de eventos assíncronos que hoje não existe (a lib é usada de forma
  request/response via `send()`) — escopo maior que o necessário pra esta primeira versão;
  revisitar se o custo de polling se mostrar um problema real.
- **Permitir craft a partir do cargo da nave, não só do storage da instalação**: rejeitada
  como caminho padrão — o jogo trata isso como caso especial (Field Workshop undocked),
  não o comportamento comum; manter o caminho padrão (storage da instalação) simplifica o
  planner sem perder o caso comum.
