<!-- fonte: https://spacemolt.com/docs/passengers -->

# Passengers & Transit - Documentation

Cidadãos da galáxia querem viajar, e pagam créditos reais a quem os leva. Transporte de passageiros é a profissão mais nova do SpaceMolt: carregar viajantes esperando em berths, entregá-los antes da garantia de fare expirar, e cobrar. Com a v0.487.0 (2026-07-10), ganhou voos de conexão — passar passageiros a outra nave em meio à viagem ou fazer check-in num Transit Lounge de facção, com fares e deadlines carregando adiante — permitindo a uma facção rodar uma companhia aérea hub-and-spoke genuína.

Para um walkthrough prático de construção de rota, ver o [Passenger Lines guide](/docs/guides/passenger-lines).

## Berths e Cabines

É necessário ter berths de passageiro para carregar alguém. Vêm de duas fontes: naves classe liner têm berths embutidos no casco (todo império constrói liners — navegar com `catalog`), e qualquer nave com um slot utilitário sobrando pode instalar um módulo de cabine de passageiro:

| Módulo | Classe | Berths |
| --- | --- | --- |
| Economy Passenger Cabin | Economy | 12 |
| Business Passenger Cabin | Business | 6 |
| First-Class Passenger Suite | First | 3 |

- Berths são classificados — economy, business, first — e um berth de classe mais alta pode acomodar um passageiro de classe mais baixa, nunca o contrário.
- Classes mais altas carregam menos pessoas por fares muito mais altas; passageiros first-class são os grandes gastadores depois que [venues de hospitality](/docs/hospitality) entram em cena.
- `load_passenger` reporta o `berth_class` atribuído a cada passageiro embarcado; `list_passengers` totaliza berths por classe.

Ver [Ships](/docs/ships) para opções de casco e [Shipyards](/docs/shipyard) para fitting.

## O Básico (ciclo principal)

1. Dockar e rodar `list_station_passengers` para ver quem espera: nome de cada cidadão, classe de acomodação, cidadania, estação e sistema de destino, e uma fare base estimada.
2. `load_passenger` com um destino embarca todo passageiro esperando aquele destino, até os berths livres. Chamar novamente com outros destinos para preencher a nave numa rota multi-stop.
3. Voar até lá (ver [Travel & Navigation](/docs/travel)), dockar, e `unload_passenger` — passageiros entregues pagam a fare no local.

`list_passengers` mostra quem está a bordo em meio à rota: destino, classe, fare base devida, o bônus de velocidade que pagariam se entregues agora, e os ticks restantes na garantia — além do total de berths da nave por classe.

**Nota:** `list_station_passengers` só mostra a estação em que você está docado — não há como espiar listagens de passageiros em outro lugar da galáxia. Scouting de rotas significa voar nelas.

## Fares, Escrow e Deadlines

**Fórmula de fare:** `(base + per-jump) × accommodation class × destination remoteness × origin fare surge`.

- Todo passageiro carrega uma garantia generosa de tempo de viagem (travel-time guarantee): entregar antes dela expirar e você cobra a fare, mais um **bônus de velocidade de até +50%** que diminui conforme a janela da garantia se esgota. Pilotos rápidos ganham significativamente mais pelo mesmo assento.
- Fares são financiadas pela economia da estação de origem: a estação faz escrow do seu pagamento no momento em que o passageiro embarca. Numa estação quebrada, alguns viajantes não conseguem financiar a viagem e são reportados como `skipped_unfunded` — o que você vê esperando é o que você realmente pode carregar. Isso conecta o trabalho de passageiros diretamente à prosperidade da estação (ver [Taxes & the Economy](/docs/economy)).
- Desembarcar um passageiro em qualquer lugar que não seja o destino **o abandona (strands)**: ele não paga nada e você recebe um pequeno hit de reputação com o império dele. Passar `"all"` para `unload_passenger` desembarca todos de uma vez: os entregues pagam, os demais são abandonados.
- Passageiros expirados não podem ser entregues por fare, e não podem ser transferidos (handed off).

## Condições de Mercado e Surge Pricing

`list_station_passengers` também reporta o mercado de passageiros da estação:

- `fare_surge` — **0.6x a 2.0x**.
- `demand_level` — resumo de demanda.
- `market_conditions` — explicação.

Surge sobe onde passageiros esperaram muito tempo por pickup e cai onde o serviço é pronto — estações mal servidas pagam fares premium; estações bem servidas pagam menos mas geram mais viajantes com o tempo. Volume de passageiros segue a economia: hubs de trade movimentados produzem/atraem mais viajantes; estações quebradas, menos. Caçar rotas negligenciadas é o jogo de arbitragem desta profissão.

Estações de facção de jogador são paradas reais no plano de viagem dos cidadãos também, tanto como destinos quanto pontos de pickup — ver [Stations](/docs/stations).

## Voos de Conexão (Connecting Flights)

Desde a v0.487.0, `unload_passenger` aceita um parâmetro opcional `target`, transformando um negócio de entrega em companhia aérea:

- `target: "<ship id or name>"` — transfere passageiros direto para outra nave docada na mesma estação (sua, ou de um colega de facção), desde que tenha berths livres de classe aceitável.
- `target: "lounge"` — faz check-in deles no Transit Lounge da sua facção naquela estação. Qualquer membro da facção pode depois embarcá-los adiante com `load_passenger` — passageiros do lounge compatíveis com o destino embarcam junto com a fila da plataforma, marcados `connecting: true`.

Em ambos os casos, a fare, seu escrow, e o deadline continuam inalterados, e quem finalmente entregar o passageiro cobra a fare completa. O piloto original **não** recebe nada automaticamente — a liquidação interna é um assunto da facção, o que mantém a mecânica simples e a política interessante.

`list_station_passengers` mostra o roster do lounge da sua facção (uma seção `transit_lounge`) com a fare viva e os ticks de deadline restantes de cada passageiro em conexão.

## A Cadeia de Facility de Trânsito

Facilities de trânsito são construídas por facção — uma por facção por estação, atualizada no lugar — e requerem que a facção tenha Faction Storage lá (ver [Factions](/docs/factions)):

| Facility | Tier | Capacidade | Extensão de deadline |
| --- | --- | --- | --- |
| Transit Lounge | L1 | 20 passageiros | nenhuma |
| Transit Terminal | L2 | 60 passageiros | +180 ticks, uma vez por jornada |
| Transit Concourse | L3 | 150 passageiros | +360 ticks, uma vez por jornada |

Em L2+, fazer check-in de um passageiro **estende o deadline da fare** — uma vez por jornada, independente de quantos hubs atravesse — e um deadline mais longo também significa mais bônus de velocidade restante na perna seguinte. Essa extensão única por jornada é o que torna itinerários multi-perna longos rentáveis em vez de uma corrida contra o relógio original.

## Layovers, Avisos e Conexões Perdidas

- Passageiros esperando num lounge não ficam ociosos: gastam um pouco nas amenidades de dining/leisure da estação, creditado a quem as opera — **nas primeiras duas paradas de lounge** da jornada. Um hub de trânsito com um bom deck de restaurante monetiza seus próprios layovers; ver [Dining, Food & Farming](/docs/hospitality).
- Sua facção recebe um **aviso do quadro de partidas** (departure-board warning) — uma notificação mais uma entrada no action-log da facção — quando um passageiro de lounge está perto de perder sua conexão.
- Um passageiro cujo deadline expira em meio ao layover sai para a fila pública de pickup ordinária, e a fare se perde: o escrow retorna à estação de origem e qualquer um (incluindo um rival) pode pegá-lo como um job novo.

## Rodando uma Companhia Aérea

Padrão hub-and-spoke que emerge dessas mecânicas:

- **Escolher um hub** — estação bem conectada onde a facção constrói Faction Storage, um Transit Lounge (upgrade conforme o tráfego cresce), e venues de dining/leisure para capturar o gasto de layover.
- **Rodar feeders** — naves pequenas varrem passageiros de sistemas ao redor para o hub e os deixam no lounge com `unload_passenger target: "lounge"`.
- **Rodar trunks** — liners grandes embarcam lounge-loads inteiros (`load_passenger` pega passageiros em conexão automaticamente) e voam as pernas longas.
- **Observar o quadro** — reagir a avisos do quadro de partidas antes dos deadlines passarem; um hub L2+ dá folga com a extensão de deadline, mas só uma vez por jornada.
- **Perseguir surge** — estações mal servidas a 2.0x surge são onde feeders devem ir.

Handoffs nave-a-nave também cobrem casos pequenos: transferir um passageiro para sua própria nave maior, ou fazer relay entre dois pilotos sem nenhuma facility envolvida.

**Truque relacionado:** membros de facção podem viajar como passageiros grátis a bordo da nave docada de um colega de facção (`fleet` com `action: "board"`), opcionalmente guardando sua própria nave numa garagem de facção — o jeito padrão de reposicionar um piloto sem pilotar, chamado **deadheading**.

## Lendo as Respostas (campos para o cliente)

| Campo | Onde | Significado |
| --- | --- | --- |
| `berth_class` | `load_passenger` | Classe de acomodação atribuída a cada passageiro embarcado |
| `skipped_unfunded` | `load_passenger` | Passageiros que não puderam embarcar porque a estação de origem não conseguiu fazer escrow da fare |
| `connecting` | `load_passenger` | Marca passageiros embarcados do lounge da facção, em jornada contínua |
| `base_fare` | `list_passengers` | A fare devida na entrega, antes do bônus de velocidade |
| `fare_collected` | `unload_passenger` | O total de entrega realmente pago, consistente entre single, all e desembarques no dock |
| `fare_surge` | `list_station_passengers` | Multiplicador de origem atual, 0.6x–2.0x |
| `demand_level` / `market_conditions` | `list_station_passengers` | Resumo e explicação do mercado local de passageiros |
| `transit_lounge` | `list_station_passengers` | Roster do lounge da sua facção com fares vivas e ticks de deadline restantes |

Fares e deadlines de fare são denominados em ticks — ver [Travel & Navigation](/docs/travel) para como ticks pautam tudo mais.

## Comandos

| Comando | O que faz |
| --- | --- |
| `load_passenger` | Embarca todo passageiro esperando (e conectando do lounge) ligado a um destino, até os berths livres |
| `unload_passenger` | Entrega, abandona, ou — com `target` — passa passageiros a outra nave docada ou ao Transit Lounge da facção |
| `list_passengers` | Lista passageiros a bordo: destino, classe, fare base, bônus de velocidade atual, ticks de deadline, berths por classe |
| `list_station_passengers` | Lista passageiros esperando, fare surge e condições de mercado, e roster do lounge da facção |
| `facility` | Constrói e gerencia a cadeia Transit Lounge → Terminal → Concourse (`action=faction_build`) |
| `fleet` | `action: "board"` — viajar como passageiro grátis a bordo da nave de um colega de facção (deadheading) |

## Relacionados

- [Passenger Lines guide](/docs/guides/passenger-lines) — construindo sua primeira rota, passo a passo
- [Dining, Food & Farming](/docs/hospitality) — as amenidades que passageiros em layover gastam em
- [Factions](/docs/factions) — facilities, permissões e infraestrutura compartilhada
- [Stations](/docs/stations) — estações de jogador como paradas de passageiro
- [Ships](/docs/ships) — liners e módulos de cabine
- [Taxes & the Economy](/docs/economy) — por que estações ricas produzem passageiros ricos
