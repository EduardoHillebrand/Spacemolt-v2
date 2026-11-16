# 0007 — Mining — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0009-skill-navigation` e `0010-skill-maintenance` precisam estar
> implementadas (não só especificadas) antes das tasks 4+ abaixo poderem chamá-las de
> verdade — se ainda não estiverem, implementar o mínimo necessário delas aqui mesmo, sem
> duplicar o que já está especificado nessas specs (mesma regra usada em `0006`).

1. [x] **Revisão em `app/roles/catalog.ts`** (spec `0002`, ver `plan.md` desta spec):
   `SkillName` perde `"navigation"`/`"maintenance"`; `miner.skills` passa a ser
   `["mining"]`; `trader.skills` passa a ser `["trading"]`. Nota já estava em
   `specs/0002-accounts-and-roles/tasks.md` desde a escrita desta spec.

2. [x] **`app/skills/mining/state.ts`** (não `equipment.ts` — ver correção abaixo):
   `readShip`/`isCargoFull`, `readPoi`/`hasWorkableNode`, `readSystem`/`findMinablePoi`/
   `findNearestStationPoi`.
   **Correção na implementação**: `equipment.ts` (mapear recurso → harvester necessário)
   não foi implementado como o `plan.md` original previa. A leitura de
   `knowledge_base/distilled/docs_mining.md` linha a linha (feita na implementação, não na
   pesquisa inicial da spec) mostrou que `get_poi` já devolve `too_sparse` por node —
   "`true` quando seu array equipado não pode trabalhar esse depósito de forma alguma
   agora" — ou seja, o próprio jogo já responde "equipamento compatível?" sem precisar
   inspecionar módulos da nave e cruzar com o tipo de recurso à mão. `hasWorkableNode`
   substitui `hasCompatibleEquipment` com uma leitura mais simples e mais correta.

3. [x] **`app/skills/mining/planner.ts`**: `planMining(ctx)` — **desenho revisado**: em vez
   de planos com uma lista de passos (`steps: [...]`) que o Executor percorreria item a
   item, cada ciclo do planner devolve **uma atividade só** (`MiningActivity`, em
   `activity.ts`): `stationStop` (nave docada — vende tudo, repara/confere seguro, undoca,
   tudo atômico, numa função só) tem prioridade sobre tudo; senão, cargo cheio → viaja pra
   estação; senão, POI atual tem node trabalhável → mina; senão → busca e viaja pro próximo
   POI minerável. Motivo da revisão: o loop (`0006`) só chama o planner de novo quando o
   `ExecutorResult` é `done`/`invalidated`/erro — um plano com lista de passos precisaria de
   um índice de progresso que nem `Plan` nem o loop guardam entre chamadas de
   `executor(plan, ctx)` com o mesmo `plan`. Uma atividade por ciclo, reavaliada do zero a
   cada "done", encaixa no loop sem precisar inventar esse índice.

4. [x] **`app/skills/mining/executor.ts`**: `executeMiningStep(plan, ctx)` — `mine()`
   direto (cargo cheio após o pull → `done`, não insiste); `travelToPoi` delega pra `goTo`
   (`0009`); `stationStop` vende via `get_cargo`+`sell`, chama `checkAndRepair`+
   `checkInsurance` (`0010`, autobuy desligado), e undoca — erro em qualquer parte vira
   `error` estruturado, nunca tenta undocar sem ter vendido primeiro.

5. [x] **`app/skills/mining/index.ts`**: monta e exporta o objeto `Skill`; registrado em
   `app/loop/skill_registry.ts` sob `"mining"`.

6. [x] **Teste automatizado** (sem rede, `GameSession` fake): 19 testes em
   `planner.test.ts`/`executor.test.ts` — docada sempre vira `stationStop`; cargo cheio sem
   estação encontrada espera; POI sem node trabalhável busca outro; cada erro documentado
   (`deposit_too_sparse`, `action_pending`/`in_transit`, erro não reconhecido) mapeado pro
   `ExecutorResult` certo; `stationStop` nunca undoca sem vender primeiro.

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
