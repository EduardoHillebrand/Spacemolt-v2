# 0008 — Trading — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0009-skill-navigation`, `0010-skill-maintenance` e `0003-memory` (já
> implementada) precisam estar disponíveis antes das tasks 4+ chamarem isso de verdade.

1. [ ] **`app/skills/trading/profitability.ts`**: `estimateNetProfit(route, quantity,
   saleTaxRateBps)` — usa `ask` da origem e `bid` do destino, nunca invertidos.

2. [ ] **`app/skills/trading/planner.ts`**: `planTrading(ctx)` — vender aqui se já docada
   com carga rentável; comprar e viajar se há rota conhecida boa (via `ctx.memory.recall`,
   reconfirmada por `view_market` antes de agir); buscar/avaliar nova estação se não há
   rota conhecida boa.

3. [ ] **`app/skills/trading/executor.ts`**: `executeTradingStep(plan, ctx)` — `buy`/`sell`
   mecânicos, `estimate_purchase` antes de comprar, delega pra `goTo`/`checkAndRepair`+
   `checkInsurance` nos passos correspondentes, mapeamento de erro da tabela do `plan.md`.

4. [ ] **Gravação em memória de longo prazo** (spec `0003`): ao confirmar um spread lucrativo
   de verdade (depois de vender), `ctx.memory.remember(...)` a rota.

5. [ ] **`app/skills/trading/index.ts`**: monta e exporta o objeto `Skill`; registra em
   `app/loop/skill_registry.ts` (spec `0006`) sob o nome `"trading"`.

6. [ ] **Teste automatizado** (sem rede, fakes de `GameSession`/`goTo`/`checkAndRepair`/
   memória): `estimateNetProfit` calcula certo (incluindo o caso de imposto zerar o lucro);
   planner escolhe vender quando já docada com carga rentável; planner escolhe comprar
   quando há rota conhecida boa; cada erro documentado mapeado pro `ExecutorResult` certo.

7. [ ] **Validação manual — ciclo completo real** (`Medici`, papel `trader`): completar
   pelo menos uma compra numa estação e venda com lucro positivo noutra, confirmado via
   devlog e créditos antes/depois. → critério de sucesso 1 confirmado.

8. [ ] **Validação manual — cargo cheio ou crédito insuficiente**: forçar um desses
   cenários e confirmar que a skill detecta antes de tentar (não falha de forma confusa).
   → critério de sucesso 2 confirmado.

9. [ ] **Validação manual — memória influenciando decisão**: confirmar que uma rota boa
   encontrada numa sessão é usada (via `recall`) pra decidir a próxima ação numa sessão
   posterior, sem precisar redescobrir do zero. → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual às specs anteriores.
