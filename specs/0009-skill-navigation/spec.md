# 0009 — Navigation

> **Nota de arquitetura (2026-11-14)**: esta feature nasceu no backlog como
> "skill-navigation", par das demais. A pesquisa feita antes de escrever esta spec (lendo
> `knowledge_base/distilled/docs_travel.md`, `docs_guides_fuel.md`, `docs_scanning.md` e a
> seção `spacemolt_ship`/`spacemolt_intel` do `SKILL_MANUAL.md`) mostrou que a API do jogo
> não tem "navegação" como atividade com objetivo próprio — só dois verbos primitivos
> (`travel`, `jump`) e uma função de cálculo de rota (`find_route`), sem estado de "pra onde
> eu quero ir e por quê". Por isso esta feature **não é uma skill que compete no loop**
> (constituição, regra 2/3 — Planner/Executor por skill registrada); é um **módulo
> compartilhado** que `mining` (`0007`), `trading` (`0008`) e `crafting` (`0011`) chamam de
> dentro do próprio Executor delas, exatamente como a constituição (regra 5) prevê: "se duas
> skills precisam da mesma coisa, ela sobe pra `core`". Mantém o número `0009` e a pasta
> pelo backlog já publicado em `specs/README.md`, mas o conteúdo abaixo já reflete essa
> correção — não houve código escrito sob a suposição antiga, então não há nada a desfazer.

## O quê

Existe uma função única e reutilizável, `goTo(destination, ctx)`, que move a nave ativa da
conta de onde ela está até um destino (um POI do sistema atual, ou um POI/sistema remoto que
exige um ou mais `jump`), cuidando de: calcular a rota, confirmar que há combustível
suficiente (reabastecendo antes se não houver), executar os saltos/deslocamentos na ordem
certa, e devolver um resultado claro — nunca decidir por conta própria o que fazer quando
algo impede a viagem (isso é problema de quem chamou, constituição regra 2.1).

## Por quê

- `mining`, `trading` e `crafting` precisam todas se mover entre pontos (POI de minério →
  estação; estação de compra → estação de venda; estação com material → estação/instalação
  de crafting). Sem este módulo, cada uma reimplementaria "calcular rota, checar
  combustível, executar jump/travel, tratar erro de trânsito" — exatamente a duplicação que
  a constituição (regra 5) proíbe.
- Combustível (`docs_guides_fuel.md`) é consumido de uma vez, adiantado, no início de
  `travel`/`jump` — um erro de contabilidade (ex. calcular errado quanto falta) tranca a
  nave no lugar sem resgate automático (`no_fuel`: "fica parada no lugar, sem guincho nem
  respawn", só sai via fuel cell, outro jogador, ou `distress_signal` com cooldown de 1h).
  Isso é caro demais pra deixar cada skill reimplementar à sua maneira.

## Requisitos funcionais

1. `goTo(destination, ctx)` resolve a rota entre a posição atual da nave e o `destination`
   (POI do sistema atual via `travel`, ou sistema remoto via uma sequência de `jump`
   calculada por `find_route`) e executa os passos na ordem.
2. **Confere combustível antes de cada trecho**, não só no início: se a reserva ficar abaixo
   do necessário pro próximo salto, reabastece primeiro (`refuel`, ordem de preferência já
   documentada: reserva de facção grátis → tanque de estação pago → fuel cell do cargo).
   Nunca tenta um `jump`/`travel` sabendo de antemão que vai faltar combustível no meio do
   caminho.
3. **Nunca decide o que fazer diante de um risco de rota** (fronteira com fiscalização,
   sistema sem lei/sem polícia, sinal de socorro suspeito) — apenas devolve essas condições
   como parte do resultado, pra quem chamou (o Planner da skill que invocou `goTo`) decidir
   se vale seguir, desviar ou abortar.
4. **Resultado estruturado e claro** (constituição, regra 6) em toda chamada: chegou com
   sucesso; ainda em trânsito (ex. erro `in_transit`, com segundos restantes, se algo tentar
   interagir antes de a viagem terminar); ou impedido, com o motivo exato (`no_fuel`, ID de
   destino inexistente, `action_pending`, `station_under_attack` no destino, etc.) — nunca
   lança exceção nem trava esperando sem reportar nada.
5. **Scan opcional antes de ir**: expõe uma forma de consultar o que existe num POI/sistema
   remoto (`scan`/`get_system`) antes de comprometer a viagem, pra quem chama decidir se
   quer essa informação — `goTo` não faz isso automaticamente por padrão (custaria tempo/
   ações extras em todo deslocamento, mesmo quando não é preciso).
6. **Não assume uma skill-dona**: qualquer código do agente (qualquer skill futura também)
   pode chamar `goTo` sem precisar saber que `mining`/`trading`/`crafting` existem — é uma
   dependência de `app/core/`, não de uma skill específica.

## Fora do escopo desta spec

- **Decidir pra onde ir e por quê** — isso é sempre do Planner da skill que chama `goTo`
  (ex. "ir pro POI de ferro mais próximo" é decisão de `mining`, não deste módulo).
- **Ser uma skill registrada no `skill_registry`** (spec `0006`) — não aparece em
  `roles/catalog.ts` como algo que o loop escolhe rodar sozinho; não tem Planner/Executor
  próprios nesse sentido, só a função `goTo`.
- **Combate ou fuga durante um ataque em trânsito** — fora do que os docs lidos cobrem; se a
  nave for destruída no meio de um `jump`/`travel`, o comportamento exato não está
  documentado (ver `plan.md`, riscos assumidos) — tratado como erro genérico até validação
  manual dizer o contrário.
- **Estimar valor/tempo de uma rota pra decidir se "vale a viagem"** (ex. pra arbitragem de
  trading) — `goTo` informa custo de combustível e nº de saltos quando `find_route` devolve
  isso; decidir se compensa é de quem chama.

## Critério de sucesso

- Uma skill chama `goTo` pra um POI do sistema atual e a nave chega lá, confirmado via
  `get_ship`/posição atual.
- Uma skill chama `goTo` pra um destino que exige saltos entre sistemas, com a nave partindo
  com combustível insuficiente pro trajeto completo — `goTo` reabastece no meio do caminho
  sem que a skill precise pedir isso explicitamente, e a nave chega.
- Forçar `goTo` numa situação sem combustível nenhum e sem crédito pra reabastecer: devolve
  um resultado claro (`no_fuel` ou equivalente), a nave fica onde estava, e quem chamou
  consegue decidir o que fazer a seguir (não trava, não lança exceção).
