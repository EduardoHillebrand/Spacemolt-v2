# 0011 — Crafting — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0010-skill-maintenance` (e `0009-skill-navigation`, se a instalação
> exigir deslocamento) precisam estar disponíveis. Diferente de `0007`/`0008`, esta skill
> não depende de `0008-skill-trading` nem de `0013` — consome material já presente.

1. [ ] **`app/skills/crafting/planner.ts`**: `planCrafting(ctx)` — consulta a fila
   primeiro (nunca reemite `craft` se já há job rodando); `chooseRecipe` a partir do
   storage da instalação; checa skill de personagem via `catalog type=character_skills`
   contra `catalog type=recipes`; cota via `dry_run` antes de comprometer.

2. [ ] **`app/skills/crafting/executor.ts`**: `executeCraftingStep(plan, ctx)` — enfileira
   (`enqueue`), acompanha (`waitForCompletion` via `action: "queue"`, nunca reemite
   `craft`), mapeamento de erro da tabela do `plan.md`.

3. [ ] **`app/skills/crafting/index.ts`**: monta e exporta o objeto `Skill`; registra em
   `app/loop/skill_registry.ts` (spec `0006`) sob o nome `"crafting"`; atualiza
   `roles/catalog.ts` (`0002`) pra `artisan.skills = ["crafting"]` (saindo do placeholder
   `[]` — nota: isso já estava previsto como revisão pendente desde `0007`, ver `plan.md`
   daquela spec).

4. [ ] **Teste automatizado** (sem rede, `GameSession` fake): planner nunca reemite `craft`
   quando já há job na fila; planner detecta receita skill-gated sem nível suficiente e
   nunca tenta enfileirar; `dry_run` negativo (não afordável) resulta em plano vazio/idle,
   não erro; cada erro documentado mapeado pro `ExecutorResult` certo.

5. [ ] **Validação manual — ciclo completo real** (precisa de `ironvex` migrada pro papel
   `artisan` com material de verdade no storage de uma instalação, ou de uma instalação de
   teste equivalente): enfileirar um job válido, aguardar conclusão via consulta de fila
   (sem reemitir `craft`), confirmar o bem craftado no storage. → critério de sucesso 1
   confirmado.

6. [ ] **Validação manual — material insuficiente ou skill de personagem insuficiente**:
   confirmar que a skill detecta via `dry_run`/`catalog` antes de tentar enfileirar.
   → critério de sucesso 2 confirmado.

7. [ ] **Validação manual — não duplicar job**: com um job já na fila, confirmar que a
   skill não envia outro `craft` pro mesmo recurso. → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 5–7 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta. Diferente das specs anteriores, a validação manual real
aqui pode ficar bloqueada até `ironvex` migrar pro papel `artisan` e ter material físico
disponível — se isso não acontecer logo, documentar em `log/00-STATUS.md` como pendência
externa, não como task incompleta por falha de implementação.
