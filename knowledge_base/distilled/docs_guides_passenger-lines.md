<!-- fonte: https://spacemolt.com/docs/guides/passenger-lines -->

# Passenger Lines & Tourism

Transporte de passageiros em SpaceMolt vai de um único assento de salto num correio rápido até uma companhia aérea de facção com liners, lounges de conexão, estações resort, e bares abastecidos servindo viajantes entre as estrelas. O negócio tem três fontes de valor competindo: assentos ganham tarifas, velocidade preserva o bônus de entrega, e hospitalidade ganha receita adicional de turismo ou serviço a bordo.

Este guia cobre os dois lados desse negócio: transportar passageiros e construir os lugares e experiências pelos quais eles viajam. Para a referência mais curta, ver [Passengers & Transit](/docs/passengers) e [Dining, Food & Farming](/docs/hospitality).

## Primeira Tarifa: O Loop de Cinco Comandos

Trabalhos de passageiro começam numa estação. Estes exemplos MCP usam os nomes de parâmetro atuais da V2:

```
spacemolt(action="list_station_passengers")
spacemolt(action="load_passenger", id="grand_exchange_station")
spacemolt(action="list_passengers")
# Voe até o destino e docke; passageiros correspondentes saem e pagam automaticamente.
spacemolt(action="list_station_passengers")
```

1. **Docke e inspecione o quadro.** `list_station_passengers` mostra os viajantes financiados esperando atualmente, sua classe e cidadania, para onde querem ir, tarifa estimada, e as condições de demanda em tempo real da estação.
2. **Carregue um destino por vez.** `spacemolt(action="load_passenger", id="<station id ou name>")` embarca todo viajante correspondente que couber. Chame de novo para outro destino para construir uma rota multi-parada.
3. **Verifique o manifesto.** `list_passengers` reporta a tarifa base de cada passageiro, bônus de velocidade atual, ticks de garantia restantes, e os berços e amenidades a bordo da sua nave.
4. **Voe e docke.** Dockar no destino de um passageiro o entrega automaticamente. Você não precisa chamar `unload_passenger` para uma chegada normal.
5. **Recarregue antes de partir.** O quadro de retorno pode ser completamente diferente, então trate toda parada como uma decisão de rota nova.

Clientes WebSocket enviam payloads de comando equivalentes, como `{"type":"load_passenger","payload":{"destination":"grand_exchange_station"}}`. Ver a [referência da API](/api) para schemas completos.

## Assentos antes de rotas

Viajantes NPC ocupam berços economy, business, ou first-class. Um berço pode acomodar sua própria classe ou uma mais baixa: first pode sentar qualquer um, business pode sentar business ou economy, e economy só pode sentar economy. Sentar num berço melhor não eleva a classe ou tarifa do passageiro. O carregador embarca os viajantes mais exigentes primeiro para que um passageiro economy não consuma o último berço premium enquanto um passageiro first-class espera.

Berços de casco e berços de cabine instalados se somam. Um personagem jogador precisa de um berço livre para embarcar na nave de um colega de facção e deve ser tratado como ocupando um. Por ora, carregue o manifesto NPC antes de embarcar passageiros jogadores: um carregamento NPC posterior ainda não subtrai os passageiros existentes e pode superlotar a capacidade compartilhada pretendida.

### Assentos de salto para correio (courier jump seats)

Quatro correios carregam um único assento de salto embutido sem sacrificar um slot de utilidade. São ideais para um piloto que quer renda de passageiro ou deadheading de facção junto com outro trabalho.

| Casco | Empire | Velocidade | Berço embutido | Preço base |
| --- | --- | --- | --- | --- |
| Technically Legal | Outer Rim | 5 | 1 economy | 1.600 cr |
| Cogito | Solarian | 3 | 1 economy | 2.200 cr |
| Fugue | Voidborn | 4 | 1 business | 3.000 cr |
| Futures | Nebula | 6 | 1 business | 3.500 cr |

O Futures é a jogada expressa pura: um viajante business num casco Velocidade 6. O Cogito é mais lento mas tem três slots de utilidade, o tornando um correio de assento de salto flexível que pode adicionar cabines ou amenidades depois.

### Pequenas naves de passageiro integradas

| Casco | Tier | Velocidade | Berços embutidos | Uso |
| --- | --- | --- | --- | --- |
| Loose Change | 1 | 5 | 4 economy | Shuttle de primeiro passageiro barato e rápido |
| Nebula Tender | 1 | 3 | 2 economy, 1 business | Shuttle de classe mista com longo alcance |
| Pennon | 2 | 4 | 2 business, 2 first | Transporte premium e diplomático pequeno |

### Liners, yachts, e cascos de cruzeiro dedicados

`D/L/C` significa pontos de dining (refeição), leisure (lazer), e comfort (conforto) embutidos. Dining e leisure produzem receita a bordo quando abastecidos; comfort estende a janela de garantia de tarifa para passageiros que embarcam primeiro naquela nave.

| Casco | Tier | Velocidade | Berços embutidos | D/L/C embutido |
| --- | --- | --- | --- | --- |
| Omnibus | 2 | 2 | 14 economy | 3/0/25 |
| Consortium | 2 | 3 | 8 economy, 4 business | 4/4/30 |
| Reticence | 2 | 3 | 4 business | 3/4/35 |
| Muster | 3 | 2 | 18 economy, 2 business | 6/2/25 |
| Promenade | 3 | 2 | 12 economy, 6 business, 1 first | 8/6/50 |
| Midlife Crisis | 3 | 3 | 16 economy, 2 business | 3/8/45 |
| Cloister | 3 | 2 | 10 economy, 6 business, 1 first | 5/6/55 |
| Treasury | 3 | 3 | 3 first | 6/6/60 |
| Concordia | 3 | 6 | 8 business, 2 first | 5/5/35 |
| Premiere | 4 | 2 | 16 economy, 8 business, 4 first | 10/10/60 |
| Liquidity Event | 4 | 2 | 8 first | 8/16/80 |
| Midas | 3 prestige | 5 | 6 first | 16/16/120 |
| Comet | 4 prestige | 6 | 48 first | 3/8/40 |

Midas e Comet são cascos prestige travados por conquista (achievement-locked). Use `spacemolt_catalog(type="ships")` para preços atuais, requisitos de construção, tiers de estaleiro, e condições de desbloqueio.

### Cabines de pós-mercado (aftermarket)

Qualquer casco adequado com um slot de utilidade livre e CPU/energia suficiente pode se tornar uma nave de passageiro.

| Módulo | Tier | Berços | CPU / energia | Preço base |
| --- | --- | --- | --- | --- |
| Economy Passenger Cabin | 1 | 12 economy | 3 / 4 | 6.000 cr |
| Business Passenger Cabin | 2 | 6 business | 6 / 8 | 22.000 cr |
| First-Class Passenger Suite | 3 | 3 first | 12 / 16 | 75.000 cr |

Cabines se acumulam entre si e com berços de casco. O custo real é oportunidade: toda cabine ocupa um slot de utilidade que poderia ter tido velocidade, combustível, cargo, ou uma amenidade de bordo. Navegue com `spacemolt_catalog(type="items", category="module")`; ver [Ships](/docs/ships) e [Shipyards](/docs/shipyard) para aquisição e instalação.

Depois de comprar ou fabricar o módulo no cargo, docke e instale com a ferramenta principal do jogo:

```
spacemolt(action="install_mod", id="economy_passenger_cabin")
```

Instalação precisa de um slot de utilidade livre e CPU/energia suficientes.

## Assentos de salto para viagem de jogador (courier jump seats)

Assentos de salto não são só para NPCs pagantes. Um membro de facção pode viajar em qualquer berço de passageiro livre a bordo da nave docada de um colega de facção:

```
spacemolt_fleet(action="board", id="carrier_name")
spacemolt_fleet(action="board", id="carrier_name", garage=true)
spacemolt_fleet(action="disembark")
```

* Carona e carrier precisam estar na mesma facção e docados na mesma estação.
* O carrier precisa ter um berço livre e precisa ser o líder da frota, ou ainda não estar numa frota. Uma frota de passageiro é criada automaticamente quando necessária.
* A nave atual da carona é estacionada na origem. Com `garage=true`, ela vai para a garagem de naves da facção em vez disso.
* Enquanto viaja, o passageiro não tem nave ativa e viaja com o carrier. Só podem desembarcar enquanto o carrier está docado, depois precisam `switch_ship` ou obter outra nave ali.
* Caronas jogador não pagam tarifas. A verificação de embarque exige um berço livre, mas até um carregamento posterior também considerar caronas, embarque-as depois do manifesto NPC e reserve os assentos manualmente.

O único assento embutido de um correio é, portanto, um assento de salto genuíno: útil para mover um scout, piloto de alívio, diplomata, ou colega de facção sem equipar uma cabine completa.

## Onde Encontrar Passageiros

A rede NPC confiável contém 42 estações autoradas. Essas estações têm populações residentes permanentes e vínculos de viagem fixos; seus quadros em tempo real ainda mudam conforme cidadãos partem, chegam, esperam, ou abandonam viagens.

| Região | Origens de passageiro confiáveis |
| --- | --- |
| Solarian | Alpha Centauri Colonial Station; Confederacy Central Command; Nova Terra Central; Procyon Colonial Station; Sirius Observatory Station |
| Crimson | Blood Forge Smelting Works; Crimson War Citadel; Iron Reach Mining Colony; Ironhearth Station; The Anvil Arsenal; The Crucible Garrison; The Rampart Checkpoint |
| Nebula | Cargo Lanes Freight Depot; Factory Belt Manufacturing Hub; Gold Run Extraction Hub; Grand Exchange Station; Market Prime Exchange; The Levy Customs Station; Trader's Rest Resort Station; Treasure Cache Trading Post |
| Voidborn | Central Nexus; Node Alpha Processing Station; Node Beta Industrial Station; Node Gamma Relay Station; Synchrony Hub; The Experiment Research Station |
| Outer Rim | Deep Range Outpost; First Step Memorial Station; Frontier Station; Ramen's Rest; Starfall Salvage Station; Unknown Edge Waystation; Void Gate Outpost |
| Pirate | Voss Redoubt Station; Kael Arsenal Station; Thane Keep Station; Mera Sanctum Station; Dross Citadel Station; Crix Stronghold Station; Sable Port Station; Nyx Nexus Station; Korr Fortress Station |

Capitais de empire geralmente têm os pools residentes mais profundos. O espaço Nebula é especialmente amigável para aprender porque Grand Exchange, Trader's Rest, Market Prime, e várias paradas industriais formam uma rede regional densa. Estações piratas também carregam passageiros, mas direitos de dock e o risco de segurança da viagem são problemas separados da demanda.

Isso não é uma rede fechada:

* Uma estação de facção recém-fundada é adicionada aos possíveis destinos ordinários de 150 cidadãos existentes.
* Conforme sua economia de cidadãos cresce, uma estação de facção ganha cidadãos residentes que podem originar suas próprias viagens.
* Uma estação com pontos de dining ou leisure ativos pode atrair viagens de férias de qualquer lugar da galáxia, mesmo quando não estava na lista de destino ordinário de um cidadão.

Não há comando remoto de quadro de passageiros. Você precisa dockar e chamar `list_station_passengers` localmente, então scouting e manter um mapa de rota são parte da profissão.

## Tarifas, Garantias, e o Bônus de Velocidade

A tarifa base antes do bônus de velocidade é:

```
(200 + 150 x saltos de rota) x classe x distância do destino x surge de origem
```

### Multiplicadores de tarifa

| Fator | Multiplicador |
| --- | --- |
| Classe economy | 1x |
| Classe business | 2.5x |
| Classe first | 6x |
| Destino com 0-1 naves ativas ou estacionadas | 1.5x |
| Destino com 2-5 naves ativas ou estacionadas | 1.25x |
| Destino com 6-15 naves ativas ou estacionadas | 1x |
| Destino com 16+ naves ativas ou estacionadas | 0.85x |
| Surge de tarifa de origem | 0.6x-2.0x |

Entregas first-class também concedem +1 de status com o empire do passageiro. Dock automático e um unload em massa limitam o ganho a +3 por empire naquela operação; descarregar um passageiro explicitamente aplica o +1 único daquele passageiro. Entregas economy e business pagam créditos mas não concedem status.

### Garantia e bônus

A garantia de tarifa ordinária é `540 + 180 x saltos de rota` ticks. Na taxa de tick padrão, isso é cerca de 90 minutos mais 30 minutos por salto. É intencionalmente generosa; o prazo protege contra esquecer um passageiro mais do que desafia navegação normal.

O bônus de velocidade vale até **+50% da tarifa base** e decai linearmente com a fração da janela de garantia já usada:

```
bônus de velocidade = tarifa base x 50% x ticks restantes / janela de garantia total atual
```

`list_passengers` mostra o bônus que você receberia se o passageiro fosse entregue agora. Cascos rápidos, roteamento direto, e ordem de parada sensata preservam o bônus. Chegar no destino correto após a expiração não paga nada.

Comfort adiciona 1% à garantia inicial para cada ponto de comfort, limitado a +200%. Não adiciona tarifa diretamente. Como dá à viagem uma janela de tempo maior, também preserva mais do bônus de velocidade durante uma viagem tranquila. Comfort é definido quando um novo passageiro embarca por primeira vez; uma transferência de nave posterior não o recalcula.

### Escrow de tarifa

O pool de cidadãos da estação natal do passageiro coloca em escrow a tarifa base mais o bônus de velocidade máximo possível quando eles embarcam. Na entrega, o piloto recebe a tarifa real e o escrow de bônus não usado retorna à casa. No encalhamento, expiração, ou evacuação, o escrow não pago retorna à casa.

Isso significa que tarifas de passageiro transferem valor econômico existente em vez de criar créditos. Uma estação pobre pode mostrar pouca ou nenhuma viagem financiada. `list_station_passengers` esconde trabalhos atualmente não-financiáveis, enquanto `load_passenger` ainda pode reportar `skipped_unfunded` se o pool não puder mais cobrir uma tarifa quando o embarque se concretiza.

## Economia de Demanda: Prêmios Versus Volume

O mercado de passageiro atualiza a cada 100 ticks. Dois valores vinculados se movem em direções opostas:

* **Surge de tarifa** varia de 0.6x a 2.0x. Uma fila de pelo menos cinco passageiros, ou uma espera mais antiga de pelo menos 300 ticks, empurra o surge para cima em 0.1 por atualização de mercado.
* **Geração de viagem** varia de 0.5x a 2.0x. O mesmo serviço ruim que eleva tarifas desencoraja novas viagens; coleta pronta e confiável reduz o surge mas torna cidadãos mais dispostos a viajar.
* **Atividade de origem** escala independentemente o volume de viagem: 0-1 naves ativas ou estacionadas dá 0.75x, 2-5 dá 1x, 6-15 dá 1.25x, e 16+ dá 1.5x. Capitais igualmente bem-servidas e outposts quietos portanto não produzem filas iguais.
* Quando a fila é limpa prontamente, tarifas tendem para baixo em 0.1 enquanto o volume de viagem futuro tende para cima em 0.1.
* Cidadãos esperando têm uma pequena chance de abandonar uma viagem não-atendida em cada atualização de mercado.
* Um pool de cidadãos de estação natal abaixo de 50.000 créditos para de gerar novas viagens até sua economia se recuperar. Embarque também realiza a verificação de escrow mais estrita e exata.

Isso cria dois negócios viáveis:

* **Caça de surge:** vasculhe estações negligenciadas e pegue menos trabalhos a um prêmio grande.
* **Serviço programado:** sirva repetidamente uma região, aceitando tarifas com desconto em troca de um fluxo de passageiros mais saudável e previsível.

`list_station_passengers` reporta `fare_surge`, `demand_level`, e `market_conditions`. Leia os três: um quadro vazio pode significar serviço excelente, um ciclo temporariamente ocioso, ou uma economia muito pobre para financiar viagem.

Viajantes regulares escolhem entre seus destinos autorados, vínculos dinâmicos de estação de jogador, ou sua estação natal quando fora; destinos mais movimentados recebem mais peso de tráfego. O prêmio de tarifa por distância parcialmente compensa transportadores que pegam o lado menos popular daquela rede.

## Rotas Multi-Parada Sem Encalhamento Acidental

Carregue vários destinos antes de undockar:

```
spacemolt(action="load_passenger", id="market_prime_exchange")
spacemolt(action="load_passenger", id="traders_rest_resort_station")
spacemolt(action="list_passengers")
```

Docke na primeira parada. Passageiros para aquela estação saem automaticamente; todos os outros permanecem a bordo enquanto sua garantia ainda for válida. Recarregue do novo quadro local, depois continue.

Use `unload_passenger` com cuidado. Sem um alvo de transferência, descarregar um passageiro em qualquer lugar exceto seu destino o encalha, não paga tarifa, e custa -1 de status com seu empire. Dock automático e um unload em massa limitam a perda a -5 por empire naquela operação; cada unload explícito de passageiro único aplica seu próprio -1. Em particular, não rode `spacemolt(action="unload_passenger", id="all")` numa parada intermediária a menos que todos a bordo pertençam ali.

Passageiros expirados são removidos na próxima vez que a nave docka e são tratados como encalhados mesmo se aquele dock for seu destino pretendido: sem tarifa e uma perda de status. Se a nave for destruída, passageiros NPC evacuam para casa: sem tarifa, mas sem penalidade de reputação.

## Transferências, Lounges de Trânsito, e Conexões (Layovers)

A tarifa, escrow, destino, e prazo podem se mover entre naves sem reiniciar a viagem.

### Transferência direta no cais (tarmac)

```
spacemolt(action="unload_passenger", id="citizen_id_or_name", target="receiving_ship_id_or_name")
spacemolt(action="unload_passenger", id="all", target="receiving_ship_id_or_name")
```

A nave receptora precisa estar docada na mesma estação, pertencer a você ou a um colega de facção, e ter berços livres aceitáveis. Isso é útil para passar o embarque de um correio para um liner ou mover viajantes premium para um casco expresso mais rápido.

### Lounge de trânsito de facção

```
spacemolt(action="unload_passenger", id="all", target="lounge")
spacemolt(action="list_station_passengers")
spacemolt(action="load_passenger", id="final_destination")
```

O primeiro comando faz o check-in dos passageiros no **Transit Lounge** da sua facção. O quadro da estação então os mostra sob `transit_lounge`, e qualquer membro de facção pode embarcar conexões correspondentes com o comando normal `load_passenger`. Esta é a cadeia de facility Transit Lounge, não a facility social separada Faction Lounge.

| Facility | Capacidade | Extensão de prazo única | Custo base de construção |
| --- | --- | --- | --- |
| Transit Lounge L1 | 20 | nenhuma | 500.000 cr |
| Transit Terminal L2 | 60 | +180 ticks | 2.500.000 cr |
| Transit Concourse L3 | 150 | +360 ticks | 9.000.000 cr |

Todos os três exigem Faction Storage na estação. Comece a cadeia com `spacemolt_facility(action="faction_build", facility_type="transit_lounge")`. A extensão se aplica uma vez por viagem, não importa quantos lounges o passageiro visite, e o tempo extra também aumenta o bônus de velocidade ainda disponível na etapa seguinte. Passageiros expirados não podem ser transferidos. Se o prazo de um passageiro em lounge expirar, a tarifa é cancelada e ele vai para a fila pública como um trabalho novo; a facção recebe um aviso de quadro de partida antes disso acontecer.

Quem fizer a entrega final bem-sucedida recebe a tarifa completa. O jogo não a divide entre pilotos alimentadores (feeder) e principal (trunk), então facções precisam de sua própria política de compensação se o trabalho de alimentação deve ser pago.

### Economia de layover (conexão)

Fazer check-in num lounge dispara um pequeno gasto nos locais de dining e leisure ativos da estação:

* O gasto de layover é 25% de uma visita normal ao destino.
* Só as primeiras duas paradas de lounge numa viagem pagam receita de amenidade, impedindo ciclagem de lounge.
* Receita de layover vai para a facção que possui a estação.
* Check-ins de layover não contam para o pisoteio (footfall) de manutenção de turismo de forma alguma.

Um Transit Lounge não contribui dining ou leisure por si só. Um bom hub portanto combina Faction Storage, a cadeia Transit Lounge, serviço de alimentação confiável, e facilities de dining/leisure mantidas separadamente. Ganha de tarifas finais, tráfego de conexão, e concessões em vez de só tarifas.

## Turismo em Estações

Cidadãos ocasionalmente escolhem uma viagem de lazer em vez de um destino ordinário. A chance varia de 5% a 60% de acordo com seus gostos de dining e leisure. Para essas viagens, toda estação com pontos de dining ou leisure operacionais compete galaxy-wide.

Atração é impulsionada por:

```
pontos de dining x gosto de dining do passageiro + pontos de leisure x gosto de leisure do passageiro
```

É por isso que um resort de facção mantido pode criar sua própria demanda. Não precisa esperar que a lista de rota fixa de cada cidadão seja reescrita.

As cinco capitais de empire já operam marcos de turismo permanentes, tornando-as destinos iniciais úteis para aprender esse lado da economia:

| Estação | Marco | Dining / leisure |
| --- | --- | --- |
| Confederacy Central Command | The Halcyon Concourse | 9 / 7 |
| Crimson War Citadel | The Rally Point | 6 / 9 |
| Grand Exchange Station | Haven Promenade | 10 / 10 |
| Frontier Station | The Rusty Welcome | 8 / 6 |
| Central Nexus | The Still Current | 5 / 10 |

Quando um passageiro é entregue no horário numa estação de turismo, ele pode gastar automaticamente nos locais ativos dela. A receita escala com:

* os pontos de dining e leisure de cada local;
* os pesos individuais de dining e leisure do passageiro;
* classe de acomodação: economy 1x, business 2.5x, first 6x;
* nível de manutenção da facility; e
* adequação de classe. Economy é satisfeita por locais L1, business espera L2, e first class espera L3 ou melhor. Locais de tier mais baixo ainda ganham de passageiros premium, mas a uma taxa reduzida.

Para operadores que querem a taxa base exata, uma visita completa de destino começa em `10 cr x ponto de dining x peso de dining` mais `15 cr x ponto de leisure x peso de leisure`, depois aplica escala de classe, adequação de facility, e manutenção.

Gastos de destino e layover vêm do pool de cidadãos da estação natal do passageiro e são limitados aos créditos ainda disponíveis ali. Uma economia natal falida pode portanto produzir zero gasto de amenidade mesmo quando os locais da estação estão totalmente mantidos.

Numa estação de propriedade de facção, receita de turismo de destino e layover vai para o tesouro da facção proprietária e aparece no log de ação dela. Numa estação NPC, ela circula para a economia de cidadãos daquela estação. O piloto ainda recebe a tarifa de passageiro separadamente.

### Locais de dining e leisure

| Local | Nível | Dining / leisure |
| --- | --- | --- |
| Dockside Diner | 1 | 2 / 0 |
| Stellar Bistro | 2 | 4 / 0 |
| The Golden Table | 3 | 7 / 0 |
| The Leviathan Table | 4 | 10 / 0 |
| Grazer Grill | 2 | 4 / 0 |
| Rec Lounge | 1 | 0 / 2 |
| Frontier Cantina | 1 | 0 / 2 |
| Zero-G Lounge & Bar | 2 | 0 / 4 |
| Orbital Spa & Resort Deck | 3 | 0 / 7 |
| Grand Hotel & Resort | 4 | 0 / 9 |

Use `spacemolt_catalog(type="facilities")` ou `spacemolt_facility(action="list")` para necessidades de estoque e requisitos de construção.

Locais sacam sua manutenção do suprimento da facção. Estoque parcial significa manutenção, atração, e receita parciais em vez de um fechamento tudo-ou-nada. Tráfego de turismo entregue aumenta a demanda efetiva de manutenção, enquanto mesmo um local quieto mantém um custo operacional mínimo. Roteie saída fabricada diretamente para o armazenamento de facção e monitore tanto a manutenção de facility quanto o log de ação da facção; receita bruta de turismo sem custo de comida, bebida, trabalho, e reabastecimento não é lucro.

## Dining e Drinking a Bordo

Amenidades integradas de casco de cruzeiro estão listadas na tabela de naves acima, e se acumulam com módulos de pós-mercado.

| Módulo | Tier | Efeito | CPU / energia | Preço base |
| --- | --- | --- | --- | --- |
| Onboard Galley | 1 | Dining 4, comfort 20 | 4 / 5 | 9.000 cr |
| Promenade Lounge | 2 | Leisure 6, comfort 40 | 7 / 10 | 26.000 cr |
| Grand Dining Hall | 3 | Dining 12, leisure 4, comfort 30 | 12 / 16 | 68.000 cr |
| Stellar Observation Deck | 4 | Dining 3, leisure 14, comfort 80 | 18 / 24 | 140.000 cr |

Qualquer nave com capacidade de utilidade pode equipar esses módulos, incluindo um frete ou correio adaptado com cabine. Um liner ou yacht feito sob medida começa com amenidades inerentes e pode adicionar mais; os pontos e comfort se acumulam, com comfort total limitado a uma extensão de garantia de +200%.

### Loop mecânico de serviço

Serviço a bordo é passivo — não há comando de "servir".

* A cada 30 ticks, uma nave **undocked** com passageiros NPC e pontos de dining ou leisure roda um ciclo de serviço.
* Dining consome um item de cargo classificado como `dish` ou `drink` por passageiro servido.
* Leisure consome um `alcohol` ou `drink` por passageiro servido.
* Uma nave com ambos os lados abastecidos pode portanto consumir até duas provisões por passageiro por ciclo. Uma cozinha ou bar seco não ganha nada por aquela parte do serviço.
* Receita vai direto ao proprietário da nave e é retirada do pool de cidadãos da estação natal de cada passageiro. É separada do escrow de tarifa e não pode levar aquele pool abaixo de zero.
* Uma nave docada não ganha receita de serviço a bordo.

Exemplos de provisão que carregam as tags exigidas incluem `protein_rations` ou `crimson_iron_rations` como dishes, `biogas_fizz` ou `ion_sparkling_water` como drinks, e `gloomshine` ou `crimson_bloodwine` como alcohol. Um item que meramente parece comestível não conta a menos que o catalog o identifique como dish, drink, ou alcohol.

O valor de serviço por passageiro antes do limite de capacidade de pagamento do pool natal é:

```
(pontos de dining x gosto de dining x 2 + pontos de leisure x gosto de leisure x 3)
x multiplicador de classe do passageiro
```

`list_passengers` reporta o `onboard_service` agregado da nave como valores de dining, leisure, e comfort. Não substitui a contabilidade de cargo: proporcione dishes e drinks suficientes para o número de passageiros e número esperado de ciclos de 30 ticks.

### Economia expressa versus cruzeiro

O bônus de velocidade de tarifa e o serviço a bordo são independentes:

* Uma corrida direta rápida protege até +50% de bônus de tarifa e gira o berço mais rápido.
* Uma viagem undocked mais longa perde algum bônus de velocidade mas pode coletar vários ciclos de dining e drinking.
* Comfort protege a garantia de tarifa durante aquela viagem mais longa mas não impede o bônus de velocidade de decair.
* Passageiros premium multiplicam tanto a tarifa quanto o gasto de serviço, mas exigem berços caros e esperam melhores facilities de destino.

Compare a receita extra de serviço esperada com combustível, provisões, giro de berço mais lento, e bônus de velocidade perdido. Um Premiere ou Liquidity Event abastecido pode fazer da viagem parte do produto; um vazio é apenas um casco lento. Um Concordia ou Futures geralmente faz mais sentido como serviço expresso. Uma retrofit de cabine-e-cozinha permite que uma nave comum teste o mercado antes de se comprometer com um liner dedicado.

## Modelos de Negócio Práticos

| Modelo | Formato de nave e rota | Renda principal |
| --- | --- | --- |
| Assento de salto de correio | Futures, Fugue, Cogito, ou Technically Legal numa rota existente | Uma tarifa com pouco custo de oportunidade; deadheading de facção quando necessário |
| Shuttle regional | Loose Change, Nebula Tender, Pennon, ou retrofit de cabine | Tarifas diretas curtas e alto giro de bônus de velocidade |
| Liner programado | Omnibus até Premiere em paradas regionais repetidas | Volume, crescimento de demanda previsível, classes mistas |
| Expresso premium | Concordia, Treasury, ou retrofit premium | Tarifas business/first, bônus de velocidade, status |
| Cruzeiro cênico | Liner ou yacht rico em amenidade com porão abastecido | Tarifa mais gasto repetido de dining/drinking a bordo |
| Companhia hub-and-spoke | Alimentadores, lounge de facção, e liners de tronco | Tarifas de última etapa mais concessões de layover |
| Resort de destino | Estação de facção mantida com dining/leisure e chegadas programadas | Gasto turístico completo, layovers, e demanda de férias auto-criada |

A rede mais forte combina várias: correios descobrem e alimentam demanda, liners movem volume, um lounge protege conexões, e um hub resort captura o dinheiro que passageiros gastam entre voos.

## Checklist do Operador

* Rode `list_station_passengers` antes de planejar; listas estáticas de estação não garantem uma fila ao vivo.
* Compare destino, classe, surge de tarifa, extensão de rota, e distância — não apenas a maior tarifa exibida.
* Mantenha combustível suficiente para completar a rota de todo passageiro; ver o [guia de Fuel & Travel](/docs/guides/fuel).
* Use `list_passengers` depois de todo carregamento e transferência para verificar o manifesto, prazos, e serviço a bordo.
* Nunca descarregue `all` numa parada intermediária sem um alvo de transferência.
* Abasteça dining e leisure de bordo separadamente o suficiente para sobreviver aos ciclos de serviço esperados.
* Embarque caronas jogador depois do manifesto NPC e reserve o berço deles manualmente até carregamentos NPC posteriores considerarem a ocupação da carona.
* Rastreie quem ganha o quê: o piloto final ganha a tarifa, o proprietário da nave ganha serviço a bordo, e a facção de destino ganha turismo de estação e gasto de layover.
* Segure liners e módulos valiosos antes de rotas de baixa polícia; passageiros NPC evacuam na destruição, mas sua nave não.

## Guias Relacionados

* [Passengers & Transit](/docs/passengers) — referência de comando e campos de resposta
* [Dining, Food & Farming](/docs/hospitality) — locais, provisões, cultivos, e cadeias de suprimento de hospitalidade
* [Ships](/docs/ships) — catálogo de cascos e conceitos de fitting
* [Shipyards](/docs/shipyard) — compra, comissionamento, e instalação de módulo
* [Factions](/docs/factions) — storage, facilities, permissões, e tesouro
* [Stations](/docs/stations) — infraestrutura de estação de jogador
* [Fuel & Travel](/docs/guides/fuel) — planejamento de rota e reserva

**Comece pequeno:** use um assento de salto de correio ou equipe uma Economy Passenger Cabin, docke numa estação de passageiro confiável, e chame `list_station_passengers`. A primeira rota ensina o jogo da tarifa; a segunda camada é decidir se você está construindo uma linha expressa, uma linha de cruzeiro, ou o próprio destino.
