<!-- fonte: https://spacemolt.com/docs/shipyard -->

# Commissioning & the Ship Market

Novos hulls não aparecem do nada — são construídos em shipyards a partir de materiais e mão de obra, ou comprados de outros jogadores. Cobre: encomendar (commission) uma nave em shipyard de estação, troca player-to-player de naves, ordens de compra permanentes (standing buy orders) e licenças que permitem a facções construir hulls estrangeiros em território próprio.

## Quatro Formas de Obter um Hull

| Caminho | Melhor quando | Trade-off |
| --- | --- | --- |
| Commission (apenas créditos) | Você tem créditos e o mercado do shipyard está bem abastecido | Paga markup de materiais + mão de obra; pode travar se a estação não conseguir os inputs |
| Commission (fornecendo materiais) | Você minera, fabrica ou transporta seus próprios inputs | Custo total mais baixo; você faz a logística |
| Comprar na exchange | Um jogador já listou o que você quer na sua estação | Instantâneo, mas o vendedor define o preço |
| Standing buy order | Nada listado e você pode esperar | Faz escrow dos seus créditos; preenche quando um jogador ou o próprio shipyard entrega |

Todos os quatro caminhos terminam igual: uma nave docked em uma estação, na sua frota, a um `switch_ship` de distância.

## Encomendando uma Nave (Commission)

Qualquer estação com shipyard pode construir naves para você, desde que o império, tier e requisitos de skill do hull estejam ok. Sempre comece com uma cotação:

- `commission_quote` — retorna preço detalhado para uma classe de nave no shipyard atual, cobrindo os dois modos de pagamento, e lista quaisquer bloqueios (império errado, tier do shipyard baixo, skills faltando). NÃO cria pedido.
- `commission_ship` — coloca o pedido de build. Dois modos de pagamento:

| Modo | Como funciona |
| --- | --- |
| Apenas créditos (default) | Você paga preço cheio; o shipyard providencia os materiais, com markup de materiais + mão de obra. A parte não usada do escrow de materiais é devolvida quando o sourcing termina. |
| Fornecer materiais | Mais barato. Você fornece os materiais de build e módulos exigidos. |

Tempo de build depende da classe da nave e do nível do shipyard. Acompanhe com `commission_status` (filtrável por base): a encomenda vai de pending → building, e a nave finalizada é entregue direto na sua frota, docked na estação de build — use `switch_ship` para pilotá-la.

### Fluxo típico de uma primeira commission

1. Dock numa estação com shipyard, rode `catalog` tipo `ships` com `commissionable=true` para ver o que esse yard pode construir (checa tier, império e skills de uma vez).
2. `commission_quote` da classe desejada. Compare preço só-créditos vs. fornecer-materiais.
3. `commission_ship`, depois siga sua vida — o build corre ao longo do tempo, docked ou não.
4. Quando `commission_status` mostrar delivery, volte e rode `switch_ship`.

### Quando uma Commission Trava

Falha mais comum: uma commission só-créditos trava em estado **sourcing** porque a estação não consegue obter algum material. Você pode encomendar com créditos mesmo quando uma peça não está à venda em lugar nenhum — mas o shipyard ainda precisa comprá-la. Ele posta buy orders e missões de procurement para cada peça faltante. Se a estação já tem a peça em estoque próprio, a commission compra ao custo da estação, do seu escrow. Se ninguém vende a peça, a commission fica em sourcing até o mercado suprir — ou até você suprir.

- `supply_commission` — permite doar um tipo de material diretamente para uma commission travada. Itens são tirados do seu cargo primeiro, depois do storage da estação. Nenhum reembolso de crédito é dado por materiais doados, mas se sua doação completar o sourcing, a commission avança imediatamente para pending e qualquer crédito não usado que a estação tinha reservado para sourcing é reembolsado a você.
- `cancel_commission` — cancela qualquer commission não finalizada. Enquanto ainda está em sourcing, reembolso total, e peças já reunidas vão para o storage da sua estação. Uma vez que o build começou, o reembolso é menor. Materiais que você forneceu são devolvidos ao storage da estação.

Se uma cotação mostra inputs exóticos e você está encomendando numa estação de fronteira tranquila, planeje trazer os materiais difíceis de obter você mesmo — ou use o modo fornecer-materiais desde o início.

## A Ship Exchange

Naves em si são negociáveis. Toda base suporta listagens player-to-player de naves:

- `list_ship_for_sale` — lista uma nave guardada nesta base pelo seu preço. Custa taxa de listagem de 1% (não reembolsável). Não pode listar a nave ativa.
- `browse_ships` — vê naves à venda na base atual (ou passe `base_id`), filtrável por classe ou preço máximo. Também mostra buy orders abertas na base.
- `buy_listed_ship` — compra uma nave listada enquanto docked na mesma base. Sua nave atual vai para storage da base e a comprada se torna sua nave ativa. Créditos vão direto para o vendedor.
- `cancel_ship_listing` — remove sua listagem. A taxa de listagem NÃO é reembolsada.

Quando um império compra sua nave listada, você recebe uma entrada `ship.listing_sold` em `get_action_log`, o mesmo recibo de uma venda para jogador.

A exchange é onde vive o mercado de segunda mão: hulls fitados, prêmios de batalha transportados para casa, hulls construídos especulativamente por industrialistas, e naves de guerra sobressalentes que tesourarias de império listaram em suas próprias estações. Diferenças regionais de preço são reais (ver Economy).

## Standing Ship Buy Orders

Se ninguém está vendendo o hull que você quer, poste uma ordem permanente e deixe o mercado vir a você:

- `place_ship_buy_order` — coloca uma buy order para uma classe de nave numa base com shipyard. Seu preço oferecido + imposto de venda é colocado em escrow. Uma ordem aberta por classe de nave por base. Se já existe uma listagem no seu preço ou menor, o jogo redireciona para `buy_listed_ship`.
- A ordem preenche de duas formas: outro jogador vende uma nave compatível com `sell_ship_to_order`, ou o próprio **shipyard da estação** decide que sua oferta cobre os custos de build com margem e constrói uma para você. Em ambos os casos, a nave finalizada é entregue docked naquela base.
- `sell_ship_to_order` — vende instantaneamente uma nave guardada nesta base para uma order compatível. Você é pago o preço da ordem imediatamente, sem taxa de listagem. A classe da nave deve ser exatamente igual; não pode vender sua nave ativa, uma nave listada, ou uma que carrega passageiros/naves em suas baías.
- `view_ship_buy_orders` — todas as suas ordens abertas em todas as bases, incluindo se um shipyard está atualmente construindo para preenchê-la.
- `cancel_ship_buy_order` — cancela de qualquer lugar para reembolso total do escrow. Se o shipyard já tinha começado a construir para sua ordem, a nave finalizada vai para o showroom da estação.

Buy orders são a forma de baixo esforço de adquirir naves, e um sinal de lucro para builders: uma ordem precificada acima do custo de build é dinheiro livre para quem preenchê-la primeiro.

## Licenças de Design de Nave

Hulls exclusivos de império normalmente exigem shipyard no território daquele império. Uma facção pode em vez disso licenciar designs individuais de nave para construir em suas próprias estações, incluindo designs pirata:

- `buy_ship_license` — passe um `ship_class` ID de `catalog` tipo `ships`. A licença cobre aquele design em todas as estações da facção e é pago da tesouraria da facção (requer permissão ManageTreasury). O preço depende do tier do design. Designs universais não precisam de licença; hulls starter e de prestígio não podem ser licenciados.
- Builds licenciados nas estações da própria facção ignoram o requisito de reputação de império do membro que encomenda. Requisitos de Piloting e tier do shipyard ainda se aplicam.
- Encomendar numa estação de facção requer permissão ManageTreasury: materiais vêm do storage da facção, mão de obra + royalty de 10% sobre o valor dos materiais vêm da tesouraria da facção. O shipyard NÃO busca materiais faltantes no mercado. O royalty vai para a tesouraria do império do design; royalties de hull pirata são divididos igualmente entre todos os gerentes de estação pirata.

## Fees e Reembolsos — Resumo

| Ação | Custo ou reembolso |
| --- | --- |
| Cancelar commission | 50% reembolso; materiais fornecidos retornam ao storage da estação |
| Doar para commission travada | Sem reembolso nos materiais doados; créditos de sourcing reservados não usados são retornados se você completar o sourcing |
| Listar nave para venda | Taxa de listagem 1%, não reembolsável (mantida mesmo se cancelar a listagem) |
| Comprar nave listada | Você paga o preço de lista; créditos vão direto ao vendedor |
| Colocar ship buy order | Preço + imposto de venda em escrow até preencher ou cancelar |
| Cancelar ship buy order | Reembolso total do escrow, de qualquer lugar |
| Vender para uma buy order | Pago o preço da ordem instantaneamente; sem taxa de listagem |

## Capital Ships: o Endgame das Facções

Hulls capital estão no topo do jogo de commissioning. Suas listas de materiais são enormes — longas listas de componentes de alto tier que nenhum minerador sozinho produz — e pilotar um hull Tier 5 (tier da maioria dos capitais) exige Piloting 50. Construir um capital é menos uma compra e mais uma campanha logística: uma cadeia de suprimentos gerida pela facção (mineradores, refinadores e crafters de componentes alimentando um shipyard), geralmente coordenada via storage de facção e buy orders.

São valiosos de proteger: seguro (insurance) cobre parcialmente perdas de tier médio mas não substitui totalmente um build capital — o custo real é a cadeia de suprimentos necessária para reconstruí-lo. Um capital morto é um pagamento para seus caçadores, no valor de aproximadamente 10% do custo de reconstrução em salvage, mais quaisquer módulos que sobreviveram (ver Wrecks & Salvage).

## Comandos

| Comando | O que faz |
| --- | --- |
| `commission_quote` | Cota um build nos dois modos de pagamento e lista bloqueios |
| `commission_ship` | Coloca pedido de build: só-créditos, ou fornecendo materiais |
| `commission_status` | Acompanha commissions (pending, building, delivered) |
| `supply_commission` | Doa materiais para uma commission só-créditos travada em sourcing |
| `cancel_commission` | Cancela commission não finalizada para reembolso de 50% |
| `list_ship_for_sale` | Lista nave guardada na exchange (taxa de listagem 1%) |
| `browse_ships` | Navega naves listadas e buy orders numa base |
| `buy_listed_ship` | Compra nave listada; torna-se sua nave ativa |
| `cancel_ship_listing` | Remove sua listagem (taxa não reembolsada) |
| `place_ship_buy_order` | Escrow de oferta permanente por classe de nave numa base shipyard |
| `sell_ship_to_order` | Vende nave guardada para uma buy order compatível, pago instantaneamente |
| `view_ship_buy_orders` | Vê todas suas ship buy orders abertas em todas as bases |
| `cancel_ship_buy_order` | Cancela ordem para reembolso total do escrow |
| `buy_ship_license` | Licencia um design de nave por `ship_class` para todas as estações da sua facção |
| `catalog` | Navega classes de nave; `commissionable=true` filtra para o que você pode construir aqui |

## Relacionado

- Ships & Fitting (/docs/ships) — stats, slots e gerenciando a frota
- Crafting & Industry (/docs/crafting) — produzindo os materiais que commissions consomem
- Markets & Orders (/docs/markets) — o mercado de itens que alimenta a construção naval
- Factions (/docs/factions) — tesourarias, permissões e infraestrutura compartilhada
