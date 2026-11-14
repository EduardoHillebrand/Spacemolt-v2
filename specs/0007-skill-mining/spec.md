# 0007 — Mining

## O quê

Existe uma skill `mining` (spec `0006`, contrato `Skill`) que, enquanto estiver ativa pro
papel de uma conta (hoje: `miner` — `HilleBot`, e `ironvex` enquanto não migrar pra
`artisan`), mantém a nave minerando continuamente: escolhe um POI minerável compatível com o
equipamento instalado, mantém o laser/harvester funcionando, detecta cargo cheio ou depósito
esgotado, volta à estação pra vender e repor (usando os módulos de `0009-navigation` e
`0010-maintenance`), e sai pra minerar de novo — sem intervenção manual, pra sempre, até o
papel da conta mudar ou o processo parar.

## Por quê

- É o primeiro papel real de `HilleBot` desde o início do projeto (ver
  `log/contas-e-papeis.md`) — sem esta skill, `0006-agent-loop` não tem nada de verdade pra
  rodar, só a skill fake usada nas validações manuais.
- Minerar é a base da visão econômica de longo prazo do projeto (minerador → artesão →
  comerciante, todas no Solarian) — sem minério fluindo, nenhuma das outras duas pontas
  (crafting, trading) tem o que processar ou vender.

## Requisitos funcionais

1. **Ao ganhar o turno do loop** (spec `0006`), o Planner decide: continuar minerando no POI
   atual (se ainda tem o que minerar e o equipamento bate com o recurso de lá), ir pra outro
   POI minerável, ou voltar à estação (cargo cheio, depósito esgotado/`too_sparse`, ou
   `checkAndRepair`/`checkInsurance` indicando que vale a parada).
2. **Executor chama `mine()` repetidamente** enquanto o plano continuar válido, tratando
   cada pull (`mining_yield`) como progresso — nunca lança exceção se um pull não rende nada
   (ex. depósito raleando), reporta como parte do estado observável do plano.
3. **Detecta falta de equipamento compatível** com o recurso do POI atual (ex. tentando
   minerar gás sem Gas Harvester instalado) como condição de invalidação — nunca insiste
   tentando `mine()` repetidamente contra um erro que não vai se resolver sozinho.
4. **Cargo cheio dispara volta à estação**: ao perceber (via `get_ship`/`get_cargo`) que não
   há mais espaço, o plano é invalidado e o Executor usa `goTo` (`0009`) pra voltar, depois
   vende (`sell`) ou deposita (`spacemolt_storage.deposit`) a carga.
5. **Reparo e seguro são checados na mesma parada de venda**, não em viagem extra dedicada —
   ao estar docado pra vender, o Executor chama `checkAndRepair`/`checkInsurance` (`0010`)
   antes de sair pra minerar de novo.
6. **Depósito esgotado (`too_sparse`) ou erros de trânsito reportados por `goTo`** disparam
   replanejamento (constituição, regra 2.1) — o Planner escolhe outro POI ou volta à
   estação, nunca o Executor decide isso sozinho.
7. **Erro sempre estruturado** (constituição, regra 6): `action_pending`, `in_transit`,
   `too_sparse`, falta de equipamento, erro de `goTo`/`checkAndRepair` repassado — tudo isso
   vira `ExecutorResult` claro (`invalidated` ou `error`), nunca exceção não tratada.

## Fora do escopo desta spec

- **Frota multi-nave simultânea**: a pesquisa confirmou que uma conta só pilota **uma** nave
  ativa por vez (`switch_ship` troca qual nave está ativa, mas não há controle simultâneo de
  várias dentro de uma sessão). O objetivo de longo prazo do `catalog.ts` ("multi-ship fleet
  specialized by resource type") **não é implementado aqui** — esta skill assume sempre uma
  única nave ativa. Trocar de nave/especialização via `switch_ship` fica como extensão
  futura, fora do backlog atual.
- **Otimizar qual minério vale mais** (ferro vs. titânio vs. cristal raro): os próprios
  guias do jogo desencorajam isso no início ("minere o que está mais próximo primeiro") —
  esta skill não implementa uma heurística de valor por recurso; escolher o POI mais
  próximo/acessível com equipamento compatível é suficiente pro escopo de hoje.
- **Arbitragem/decisão de preço de venda**: vender a carga minerada aqui é só "não ficar
  parado com o cargo cheio" — decidir a melhor estação pra vender, ou aguardar um preço
  melhor, é escopo de `0008-skill-trading`, não desta skill.
- **Deep-core mining** (requer survey prévio e Deep Core Extractor) — documentado como
  recurso oculto adicional; fora do escopo inicial, revisitar quando a conta tiver esse
  equipamento.
- **Combate/fuga de hostis durante a mineração** — reportado por `goTo` (`0009`) como
  condição de invalidação quando detectável; esta skill não implementa nenhuma lógica de
  combate própria.

## Critério de sucesso

- `HilleBot` (papel `miner`) rodando com esta skill ativa minera continuamente, sem travar,
  por tempo suficiente pra esgotar e voltar a um depósito pelo menos uma vez — confirmado
  via devlog (`0005`) e inspeção de créditos/cargo antes e depois.
- Forçar cargo cheio (ou aguardar isso acontecer naturalmente): a skill volta à estação,
  vende, repara/confirma seguro se necessário, e volta a minerar sem intervenção manual.
- Forçar uma condição de depósito esgotado (`too_sparse`) ou falta de equipamento: a skill
  replaneja pra outro POI em vez de insistir contra o mesmo erro repetidamente.
