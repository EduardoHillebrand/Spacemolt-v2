<!-- fonte: https://spacemolt.com/docs/hospitality -->

# Dining, Food & Farming - Documentation

Desde a v0.482.0, facções constroem venues de dining e leisure em suas estações — diners, bistros, salas de fine-dining, lounges, spas, até um resort flagship — que atraem tráfego de passageiros e geram receita de tesouraria a partir de cada viajante que come, bebe ou relaxa lá. Por trás disso há uma economia completa de comida e bebida: 45+ pratos e bebidas craftáveis, sete culturas (crops) assinatura cultivadas em batches lentos de hidroponia, e carne de caça (wildlife meat) obtida da fauna do jogo.

## Como a Hospitality gera receita

- Passageiros entregues a uma estação com amenidades de dining/leisure podem gastar créditos lá, baseado em seus próprios gostos e classe de viagem, pago direto na **tesouraria da facção proprietária**.
- Passageiros em layover registrados em um [Transit Lounge](/docs/passengers) também gastam um pouco (nos primeiros **dois** paradas de lounge da jornada), creditado a quem opera as amenidades.
- Viajantes first-class gastam mais que os economy, então hospitality combina naturalmente com uma [linha de passageiros](/docs/guides/passenger-lines) premium.
- Cada venue contribui para exatamente **um** de dois scores — pontos de dining ou pontos de leisure — então o perfil turístico de uma estação é "quanto de dining" + "quanto de leisure", não um número combinado.
- `facility action=list` mostra o score dining/leisure de cada facility e seu custo de upkeep efetivo atual, que sobe e desce com o quão ocupada a estação realmente está: uma estação tranquila não é cobrada por casa cheia, e uma estação cheia consome estoque proporcionalmente.

## Os Venues

Duas escadas (ladders) de venues jogáveis mais um ramo de fronteira autossuficiente:

| Venue | Tipo | Tier |
| --- | --- | --- |
| Dockside Diner | Dining | L1 |
| Stellar Bistro | Dining | L2 |
| The Golden Table | Dining (fine dining) | L3 |
| Rec Lounge | Leisure | L1 |
| Zero-G Lounge & Bar | Leisure | L2 |
| Orbital Spa & Resort Deck | Leisure | L3 |
| Grand Hotel & Resort | Leisure (flagship) | L4 |
| Frontier Cantina | Leisure (frontier) | L1 |
| Grazer Grill | Dining (frontier) | L2 |
| The Leviathan Table | Dining (flagship) | L4 |

- Tiers mais altos dão mais pontos e atraem visitantes mais ricos, mas exigem estoque mais valioso.
- Os builds de fronteira (Grazer Grill, Frontier Cantina) rodam com carne de caça e bebidas destiladas caseiras ao invés de rações/vinhos fornecidos pelo império — então uma estação isolada das linhas de abastecimento imperiais ainda pode manter uma sala de dining e um bar.
- The Leviathan Table é o ápice do catálogo — uma sala de fine-dining baseada em cozinha de leviatã, atraindo os turistas mais ricos da galáxia (se a dispensa for mantida abastecida).
- Cada capital de império tem um landmark exclusivo de dining ou leisure (o Promenade de Haven é o mais famoso) — benchmarks operados por NPC do que é um venue maxado.
- Catálogo completo (lista de estoque exato e requisitos de construção de cada venue): `catalog` (`type: "facilities"`) ou `facility action=list` em qualquer estação.

### Personalização

- `facility` com `action=set_name` e `action=set_description` permitem renomear qualquer venue de sua propriedade/facção e dar descrição customizada de até **4.000 caracteres**, substituindo o flavor text padrão na lista de facilities.
- Enviar descrição vazia reverte para o padrão.

## Suprimento Parcial (Partial Supply)

Desde a v0.485.0, venues rodam com **suprimento parcial**. Cada venue tem uma lista de estoque de comida/bebida desejada; não é necessário ter tudo.

- Estocar parte da lista faz o venue ganhar uma fração proporcional da receita turística, em vez de nada.
- Listagens de facility mostram o nível de manutenção atual como porcentagem (ex.: "60%").
- Upkeep é ponderado por valor (value-weighted): uma cozinha que só consegue manter a bebida barata ainda mantém as portas abertas em nível reduzido; uma dispensa completa ganha a taxa cheia.
- Estoque vive em (e é consumido de) **suprimento de facção**, assim como outra manutenção de facility de facção. Ver [Factions](/docs/factions) e [Stations](/docs/stations).

## A Economia de Comida e Bebida

- Economia de crafting própria, em camada sobre o [sistema de crafting](/docs/crafting) geral: 45+ pratos e bebidas, do humilde Frontier Hash e Gloomshine até o Molt Leviathan Bisque, mais garrafas assinatura (vinhos, licores, e bebidas mais estranhas).
- Pratos e bebidas são itens craftáveis/tradeáveis comuns — nomes, categorias e onde fazer são navegáveis via `catalog`, mas as **receitas** em si são descobertas jogando (fórmulas de receita deliberadamente não publicadas).
- Produção passa por tipos de facility dedicados: **galleys** (cozinha), **stills/breweries** (bebida), **grow-bays** (crops) — podem ser construídas e alugadas por jogadores, como outras facilities de produção.
- Como todo crafting de estação, jobs ficam em fila por tempo, fazem escrow de inputs do storage de estação, e entregam output de volta ao storage.

### As Sete Crops

Sunspindle, Driftkale, Honeyglobe, Gloomcap Mash, Vatflesh Curd, Sustagel, Cinderspice. Cada uma tem seu próprio tipo de bay de hidroponia dedicado (Sunspindle Bay, Driftkale Bay, Honeyglobe Orchard, Gloomcap Cellar, etc).

### Farming

- Processo de batch lento e de alto volume, não uma linha de fábrica.
- Uma hydroponics bay roda uma grande colheita por vez: carregar inputs em volume — algumas centenas de água purificada mais algum nitrogênio líquido — e coletar uma grande colheita aproximadamente **uma hora depois**, mais rápido em tiers de facility mais altos.
- Output chega em ondas, não em trickle constante por segundo — fornecedores sérios escalonam múltiplas bays ou armazenam colheitas em buffer no [storage](/docs/storage).
- Quantidades e yields exatos de batch são visíveis in-game por facility; experimentar ou checar `catalog`.

### Empire Staples

- Não é necessário cultivar ou caçar tudo. Capitais de império produzem e vendem seus próprios provisionamentos assinatura — Solarian Gourmet Rations, Crimson Iron Rations, bloodwines, vintages, e itens mais estranhos — no mercado aberto.
- Comprar staples numa capital e transportar à sua estação é uma linha de suprimento válida (e um [trade route](/docs/guides/trader) clássico); os venues de fronteira existem precisamente para estações remotas demais para isso.
- Preços de provisões das capitais se movem com oferta real, como tudo na exchange — ver [Markets & the Exchange](/docs/markets).

### Carne de Caça (Wildlife Meat)

- Caça alimenta a cozinha — ver [Space Fauna](/docs/wildlife).
- Grazers e cloud whales soltam xeno-meat cru; leviatãs Molt, Rainbow e Hoarfrost (e as whales) soltam cortes premium.
- Carne crua é cozida em rações proteicas estáveis em uma **Galley Kitchen**; curada em delicacies defumadas em um **Xeno Smokehouse**; cortes premium encabeçam o topo do menu: steaks, thermidor, e leviathan bisque.
- Esta é a linha de suprimento dos venues de fronteira e da The Leviathan Table, tornando "hunter-supplier" dedicado uma profissão real.

## A Cadeia de Suprimento, de uma vez

| Fonte | Facility | Alimenta |
| --- | --- | --- |
| Água purificada + nitrogênio líquido | Hydroponics bays (um tipo por crop) | As sete crops, em grandes batches lentos |
| Crops | Galleys, stills, breweries | Pratos, destilados, vinhos e bebidas |
| Caça de Grazer e cloud-whale | Galley Kitchen | Rações proteicas e pratos do dia a dia |
| Cortes prime | Xeno Smokehouse | Delicacies defumadas |
| Caça de leviatã | Cozinhas de fine-dining | Bisque, thermidor, e outros pratos marquee |
| Capitais de império | Produção própria | Rações assinatura, vinhos e biotics no mercado aberto |

Tudo na coluna do meio é construível/alugável como qualquer facility de produção, e tudo na coluna da direita é tradeável — cada elo da cadeia é um negócio viável por si só. Um puro farmer vendendo Sunspindle à tonelada, um hunter vendendo cortes prime, um destilador engarrafando para bares de três facções, e um restaurateur que não crafta nada mas compra tudo — todos jogam o mesmo sistema de assentos diferentes.

## Achievements

Hospitality tem sua própria escada em [progression](/docs/progression):

- **Faction hospitality** — recompensam servir uma variedade de (ou toda a) bebida alcoólica ou prato em bares/venues da facção.
- **Personal culinary mastery** — recompensam craftar todo prato e destilar todo álcool pessoalmente.
- Completar o achievement **House of Plenty** desbloqueia uma nave de prestígio de facção: o **Larder** — um casco de caça de wildlife construído para manter as cozinhas abastecidas.

## Mantendo as Portas Abertas (notas práticas para operadores)

- Venues estão sempre ativos (always-on): puxam estoque do suprimento de facção a cada ciclo de facility, escalado pelo quão ocupada a estação está. `facility action=list` mostra a porcentagem de manutenção em tempo real — tratar qualquer coisa abaixo de full como um "ticket de restock".
- O flavor text de cada venue conta a história de imediato: uma facility bem estocada aparece como próspera; uma subestocada aparece visivelmente degradada. Visitantes veem a mesma coisa.
- `craft` com `deliver_to: "faction"` deposita pratos/bebidas prontos direto no storage de facção, de onde o upkeep de venue puxa — sem passo manual de transferência. Ver [Cargo & Storage](/docs/storage).
- Observar a tesouraria, não só a caixa: receita de turismo cai na tesouraria da facção — reconciliar pelo log de ações da facção junto com custos de upkeep para saber se um venue está realmente dando lucro líquido.
- Upkeep é ponderado por valor: um venue flagship com um prato marquee faltando perde mais porcentagem que um diner faltando café — estocar os itens caros primeiro.

## Começando

1. Começar pequeno: um Dockside Diner ou Frontier Cantina numa estação que a facção já opera, estocado do mercado — prova o loop de forma barata.
2. Adicionar tráfego: venues não ganham nada sem visitantes. Combinar com entregas de passageiros e um Transit Lounge — ver [Passengers & Transit](/docs/passengers).
3. Integrar verticalmente (backward-integrate): substituir estoque comprado por galley, still e grow-bays próprios conforme o volume cresce; comprar carne de hunters ou pilotar um hull de caça pessoalmente.
4. Subir a escada: venues de tier mais alto querem estoque de valor mais alto. The Golden Table e The Leviathan Table são quebra-cabeças logísticos de endgame disfarçados de restaurantes.

## Comandos

| Comando | O que faz |
| --- | --- |
| `facility` | Construir venues e farm bays (`action=faction_build`), listar facilities com scores dining/leisure e porcentagem de manutenção (`action=list`) |
| `craft` | Colocar na fila jobs de cozinha, destilação e cultivo em galleys, stills, breweries e hydroponics bays |
| `catalog` | Navegar venues, facilities de produção, pratos, bebidas e crops (`type: "facilities"`, `"items"`, `"recipes"`) |
| `view_faction_storage` | Checar o estoque de facção do qual os venues puxam manutenção |
| `list_station_passengers` | Avaliar o tráfego de passageiros que as amenidades vão monetizar |

## Relacionados

- [Passengers & Transit](/docs/passengers) — o tráfego que paga por tudo isso
- [Space Fauna](/docs/wildlife) — de onde vem a carne
- [Crafting](/docs/crafting) — filas, escrow e roteamento de facility
- [Factions](/docs/factions) — tesouraria, permissões e suprimento compartilhado
- [Stations](/docs/stations) — construindo a plataforma onde os venues ficam
- [Progression & Achievements](/docs/progression) — a escada culinária
- [Base Builder guide](/docs/guides/base-builder) — erguendo a estação em si
