# 0010 — Maintenance — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: nenhuma, igual a `0009` — pode ser implementado isoladamente com um
> `GameSession` fake.

1. [x] **`app/game_client.types.ts`**: adicionar `RepairResult` e `InsuranceResult`.

2. [x] **`app/core/maintenance.ts`**: `checkAndRepair(ctx, opts?)` — leitura do casco
   (`get_ship`, tool `spacemolt`), comparação com `DEFAULT_REPAIR_THRESHOLD_PERCENT`,
   escolha automática de método (crédito se docada, repair kit se no espaço).
   **Correção na implementação**: a variante gratuita `repair target=fleet` citada na
   pesquisa inicial não apareceu na leitura linha-a-linha do `SKILL_MANUAL.md` — `repair`
   lá é `repair(id?, quantity?, target?)` sob o tool `spacemolt`, sem menção a um modo
   "fleet" sem custo. Trocado por uma leitura simples via `get_ship` (query, sem custo, já
   confirmada) pra decidir se vale reparar, sem depender de um comportamento não confirmado.

3. [x] **`checkInsurance(ctx, opts?)`** no mesmo arquivo — **nomes de ação corrigidos na
   implementação**: o manual real usa `spacemolt_salvage.policies()` (não `view_insurance`)
   e `spacemolt_salvage.insure()` (não `buy_insurance`), como o `plan.md` original supôs
   antes de checar o manual linha a linha. Compra só se `autobuy: true`.

4. [x] **Mapeamento de erro pra `RepairResult`/`InsuranceResult`**: qualquer `ok: false`
   do jogo vira `{status: "blocked", code, message}` repassando o código real — nunca lança
   exceção (constituição, regra 6).

5. [x] **Teste automatizado** (sem rede, `GameSession` fake): 8 testes em
   `app/core/maintenance.test.ts` — casco acima do limiar não repara; casco abaixo repara
   via crédito quando docada; repara via kit quando no espaço; limiar customizado via opção
   é respeitado; sem crédito/kit devolve `blocked`; `checkInsurance` confirma apólice válida
   sem comprar; sem apólice e `autobuy` desligado (default) não compra; `autobuy: true`
   compra quando necessário.

6. [ ] **Validação manual — reparo real docado**: forçar (ou aguardar) casco abaixo do
   limiar numa conta real, confirmar reparo via crédito e casco subindo em `get_ship`.
   → critério de sucesso 1 confirmado.

7. [ ] **Validação manual — reparo real com repair kit no espaço**: mesma checagem, com a
   nave fora da estação e um repair kit no cargo. → critério de sucesso 2 confirmado.

8. [ ] **Validação manual — sem crédito e sem kit**: confirmar resultado claro de
   impedimento, sem travar. → critério de sucesso 3 confirmado.

9. [ ] **Validação manual — seguro**: confirmar leitura de `checkInsurance` contra uma
   apólice real válida e uma expirada/inexistente. → critério de sucesso 4 confirmado
   (parte real da checagem; a parte sem precisar arriscar a nave já é cobrida pelo teste
   automatizado do item 5).

## Nota sobre granularidade

Itens 6–9 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual às specs anteriores. O limiar de reparo (70%, ver
`plan.md`) pode ser ajustado depois de observar o jogo de verdade, sem precisar de uma spec
nova — é uma constante, não um contrato.
