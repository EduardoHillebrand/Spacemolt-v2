# 0011 — Crafting — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0010-skill-maintenance` (e `0009-skill-navigation`, se a instalação
> exigir deslocamento) precisam estar disponíveis. Diferente de `0007`/`0008`, esta skill
> não depende de `0008-skill-trading` nem de `0013` — consome material já presente.

1. [x] **`app/skills/crafting/recipes.ts`**: `KNOWN_RECIPE_IDS` — lista fixa e pequena
   (hoje só `"refine_steel"`, único exemplo confirmado no `SKILL_MANUAL.md`), não
   `chooseRecipe` a partir do storage da instalação como o `plan.md` original previa (ver
   correção abaixo).

2. [x] **`app/skills/crafting/queue.ts`**: `readQueue`/`hasJobRunning`.
   **Correção na implementação**: `craft` é ação do tool core `spacemolt` (não
   `spacemolt_facility`, como o `plan.md` original supôs) — confirmado lendo o
   `SKILL_MANUAL.md` linha a linha (`spacemolt(action="craft", id="refine_steel")`). Listar
   a fila chamando `craft` **sem `id`** é melhor esforço a partir da pesquisa da spec, **não
   confirmado contra o jogo real** — documentado explicitamente no próprio arquivo; se
   estiver errado, o pior caso é uma tentativa de reenfileirar que o próprio jogo rejeitaria
   como double-spend (erro real do jogo, nunca um estado silenciosamente incorreto).

3. [x] **`app/skills/crafting/planner.ts`**: `planCrafting(ctx)` — consulta a fila
   primeiro (nunca reemite `craft` se já há job rodando); testa cada receita conhecida via
   `dry_run: true` e enfileira a primeira afordável.
   **Correção na implementação**: a checagem proativa de skill de personagem via
   `catalog type=character_skills`/`catalog type=recipes` (requisito 2 da spec) **não foi
   implementada** — a convenção de chamada de `spacemolt_catalog` (que parâmetro é a
   "ação" de fato) não ficou clara nem na pesquisa nem lendo o manual (é o único tool
   listado sem uma lista de ações nomeadas). Em vez de adivinhar, a skill deixa o próprio
   `craft`/`dry_run` reportar isso como erro real do jogo, que `mapCraftError` repassa
   estruturado — mais simples e mais correto que inventar uma convenção de chamada. Revisitar
   quando a convenção de `spacemolt_catalog` for confirmada (validação manual).

4. [x] **`app/skills/crafting/executor.ts`**: `executeCraftingStep(plan, ctx)` —
   `enqueue` chama `craft` com o `id` da receita; `waitForJob` só consulta a fila (leitura),
   nunca reenfileira; qualquer `ok: false` do jogo vira `error` estruturado com o código
   real, nunca lança.

5. [x] **`app/skills/crafting/index.ts`**: monta e exporta o objeto `Skill`; registrado em
   `app/loop/skill_registry.ts` sob `"crafting"`; `roles/catalog.ts` (`0002`) atualizado
   pra `artisan.skills = ["crafting"]`, saindo do placeholder `[]`.

6. [x] **Teste automatizado** (sem rede, `GameSession` fake): 13 testes em
   `queue.test.ts`/`planner.test.ts`/`executor.test.ts` — planner nunca chama `craft` de
   novo pra enfileirar quando já há job na fila; `dry_run` negativo resulta em `wait`, não
   erro; `waitForJob` nunca reenfileira, só lê; cada erro do jogo (`insufficient_materials`,
   erro de leitura de fila) mapeado pro `ExecutorResult` certo, nunca lança.

7. [ ] **Validação manual — ciclo completo real** (precisa de `ironvex` migrada pro papel
   `artisan` com material de verdade no storage de uma instalação, ou de uma instalação de
   teste equivalente): enfileirar um job válido, aguardar conclusão via consulta de fila
   (sem reemitir `craft`), confirmar o bem craftado no storage. → critério de sucesso 1
   confirmado. **Também confirma, ou corrige, as duas suposições não confirmadas acima**
   (listar fila via `craft` sem `id`; ausência de checagem proativa de skill de personagem).

8. [ ] **Validação manual — material insuficiente ou skill de personagem insuficiente**:
   confirmar que `dry_run` detecta antes de tentar enfileirar (ou, se não detectar skill
   insuficiente, que o `craft` real ao menos falha com um erro claro, não silencioso).
   → critério de sucesso 2 confirmado.

9. [ ] **Validação manual — não duplicar job**: com um job já na fila, confirmar que a
   skill não envia outro `craft` pro mesmo recurso. → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta. Diferente das specs anteriores, a validação manual real
aqui pode ficar bloqueada até `ironvex` migrar pro papel `artisan` e ter material físico
disponível — se isso não acontecer logo, documentar em `log/00-STATUS.md` como pendência
externa, não como task incompleta por falha de implementação.
