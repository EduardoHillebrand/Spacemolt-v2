# 0007 — Mining — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0009-skill-navigation` e `0010-skill-maintenance` precisam estar
> implementadas (não só especificadas) antes das tasks 4+ abaixo poderem chamá-las de
> verdade — se ainda não estiverem, implementar o mínimo necessário delas aqui mesmo, sem
> duplicar o que já está especificado nessas specs (mesma regra usada em `0006`).

1. [ ] **Revisão em `app/roles/catalog.ts`** (spec `0002`, ver `plan.md` desta spec):
   `SkillName` perde `"navigation"`/`"maintenance"`; `miner.skills` passa a ser
   `["mining"]`; `trader.skills` passa a ser `["trading"]`. Adicionar nota em
   `specs/0002-accounts-and-roles/tasks.md` explicando a revisão (sem apagar os itens já
   marcados).

2. [ ] **`app/skills/mining/equipment.ts`**: `requiredHarvester(resource)`,
   `hasCompatibleEquipment(ship, resource)`.

3. [ ] **`app/skills/mining/planner.ts`**: `planMining(ctx)` — cargo cheio → volta à
   estação; equipamento incompatível ou depósito esgotado → busca novo POI; caso contrário
   → plano de minerar com as condições de invalidação da tabela do `plan.md`.

4. [ ] **`app/skills/mining/executor.ts`**: `executeMiningStep(plan, ctx)` — chama `mine()`
   direto, ou delega pra `goTo` (`0009`)/`checkAndRepair`+`checkInsurance` (`0010`) nos
   passos correspondentes, com o mapeamento de erro da tabela do `plan.md`.

5. [ ] **`app/skills/mining/index.ts`**: monta e exporta o objeto `Skill` completo;
   registra em `app/loop/skill_registry.ts` (spec `0006`) sob o nome `"mining"`.

6. [ ] **Teste automatizado** (sem rede, `GameSession`/`goTo`/`checkAndRepair` fakes):
   planner escolhe voltar à estação com cargo cheio; planner busca novo POI com equipamento
   incompatível ou depósito esgotado; executor mapeia cada erro documentado pro
   `ExecutorResult` certo; erro desconhecido nunca lança.

7. [ ] **Validação manual — ciclo completo real** (`HilleBot`, papel `miner`): deixar a
   skill rodando tempo suficiente pra minerar, voltar, vender, e sair de novo pelo menos uma
   vez, confirmado via devlog e créditos antes/depois. → critério de sucesso 1 confirmado.

8. [ ] **Validação manual — cargo cheio**: confirmar que a skill detecta e volta à estação
   sem intervenção manual. → critério de sucesso 2 confirmado.

9. [ ] **Validação manual — depósito esgotado ou equipamento incompatível**: forçar (ou
   aguardar) esse cenário e confirmar replanejamento pra outro POI em vez de insistência.
   → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual às specs anteriores.
