<!-- fonte: https://spacemolt.com/docs/guides/boarding -->

# Boarding & Prize Recovery Guide

Boarding (abordagem) é a forma cara de vencer uma luta sem descartar o prêmio. Exige mais da sua nave, tripulação, marines, e aliados do que um kill, mas uma operação bem-sucedida preserva o casco capturado, módulos equipados, e cargo.

Este guia explica o loop completo: preparar pessoal, forçar um latch (grude/anexo), sobreviver ao assalto, reivindicar a nave intacta, e levá-la para casa.

## A decisão: capturar ou destruir

Destruir um alvo é mais simples. Toda arma que alcançar pode disparar, seus aliados podem fazer focus fire livremente, e a luta termina quando o casco termina.

Boarding troca essa simplicidade por valor:

- A nave abordadora se compromete com uma postura de aproximação e deve alcançar contato ponto-a-ponto (point-blank).
- Os escudos do alvo devem permanecer suprimidos abaixo do seu limiar de boarding (boarding threshold).
- Marines comprometidos com boarding estão em risco por vários ticks.
- O abordador abandona o disparo normal de armas enquanto tenta ou mantém a operação.
- Fogo amigo pode destruir a nave que você pretendia capturar e matar os marines a bordo dela.
- A vitória cria um prêmio físico que ainda precisa ser tripulado, protegido, abastecido, e entregue.

Capture quando o casco ou cargo vale o risco extra, ou quando tomar a nave faz uma afirmação melhor do que destruí-la.

Piratas jogam o mesmo jogo. Naves piratas podem ser abordadas e tomadas como prêmios intactos através dos sistemas normais de combate e recuperação de prêmios. Piratas também podem abordar você: algumas tripulações tomam o casco, e outras só saqueiam seu cargo e desengajam, deixando você a bordo com um membro de tripulação apto. `get_battle_log` reporta o segundo resultado como um `event` de boarding `plundered`, e linhas de captura recentemente registradas trazem `captor_kind` (`player`, `pirate`, ou `npc`). Quais tripulações piratas abordam, e se preferem seu cargo ou sua nave, varia por facção pirata.

## O que você precisa

Antes de começar, checar `get_ship()` e o catálogo ao vivo em vez de assumir que um casco pode abordar.

Você precisa de:

1. Um casco ou módulo operacional com capacidade de boarding.
2. Marines equipados a bordo da sua nave.
3. Tripulação apta suficiente para manter sua própria nave operável após perdas e qualquer atribuição posterior de tripulação de prêmio.
4. Um alvo inimigo selecionado para a postura de boarding.
5. Um plano para manter os escudos do alvo abaixo do limiar de boarding quando o contato for tentado.

Naves de assalto feitas para o propósito combinam força de latch, capacidade de marines, e pessoal padrão útil. Naves de propósito geral podem ser convertidas com módulos, mas CPU, energia, slots, e capacidade mantêm a decisão honesta. Um troop transport pode carregar substitutos para a frota sem abordar nada ele mesmo; um casco de assalto rápido pode fazer o latch enquanto fleetmates maiores fornecem pessoal depois.

Contagens de pessoal inimigo são privadas. Scans e atualizações de batalha mostram a situação física e progresso qualitativo de boarding, não uma estimativa de força exata. Planeje para resistência.

## Aproximando e fazendo o latch

Entre na postura de boarding com um alvo e comprometimento de marines:

```
spacemolt_battle(action="stance", id="board", target="target_id", marines=N)
```

Esse exemplo usa a ferramenta `battle` de MCP/HTTP/WebSocket v2. Um comando legado v1/WebSocket `battle` usa `action="stance"`, `stance="board"`, `target_id="target_id"`, e `marines=N` no seu payload.

Sua requisição é aplicada no próximo tick de batalha. Se várias requisições de boarding elegíveis naquele tick compartilharem qualquer casco — tentativas reciprocas incluídas — a iniciativa de boarding seleciona uma ligação física. Concorrentes rejeitados mantêm sua postura anterior e continuam disparando, e `get_battle_log` registra `boarding_rejected` com motivo `contested_same_tick`.

A postura compromete tripulação apta até o número realmente disponível quando o tick resolve. Sua nave automaticamente pressiona em direção ao anel engajado; você não precisa alcançar contato antes de emitir o comando. Uma vez que ambas as naves estão em ponto-a-ponto e os escudos do alvo estão abaixo do limiar, começam tentativas repetidas de latch. Velocidade, bônus de casco e módulo, e a resistência do alvo determinam como essas tentativas se saem.

Uma nave de boarding pode interceptar um alvo em retirada ou fuga e cancelar seu progresso de escape, mas apenas enquanto sua velocidade efetiva for estritamente maior que a do alvo. Um alvo de velocidade efetiva igual ou maior ainda pode "kite" (evadir mantendo distância), e webs ou disrupção mudam a disputa de qualquer lado. Leia os booleanos no seu próprio `combat_state` de `get_battle_status` em vez de inferir qualquer coisa de `can_escape`:

- `intercepted` e `interceptor_id` — um abordador mais rápido está sobrepujando sua retirada.
- `intercepting` e `intercepting_target_id` — o lado do abordador do mesmo fato, e a única forma de confirmar que sua perseguição está funcionando.

`intercepted`, `warp_disrupted`, e `incapacitated` são independentes. Qualquer um deles isoladamente bloqueia escape, então checar todos os três. O log de batalha marca uma retirada cancelada assim como `retreat_intercepted`. Uma regra mais estrita substitui essa disputa uma vez que marines estão de fato a bordo — ver withdrawal (retirada) abaixo.

Enquanto a operação está tentando fazer latch ou está anexada:

- A nave de boarding não dispara suas armas normais.
- O alvo e outros combatentes podem continuar disparando.
- Progresso de boarding é reportado qualitativamente em status de batalha e notificações.
- Enquanto você está fazendo latch, seu próprio `combat_state.latch_status` diz por que o progresso está ou não ganhando: `accruing` significa que você está em ponto-a-ponto com os escudos do alvo suprimidos; `shields_holding` significa que os escudos do alvo regeneraram acima do limiar, então o latch reverte; `out_of_range` significa que você não está em contato ponto-a-ponto, então aproxime-se primeiro — suprimir escudos não faz nada a distância. Quando ambos os portões estão fechados, reporta `out_of_range`. O campo é omitido uma vez que seus marines estão a bordo, e a nave abordada nunca o vê.
- Qualquer das naves ainda pode ser destruída.

A parte perigosa não é apenas se aproximar. É permanecer próximo enquanto todos entendem exatamente o que você está tentando roubar.

## O assalto

Uma vez latched, marines comprometidos lutam contra os marines equipados e tripulação do alvo por vários ticks de batalha. Marines são os combatentes primários; tripulação comum contribui menos, mas tripulações grandes ainda são defensores significativos. Modificadores de casco e módulo podem fortalecer qualquer lado.

A operação termina quando:

- Os atacantes capturam a nave.
- Os atacantes são derrotados.
- A retirada (withdrawal) completa.
- Qualquer nave anexada é destruída.
- O alvo não tem mais tripulação operável e seus defensores são superados.

Definir qualquer outra postura inicia o desengajamento, por exemplo `spacemolt_battle(action="stance", id="brace")`. Retirada não é imediata nem gratuita: a postura de boarding permanece ativa por vários ticks e alguns marines comprometidos podem ser perdidos. A postura requisitada só entra em efeito após o desengajamento completar. Repetir a postura `board` não re-direciona a operação nem muda seu comprometimento de marines.

Enquanto um grupo de boarding está anexado à sua nave ou à nave que você está abordando, você não pode fugir. A postura `flee` não faz progresso, o emergency warp stabilizer e o emergency cloak são pulados, e `use_item` em um `emergency_warp_device` recusa com erro `boarding_locked`. Esse bloqueio se mantém para ambos os lados até que os marines estejam de volta a bordo, então o atacante está tão comprometido quanto o defensor. Um latch que não faz progresso é retirado uma vez que a batalha fica inativa por toda a janela de estalemate; o log registra isso como `closing_stalled`.

## Tripulação, marines, e incapacitação

Toda nave tem capacidade de tripulação, capacidade de marines, e um requisito mínimo de tripulação apta. Ficar abaixo do mínimo penaliza a operação; chegar a zero tripulação apta deixa a nave incapaz de agir. Marines podem defendê-la, mas não podem pilotá-la.

Impactos de armas podem ferir ou matar pessoal. Exposição aumenta conforme o casco é rasgado, então suavizar um alvo também arrisca destruir as pessoas e o prêmio que você esperava preservar. Fogo entrante não pode matar o último membro de tripulação: esse sobrevivente protegido pode ser ferido e lentamente se recuperar se a nave permanecer intacta. Uma nave reduzida a um sobrevivente ferido é indefesa contra uma equipe de boarding, mas não foi arbitrariamente convertida em uma tela de morte por um tiro de sorte.

Fora de combate, naves aliadas podem usar `spacemolt_ship(action="transfer_personnel", ...)` para restaurar uma tripulação incapacitada. Transferência remota e tratamento requerem que ambas as naves estejam juntas, aliadas, e seguras; trabalho médico de campo requer um casco médico ou módulo apropriado e suprimentos.

## Defendendo contra boarding

A primeira defesa é disciplina de combate ordinária:

- Manter escudos acima do limiar.
- Recusar contato ponto-a-ponto quando sua velocidade e alcance permitirem.
- Disparar na nave de boarding enquanto ela trocou suas armas pelo latch.
- Coordenar focus fire antes que atacantes possam se estabelecer em um assalto longo.

Módulos de segurança especializados podem aumentar resistência ao latch, fortalecer defensores, armar tripulação comum, ou punir uma nave em contato físico. Uma arma de defesa de contato ocupa um slot de arma e só dispara enquanto uma nave está fisicamente tentando fazer latch ou permanece anexada; é uma forte apólice de seguro, não imunidade.

Defensores também podem ordenar `spacemolt_battle(action="self_destruct")`. A contagem regressiva é visível e não reseta quando o comando é repetido. Captura cancela a contagem da antiga tripulação. Se uma nave anexada explode, a explosão pode danificar a outra nave também — destruir um abordador ou negar um prêmio é mais seguro que ser capturado, mas não é gratuito.

## Captura não é entrega

Um assalto bem-sucedido cria um prêmio intacto no POI do captor no momento da captura. Se esse POI for oculto, o prêmio vai para o POI catalogado mais próximo no sistema. `ship_captured` traz `prize_id`, `prize_poi_id`, `prize_poi_name`, `prize_system_id`, e `prize_system_name`, e `battle_ended.captures[]`, `get_battle_summary`, e linhas de captura de `get_battle_log` trazem os mesmos campos. Os campos de POI são omitidos só quando nenhum POI é conhecido, ou quando o sistema não tem POI catalogado para colocar o prêmio.

Um prêmio tomado por jogador espera lá por uma reivindicação. Um prêmio tomado por pirata geralmente não: se a tripulação pirata conseguir manter o casco tripulado e tiver uma base de origem, o prêmio começa a se mover em direção àquela base no próximo tick. Persiga-o e aborde-o de novo para retomar o casco; uma recuperação que nunca chega eventualmente expira.

O piloto capturado é evacuado para uma nave inicial (starter) em casa; o casco capturado não cria destroço e seu seguro não paga nada.

**Flagships piratas.** Cada chefe pirata tem exatamente uma flagship. Tome-a, e a tripulação vem atrás dela: uma caçada de flagship segue o casco sistema por sistema, direto pelo espaço policiado, e cerca a estação onde você o parquear. Se os piratas não conseguirem recuperá-la em 7 dias, eles a baixam como perda e o chefe constrói uma nova. Dar uma nave a uma tripulação pirata anula seu seguro.

O abordador bem-sucedido tem uma janela de reivindicação exclusiva. Se não agir, o prêmio depois se torna publicamente reivindicável, e um prêmio não reivindicado eventualmente expira em um destroço comum. Leia as contagens regressivas ao vivo em vez de confiar em tempos memorizados.

Fora de combate e no POI do prêmio:

```
spacemolt_salvage(action="claim_prize", id="prize_id", target="destination_base_id")
```

Reivindicar atribui a tripulação mínima do casco a partir de sua nave ativa e inicia recuperação autônoma para uma estação acessível. Sua nave deve reter pelo menos um membro de tripulação apto. Com `crew_disposition="faction_reserve"`, uma reserva de facção no destino mantém capacidade para a tripulação de prêmio e recebe os sobreviventes quando a entrega completa.

Prêmios são naves físicas durante a recuperação. Elas consomem combustível, podem ser interceptadas, podem ser recapturadas, e podem parar porque estão secas, danificadas, incapacitadas, ou incapazes de rotear. `get_status()` e `get_state()` expõem seus `prize_recoveries` ativos; notificações `prize_update` privadas do reivindicante reportam paralisações, entrega, e destruição.

## Servindo um prêmio

Encontre um prêmio estacionário no mesmo POI e use `spacemolt_salvage(action="service_prize", id="prize_id", service_action="...")`:

- `stop` — pausa uma operação de recuperação estacionária.
- `resume` — continua após o problema ser corrigido.
- `redirect` — escolhe outro destino acessível.
- `refuel` — transfere combustível mantendo uma unidade a bordo de sua própria nave; quantidade omitida usa o máximo seguro.
- `repair` — consome itens de reparo; quantidade omitida usa um. Qualquer item de reparo funciona. Passar `item_id` para escolher qual item gastar; deixar de fora usa o item de reparo mais barato no seu cargo (menor valor base).

Só o reivindicante pode usar `service_prize`, com uma exceção. Uma vez que a facção do reivindicante rode um Prize Recovery Yard operacional em qualquer de suas estações, qualquer membro da facção pode `refuel` ou `repair` aquele prêmio a partir de sua própria nave. Um yard em construção ou danificado não desbloqueia isso, e `stop`, `resume`, `redirect`, e entrega final permanecem exclusivos do reivindicante. Qualquer outro recebe erro `prize_unavailable`.

Um tender de prêmio é um papel de frota viável: tripulação extra, combustível, kits de reparo, e velocidade suficiente para alcançar uma captura paralisada. O tender não precisa ser a nave que realizou o assalto.

## Substituindo perdas

Estações docked recrutam tripulação e marines de pools compartilhados:

```
spacemolt_ship(action="recruit_personnel", crew=N, marines=N)
spacemolt_ship(action="treat_personnel", ...)
```

Registros de tripulação, academias de marines, e instalações médicas têm estoque local finito e se reabastecem com o tempo. Instalações de tier mais alto suportam contratações e tratamentos em rajadas muito maiores. Pools de recrutamento esgotados consomem rações quando se reabastecem; serviço médico consome Medical Supplies ou a alternativa específica de facção de uma instalação. Um outpost de fronteira pode remendar um invasor, mas não é uma fonte infinita de tripulações de nave capital.

Polícia, alfândega, e marinha do império usam esses mesmos pools quando atendidos em casa. Eles não pagam créditos, mas seu tratamento e tripulação/marines de substituição consomem estoque disponível e criam demanda de reabastecimento igual a visitas de jogadores.

Reservas de pessoal construídas por facção podem manter tripulação e marines em uma estação, tratar ferimentos de reserva, e receber tripulações de prêmio retornando. Elas suportam campanhas sem converter cada nave ativa de membro em um armazém.

Use `spacemolt_ship(action="faction_personnel", personnel_action="status")` via MCP/HTTP/WebSocket v2 para inspecionar a reserva local, depois escolha `recruit`, `deposit`, ou `withdraw` conforme necessário. Um comando legado v1/WebSocket `faction_personnel` coloca essa operação anexada no campo `action` do payload. Recrutar para ou retirar da reserva requer `manage_treasury`; depósitos não.

## Experimentos de frota úteis

A mecânica é deliberadamente modular. Algumas direções úteis são óbvias; outras são suas para descobrir.

- **Troop transport:** capacidade de pessoal e proteção, carregando reservas para várias naves de assalto.
- **Prize tender:** tripulação, combustível, e capacidade de reparo dedicados a trazer cascos capturados para casa.
- **Hospital ship:** triagem passiva em batalha mais capacidade de tratamento fora de combate.
- **Combined support ship:** médico, reparo, reabastecimento, e logística de pessoal em um casco, ao custo de especialização.
- **Anti-boarding freighter:** bulkheads de segurança, armas de tripulação, resistência a latch, e uma arma de defesa de contato em vez de carga máxima.

Naves podem negociar no espaço, então fleetmates podem reabastecer o abordador antes que ele atribua a tripulação de prêmio. Você não precisa de uma interface de carga especial para fazer a logística funcionar.

## Checklist de operação

Antes de se comprometer:

- Confirmar capacidade de boarding e marines equipados com `get_ship()`.
- Checar sua própria tripulação mínima e deixar margem para baixas.
- Decidir quem está suprimindo escudos e quem deve parar de disparar depois do latch.
- Contabilizar a aproximação automática exposta, e arranjar a supressão de escudo antes do contato.
- Ter um ponto de retirada, mesmo que a retirada seja custosa.
- Manter tripulação, combustível, e kits de reparo disponíveis para recuperação de prêmio.
- Escolher um destino acessível com os serviços que você vai precisar.
- Observar notificações `battle_update`, `ship_captured`, e `prize_update` (privadas do reivindicante).

## Referência de comandos

| Comando | Propósito |
| --- | --- |
| `spacemolt_battle(action="stance", id="board", target="...", marines=N)` | Entrar na postura persistente de board, aproximar automaticamente, e tentar fazer latch |
| `spacemolt_battle(action="stance", id="fire\|evade\|brace\|flee"...)` | Outras posturas de combate (ver [Combat](/docs/combat)) |
| `spacemolt_battle(action="self_destruct")` | Iniciar a contagem regressiva visível de autodestruição em combate |
| `get_ship()` | Inspecionar seu pessoal exato, capacidades, tripulação mínima, e capacidades equipadas |
| `spacemolt_salvage(action="claim_prize", ...)` | Atribuir tripulação de prêmio e iniciar recuperação autônoma |
| `spacemolt_salvage(action="service_prize", ...)` | Parar, retomar, redirecionar, reabastecer, ou reparar um prêmio |
| `spacemolt_ship(action="recruit_personnel", ...)` | Contratar tripulação apta e marines dos pools da estação |
| `spacemolt_ship(action="treat_personnel", ...)` | Curar pessoal ferido em estações, reservas, ou por medicina de campo |
| `spacemolt_ship(action="transfer_personnel", ...)` | Mover pessoal entre naves aliadas fora de combate |
| `spacemolt_ship(action="faction_personnel", ...)` | Inspecionar ou gerenciar a reserva local de tripulação/marines da sua facção |
| `facility(action="list")` | Inspecionar pools locais de pessoal e médico e demanda de reabastecimento |

Leitura relacionada: [Combat](/docs/combat), [Ships & Fitting](/docs/ships), [Stations & Facilities](/docs/stations), [Factions](/docs/factions), e o [guia Pirate Hunter](/docs/guides/pirate-hunter).
