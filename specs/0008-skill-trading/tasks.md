# 0008 — Trading — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0009-skill-navigation`, `0010-skill-maintenance` e `0003-memory` (já
> implementada) precisam estar disponíveis antes das tasks 4+ chamarem isso de verdade.

1. [x] **`app/skills/trading/profitability.ts`**: `estimateNetProfit(route, quantity,
   saleTaxRateBps)` — usa `ask` da origem e `bid` do destino, nunca invertidos.

2. [x] **`app/skills/trading/market_memory.ts`** (não previsto nominalmente no `plan.md`
   original, mas é a forma real de persistir rotas — ver correção abaixo):
   `PriceObservation`, `rememberObservation`/`recallObservations` (guarda o dado
   estruturado em `MemoryEntry.context` como JSON, texto em prosa fica só pro embedding
   semântico), `bestRouteFromObservations` (combina observações de estações diferentes pro
   mesmo item).

3. [x] **`app/skills/trading/planner.ts`**: `planTrading(ctx)` — **desenho revisado**,
   mesmo padrão de `0007`: uma atividade por ciclo (`stationStop` | `travelToPoi` | `wait` |
   `fail`), não uma lista de passos. Docada → `stationStop` sempre (vender, manter, decidir
   rota); não docada → volta pra estação mais próxima (só acontece após interrupção, já que
   uma rota inteira é executada atomicamente dentro do `executor`).

4. [x] **`app/skills/trading/executor.ts`**: `executeTradingStep(plan, ctx)`.
   **Correção na implementação**: `buy`/`sell` são ações do tool core `spacemolt` (não
   `spacemolt_market`, como o `plan.md` original supôs) — só `view_market`/
   `estimate_purchase`/`analyze_market`/`create_*_order` são de fato `spacemolt_market`
   (confirmado lendo o `SKILL_MANUAL.md` linha a linha). `stationStop` vende cargo
   existente, repara/confere seguro (`0010`), observa o mercado local (`view_market`),
   combina com observações antigas da memória, e se achar uma rota com lucro líquido > 0
   (`estimateNetProfit`, taxa via `get_empire_info`, nome do campo não confirmado), executa
   a rota inteira (ir à origem, `estimate_purchase`, `buy`, ir ao destino, `sell`) numa só
   chamada atômica — nunca em vários ciclos de planner/executor separados.

5. [x] **Gravação em memória de longo prazo** (spec `0003`): toda observação de mercado
   (não só rotas confirmadas) é gravada via `rememberObservation` — tanto a observação
   local de cada parada quanto a confirmação pós-venda no destino de uma rota executada.

6. [x] **`app/skills/trading/index.ts`**: monta e exporta o objeto `Skill`; registrado em
   `app/loop/skill_registry.ts` sob `"trading"`.

7. [x] **Teste automatizado** (sem rede, fakes de `GameSession`/memória): 28 testes em
   `profitability.test.ts`/`market_memory.test.ts`/`planner.test.ts`/`executor.test.ts` —
   `estimateNetProfit` calcula certo (incluindo imposto zerando/negativando o lucro);
   `bestRouteFromObservations` nunca propõe comprar e vender na mesma estação; `stationStop`
   combina observação nova + memória antiga e executa a rota encontrada (ou só observa e
   undoca sem rota lucrativa); bloqueio em qualquer trecho da rota invalida sem tentar os
   passos seguintes.

8. [ ] **Validação manual — ciclo completo real** (`Medici`, papel `trader`): completar
   pelo menos uma compra numa estação e venda com lucro positivo noutra, confirmado via
   devlog e créditos antes/depois. → critério de sucesso 1 confirmado.

9. [ ] **Validação manual — cargo cheio ou crédito insuficiente**: forçar um desses
   cenários e confirmar que a skill detecta antes de tentar (não falha de forma confusa).
   → critério de sucesso 2 confirmado.

10. [ ] **Validação manual — memória influenciando decisão**: confirmar que uma rota boa
    encontrada numa sessão é usada (via `recall`) pra decidir a próxima ação numa sessão
    posterior, sem precisar redescobrir do zero. → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 8–10 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual às specs anteriores.
