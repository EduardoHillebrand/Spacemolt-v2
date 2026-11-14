# 0010 — Maintenance — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: nenhuma, igual a `0009` — pode ser implementado isoladamente com um
> `GameSession` fake.

1. [ ] **`app/game_client.types.ts`**: adicionar `RepairResult` e `InsuranceResult`.

2. [ ] **`app/core/maintenance.ts`**: `checkAndRepair(ctx, opts?)` — leitura do casco,
   comparação com `DEFAULT_REPAIR_THRESHOLD_PERCENT`, escolha automática de método
   (crédito se docada, repair kit se no espaço), variante `target: "fleet"` gratuita.

3. [ ] **`checkInsurance(ctx, opts?)`** no mesmo arquivo — lê apólice, compra só se
   `autobuy: true`.

4. [ ] **Mapeamento de erro pra `RepairResult`/`InsuranceResult`**: qualquer coisa não
   reconhecida cai em `blocked` com `code: "unknown_repair_error"`/`"unknown_insurance_error"`,
   nunca lança exceção (constituição, regra 6).

5. [ ] **Teste automatizado** (sem rede, `GameSession` fake): casco acima do limiar não
   repara; casco abaixo repara via crédito quando docada; repara via kit quando no espaço;
   `target: "fleet"` nunca chama o comando de reparo pago; `autobuy: false` nunca compra
   seguro; erro desconhecido nunca lança.

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
