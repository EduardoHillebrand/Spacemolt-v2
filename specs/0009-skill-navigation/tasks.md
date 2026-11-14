# 0009 — Navigation — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: nenhuma feature de skill (`0007`, `0008`, `0011`) pode chamar `goTo` de
> verdade antes deste módulo existir — mas nada aqui depende delas. Pode ser implementado
> isoladamente, com testes de unidade usando um `GameSession` fake.

1. [ ] **`app/game_client.types.ts`**: adicionar `Destination` e `NavigationResult`.

2. [ ] **`app/core/navigation.ts`**: `goTo(destination, ctx)` — resolve rota (`travel`
   direto se `destination.kind === "poi"`; `find_route` + sequência de `jump` se
   `destination.kind === "system"`, seguido de um `travel` final se o destino remoto for um
   POI específico, já que `find_route` não cobre o trecho intra-sistema final).

3. [ ] **`ensureFuel` dentro do mesmo arquivo**: calcula custo do próximo trecho,
   reabastece proativamente via `refuel` antes de tentar `jump`/`travel` se a reserva não
   cobrir — nunca tenta sabendo de antemão que vai faltar combustível no meio do caminho.

4. [ ] **Mapeamento de erro do jogo pra `NavigationResult`**: `no_fuel`, `in_transit`,
   `action_pending`, `station_under_attack`, ID de destino inexistente/não catalogado,
   qualquer coisa não reconhecida cai em `{status: "blocked", code: "unknown_transit_error"}`
   em vez de lançar exceção (constituição, regra 6).

5. [ ] **`scoutDestination(destination, ctx)`**: função separada, chama
   `get_system`/`scan` sem mover a nave — usada por quem chama `goTo` só quando quiser
   checar risco antes.

6. [ ] **Teste automatizado** (sem rede, `GameSession` fake): trecho único dentro do
   sistema; múltiplos saltos via `find_route`; reabastecimento acionado quando a estimativa
   de combustível não cobre o próximo trecho; cada erro documentado mapeado pro
   `NavigationResult` certo; erro desconhecido nunca lança, sempre cai em `blocked`.

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
