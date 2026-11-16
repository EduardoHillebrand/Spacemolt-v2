# 0009 — Navigation — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: nenhuma feature de skill (`0007`, `0008`, `0011`) pode chamar `goTo` de
> verdade antes deste módulo existir — mas nada aqui depende delas. Pode ser implementado
> isoladamente, com testes de unidade usando um `GameSession` fake.

1. [x] **`app/game_client.types.ts`**: adicionar `Destination` e `NavigationResult`.

2. [x] **`app/core/navigation.ts`**: `goTo(destination, ctx)` — resolve rota (`travel`
   direto se `destination.kind === "poi"`; `find_route` + sequência de `jump` se
   `destination.kind === "system"`, seguido de um `travel` final se o destino remoto for um
   POI específico, já que `find_route` não cobre o trecho intra-sistema final).
   **Correção na implementação**: a leitura linha-a-linha do `SKILL_MANUAL.md` (feita só
   agora, na implementação, não na spec) mostrou que `travel`/`jump`/`find_route`/`mine`/
   `refuel`/`repair`/`scan`/`get_ship`/`get_poi`/`get_system`/`get_cargo` são todos ações do
   **mesmo tool `spacemolt`** (não tools separados como o `plan.md` supôs), com parâmetro
   genérico `id` (não `target_poi`/`target_system`). `find_route` devolve `route` (lista de
   IDs de sistema em ordem) — não "não inclui hops", como a pesquisa inicial sugeriu; só não
   inclui o trecho intra-sistema final, que `goTo` completa com um `travel` extra quando
   `target_poi` (ou `destination.poiId`) existe.

3. [x] **`ensureFuel` dentro do mesmo arquivo**: calcula custo do próximo trecho (com 20%
   de margem, `docs_guides_fuel.md`), reabastece proativamente via `refuel` antes de tentar
   `jump` se a reserva não cobrir — nunca tenta sabendo de antemão que vai faltar
   combustível no meio do caminho.

4. [x] **Mapeamento de erro do jogo pra `NavigationResult`**: qualquer `ok: false`
   devolvido pelo jogo (inclui `no_fuel`, `in_transit`, `action_pending`, `no_route` quando
   `find_route` não encontra caminho) vira `{status: "blocked", code, message}` — nunca
   lança exceção (constituição, regra 6). Campo de "segundos restantes" num erro de trânsito
   não tem nome confirmado pela pesquisa; `extractRetrySeconds` tenta 3 variantes plausíveis
   e devolve `undefined` se nenhuma bater, sem travar nada.

5. [x] **`scoutDestination(destination, ctx)`**: função separada, chama `scan` sem mover a
   nave — usada por quem chama `goTo` só quando quiser checar risco antes.

6. [x] **Teste automatizado** (sem rede, `GameSession` fake): 8 testes em
   `app/core/navigation.test.ts` — trecho único dentro do sistema; múltiplos saltos via
   `find_route.route`; reabastecimento acionado quando a estimativa de combustível não
   cobre o próximo trecho; erro no meio da rota para ali sem tentar os passos seguintes;
   `found: false` vira `no_route`; destino já é o sistema atual chega direto; `scoutDestination`
   nunca lança mesmo com `scan` falhando.

7. [ ] **Validação manual — viagem real dentro do sistema**: `goTo` com um destino do
   sistema atual (ex. `ironvex` ou `hillebot`), confirmar chegada via `get_ship`/posição.
   → critério de sucesso 1 confirmado.

8. [ ] **Validação manual — viagem com múltiplos saltos e reabastecimento forçado**:
   escolher um destino remoto, se possível com a nave começando com combustível abaixo do
   necessário pro trajeto completo — confirmar que `goTo` reabastece no meio sem intervenção
   e chega ao destino. → critério de sucesso 2 confirmado.

9. [ ] **Validação manual — sem combustível e sem crédito pra reabastecer**: forçar esse
   cenário (ex. zerar a reserva de propósito, se o ambiente de teste permitir, ou simular
   via mock no nível de rede) e confirmar que `goTo` devolve um resultado claro, não trava
   nem lança exceção. → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual às specs anteriores. O item 9 pode precisar de
simulação em vez de cenário real, já que zerar combustível de propósito custa recursos reais
de uma conta de jogo de verdade.
