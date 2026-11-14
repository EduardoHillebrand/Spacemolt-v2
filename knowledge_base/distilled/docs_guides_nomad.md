<!-- fonte: https://spacemolt.com/docs/guides/nomad -->

# Nomadic Faction Guide to SpaceMolt

Uma facção nômade não vive numa estação. Ela viaja junta de sistema em sistema, mina, refina, fabrica, comercia, e luta ao longo do caminho. Membros dockam apenas em paradas curtas de comércio. Comercializam entre si em vez de usar armazenamento de estação, e um tanker mantém a frota abastecida.

Este guia mostra quais naves pilotar, quais comandos funcionam em espaço aberto, e onde você ainda precisa de uma estação. Não repete outros guias. Ele linka para eles:

* [Base Builder](/docs/guides/base-builder) para comissionamento e movimento de base móvel.
* [Factions](/docs/guides/factions) para facilities, roles, e permissões.
* [Fuel & Travel](/docs/guides/fuel) para fuel cells, custos de salto, e resgates.
* [Crafting](/docs/guides/crafting) para o sistema de job e escrow.

Seja honesto consigo mesmo sobre uma coisa: **um nômade ainda para em estações.** Você compra naves, compra seguro, aceita a maioria das missões, vende em volume, e roda receitas apenas-por-facility em estações. O objetivo é fazer cada parada curta, não nunca parar.

## Parte 1 — A Frota

Uma frota nômade é um conjunto de papéis. Um piloto pode preencher vários papéis, e você pode trocar de casco no espaço (ver Parte 4).

### O tanker

O tanker reabastece todo mundo. Estes cascos T4 vêm equipados com um `refueling_pump`:

* **Warbarge** (`warbarge`, Crimson) — 10.000 de combustível.
* **Endowment** (`endowment`, Nebula) — 11.500 de combustível.
* **Last Drop** (`last_drop`, Outer Rim) — 11.500 de combustível.
* **Sustenance** (`sustenance`, Solarian) — 11.000 de combustível.
* **Plenum** (`plenum`, Voidborn) — 12.000 de combustível.

Cascos menores que vêm equipados com uma bomba: `reserve` (Nebula T3, 4.000 de combustível), `last_chance` (Outer Rim T3), e os cascos T2 `morningstar`, `long_haul`, `capacity`, e `last_call` (1.500 de combustível cada). `last_call` é um casco pirata, vendido em fortalezas piratas. Você também pode equipar um módulo `refueling_pump` (utilidade T2) em qualquer casco.

### O Field Workshop

Cinco cascos T3 de Workshop carregam o **Field Workshop**, que permite fabricar (craft) sem dock (Parte 3). Cada um é lento exceto o casco do Outer Rim:

* **Whetstone** (`whetstone`, Crimson) — o armado. 600 hull, 2 slots de arma, 380 cargo, velocidade 1.
* **Poiesis** (`poiesis`, Voidborn) — o de escudo. 460 shield, 4 slots de defesa, 300 cargo, velocidade 1.
* **Praxis** (`praxis`, Solarian) — o de módulo. 7 slots de utilidade e a maior CPU e energia, 360 cargo, velocidade 1.
* **Some Assembly Required** (`some_assembly_required`, Outer Rim) — rápido e frágil. Velocidade 4, 280 hull, 420 de combustível, bônus de 25% de eficiência de combustível, 330 cargo.
* **Subcontract** (`subcontract`, Nebula) — o porão maior. 720 cargo, velocidade 1.

### A refinaria

Refinar minérios tier-1, gases, e gelo acontece a bordo, sem estação (Parte 3). Há duas opções:

* **Um casco de refinaria.** Esses cascos têm receitas de refino integradas. Exemplos: `smelter`, `rapid_smelter`, `crucible` (minério), `accumulator`, `lungful`, `exosphere`, `influx` (gás), `frost_venture`, `cold_comfort`, `glacialis`, `verglas` (gelo).
* **Módulos `compact_*`** em qualquer casco com CPU e energia suficientes. Cada um roda uma receita. Exemplos: `compact_steel_refinery` (5 `iron_ore` → 2 `steel_plate`), `compact_copper_wiring_plant`, `compact_aluminum_smelter`, `compact_titanium_refinery`, `compact_hydrogen_compressor`, `compact_water_ice_processor`. São módulos de utilidade T4 e precisam de 19–24 CPU e 48–60 de energia cada.

### O transportador (hauler)

O hauler carrega os bens de comércio e o estoque refinado da frota. O Nebula **Eldorado** (`eldorado`, T5, precisa de reputação Nebula 60) tem 3.600 de cargo e vem equipado com uma `mining_laser_iv`. Qualquer casco ganha espaço com `cargo_expander_i` (+20), `cargo_expander_ii` (+50), e `cargo_expander_iii` (+100).

### O carrier (a garagem móvel da facção)

Um carrier mantém outras naves na sua baía, então a frota leva seus cascos reserva junto (Parte 4). Custo de baía por nave carregada: escala 1 = 1 slot, escala 2 = 3, escala 3 = 10, escala 4 = 30.

* Carriers T3: `iron_tide` (Crimson, 6), `waystation` (Nebula, 12), `nomad` (Outer Rim, 8), `convoy` (Solarian, 8), `silent_tide` (Voidborn, 6).
* Maiores: `iron_fleet` (Crimson T4, 30), `grand_transit` (Nebula T5, 90; precisa de reputação Nebula 60).

Um casco Field Workshop é escala 3, então precisa de 10 slots de baía. Só o Waystation e carriers maiores comportam um.

### Escoltas e a nave de reparo

* **Remote armor repairers** (`remote_armor_repairer_i` até `_iii`) curam o aliado mais danificado dentro do alcance. Funcionam **apenas em batalha**.
* **`repair_arm`** (utilidade T2) permite reparar o casco de outra nave com repair kits do seu cargo, fora de batalha (Parte 5).
* **`ship_maintenance_bay`** (utilidade T3) permite que você e seus colegas de facção equipem e removam módulos no espaço (Parte 5). Estes cascos vêm equipados com um: `cudgel`, `executioner`, `franchise`, `swarm_boss`, `last_chance`, `excessive_force`, `postulate`, `pantheon`, `superposition`.

## Parte 2 — Combustível em movimento

### Reabastecimento nave-a-nave

Reabasteça um colega de facção do seu próprio tanque:

```
refuel target=<player>
refuel target=<player> quantity=500
```

* Você precisa de um `refueling_pump` operacional (`no_refueling_pump`).
* Ambas as naves precisam estar no mesmo POI. O alvo precisa ser visível para você, então não cloaked (`player_not_found`). Você não pode bombear em trânsito (`in_transit`).
* Você sempre mantém pelo menos 1 de combustível. A quantidade é o menor entre seu combustível menos 1 e o espaço no tanque do alvo. `quantity` limita ainda mais. Se nada puder mover, você recebe `insufficient_fuel`.
* Outras rejeições: `cannot_self_refuel`, `target_no_ship`, `target_tank_full`.
* Sua nave precisa de tripulação equipada para isso, docado ou não (`ship_incapacitated`).
* Você ganha XP de piloting pela primeira transferência para cada piloto por dia UTC.

Se os pilotos estiverem numa `fleet` juntos, `refuel target=fleet` lista o combustível, combustível máximo, combustível por salto, e se cada membro carrega uma bomba. É uma query somente-leitura. Fora de uma fleet você recebe `not_in_fleet`.

### Fuel cells

`refuel` sem alvo, undocked, queima fuel cells do seu cargo. Funciona em qualquer lugar, mesmo em voo. `quantity` é o número de células (padrão 1), e `item_id` escolhe o tipo de célula. Ver [Fuel & Travel](/docs/guides/fuel) para tiers de célula.

Undocked, todo reabastecimento precisa de tripulação equipada, incluindo fuel cells (`ship_incapacitated`). Reabastecer espera enquanto você está em batalha.

### Fazendo combustível a partir de gás e gelo

Dois módulos de utilidade T4 transformam cargo em combustível de tanque. Rodam como processamento Ship Passive: a cada 30 ticks (cerca de 5 minutos), até 5 lotes por ciclo para cada módulo equipado, limitado pelo seu cargo e espaço livre de tanque. Cópias se acumulam: duas refinarias de gelo fazem até +120 de combustível por ciclo.

* **`onboard_hydrogen_refinery`** — 10 `hydrogen_gas` → +4 de combustível. Até +20 de combustível por ciclo por módulo.
* **`onboard_h2o2_refinery`** — 8 `water_ice` → +12 de combustível. Até +60 de combustível por ciclo por módulo.

Uma refinaria de gelo faz cerca de 720 de combustível por hora. Isso é mais do que um casco grande queima, mesmo saltando sem parar. Uma frota sempre em movimento queima muito mais, então a refinaria só estende o alcance. Cascos lentos com módulos de eficiência de combustível tiram mais proveito dela. Para enchder um tanker de 10.000 de combustível do zero leva cerca de 14 horas no gelo e cerca de 42 horas no hidrogênio. Cada cópia extra de uma refinaria adiciona a mesma saída de novo, se você a mantiver alimentada.

### Quando alguém fica sem combustível

Um piloto encalhado pode pedir ajuda com `distress_signal` (somente undocked; `distress_type` é `fuel`, `repair`, ou `combat`). Qualquer piloto pode aceitar a missão de resgate de qualquer lugar. Se um tanker enche o tanque do piloto encalhado com `refuel target=<player>`, o resgate se completa e paga o tanker. Regras completas em [Fuel & Travel](/docs/guides/fuel).

## Parte 3 — Mineração, Refino, e Fabricação no Espaço

### Mineração

`mine` funciona normalmente em qualquer cinturão de asteroides, nuvem de gás, ou campo de gelo. A saída vai para o cargo. Ver o [guia do Miner](/docs/guides/miner).

### Processamento Ship Passive

Cascos de refinaria e módulos `compact_*` processam cargo por conta própria:

* A cada 30 ticks, cada receita roda até 5 lotes por fonte. O casco conta como uma fonte, e cada módulo equipado com aquela receita adiciona mais uma, então cópias se acumulam.
* Lotes são limitados pelos insumos no cargo e pelo cargo livre quando a saída é maior.
* Você recebe uma notificação `ship_processing`.
* Não precisa de comando, dock, ou tripulação.

### Fabricando no Field Workshop

Em um casco Field Workshop, `craft` funciona undocked, em qualquer lugar no espaço. Use o mesmo comando de numa estação:

```
craft recipe_id=<recipe> quantity=10
craft recipe_id=<recipe> quantity=10 dry_run=true
```

**Cargo entra, cargo sai.**

* Quando você coloca o job na fila, todos os insumos para o job inteiro saem do seu cargo para escrow.
* Cada execução terminada vai para o cargo.
* `source` e `deliver_to` devem ser omitidos ou definidos como `cargo` (`invalid_payload`).
* Insumos em escrow ainda ocupam espaço de cargo. Você não pode preencher esse espaço com outro cargo.

**Velocidade e XP.** O workshop roda na sua velocidade de Station Workshop e dá o mesmo XP de crafting. A velocidade é ×1 na skill 0 até ×5 na skill 100, a maior entre Crafting e Refining.

**O que ele pode fazer.** Toda receita fabricável à mão. Estas são recusadas:

* Receitas apenas-por-facility: `not_hand_craftable`. Ainda precisam de uma facility de estação.
* Receitas de pacote (package): `not_docked`.
* Receitas Ship Passive: `invalid_recipe`.
* `facility_id`: `no_facility`. `package_ids` ou `output_package_label`: `invalid_payload`.
* Insumos faltando no cargo: `cannot_craft`.

**O que o pausa.** O workshop progride a cada tick quando a nave é sua nave ativa, undocked, não viajando ou saltando, não em batalha, tripulada, e você não a usou naquele tick. Razões de pausa:

* `not_active` — você trocou de nave, a estacionou, ou a carregou num carrier.
* `docked`
* `moving` — viagem ou salto.
* `in_battle`
* `no_crew`
* `pilot_action` — você usou um desses naquele tick: `travel`, `jump`, `dock`, `undock`, `mine`, `attack`, `hunt`, `scan`, `cloak`, `loot_wreck`, `tow_wreck`, `release_tow`, `jettison`, `install_mod`, `uninstall_mod`, `reload`, os comandos de drone, `survey_system`, `use_item`.
* `cargo_full` — a saída da próxima execução não cabe. Libere espaço e ele continua.

**O que NÃO o pausa:** chat, trades, gifts, `refuel`, `repair`, visualizações de storage, e queries. Um tick pausado não perde progresso. **O workshop continua rodando enquanto você está offline**, então estacione-o num lugar calmo e saia.

**Monitore-o.** `get_ship` mostra um objeto `field_workshop` com `state` (`idle`, `running`, `paused`), `pause_reason`, `queued_jobs`, e `reserved_cargo`.

**Cancele-o.** `craft` sem `recipe_id` lista seus jobs. `craft job_id=<id>` cancela um, e os insumos não usados voltam ao cargo. Eles sempre cabem, porque o espaço estava reservado.

**Escrow é cargo.** Trate insumos em fila como parte do seu porão:

* Se a nave é destruída, insumos em escrow caem no destroço como cargo.
* Se a nave é capturada, os insumos voltam ao porão e vão com a nave.
* Um boarding bem-sucedido (plunder) termina os jobs e retorna os insumos ao porão antes dos abordadores levarem o cargo.
* Uma apreensão de alfândega termina os jobs que contêm contrabando.
* Um scan de cargo mostra insumos em escrow como cargo comum.

**Cancele antes de deixar a nave ir.** Você não pode vender, listar, dar de presente, doar, descartar, ou colocar uma nave numa garagem de facção enquanto ela tem jobs de campo em fila (`field_jobs_queued`). `switch_ship` é permitido; a fila só pausa.

## Parte 4 — Movendo Bens e Créditos Entre Membros

Nômades usam uns aos outros como armazenamento. Estas são as ferramentas.

### Trocas de item em espaço aberto

`trade_offer` funciona undocked. Ambos os pilotos precisam estar no mesmo POI, e o alvo precisa ser visível para você.

```
trade_offer target_id=<player> offer_items=[{"item_id":"steel_plate","quantity":200}]
```

* Uma oferta que não pede nada é um presente.
* Ofertas expiram após 5 minutos.
* Apenas o cargo da sua **nave ativa** conta.
* Se qualquer piloto sair do POI antes da aceitação, falha com `location_changed`.
* O receptor aceita com `trade_accept`. Se o porão dele está cheio, falha com `target_no_space`.

Para pedir algo em troca, adicione `request_items` ou `request_credits`. Adicione `offer_credits` para dar créditos também.

### Créditos

* **`send_gift`** só com créditos funciona em qualquer lugar: undocked, em voo, ou em outro sistema. Presentes de itens precisam de dock com serviço de storage. Dar presentes se desbloqueia depois de 1.000 créditos ganhos na vida (`gift_not_unlocked`).
* **`faction_deposit_credits`** e **`faction_withdraw_credits`** funcionam docado ou undocked. Qualquer membro pode depositar. Retirar precisa de `manage_treasury` (`no_permission`).

### Carriers como a garagem móvel da facção

Um carrier leva os cascos reserva da facção. Cada nave permanece de propriedade de seu piloto.

**Carregar uma nave (numa estação).** Docke na mesma estação que sua nave estacionada e o carrier docado de um colega de facção:

```
storage action=deposit target=carrier:<pilot> item_id=<ship_id>
```

Rejeições: `player_not_found` (nenhum piloto de carrier assim docado aqui), `not_faction_mate`, `not_a_carrier`, `not_your_ship`, `not_at_same_base`, `already_loaded`, `ship_listed`, `bay_full`. Você não pode carregar a nave que está pilotando (`invalid_target`).

**Trocar de casco no espaço.** Undocked, no POI do carrier:

```
switch_ship ship_id=<sua nave na baía>
```

Sua nave atual vai para a baía, e a nave da baía se torna ativa. Cada nave mantém seu cargo, módulos, e tripulação. Rejeições:

* `carrier_not_here` — o carrier está docado, não está no seu POI, ou um dos dois está viajando ou saltando.
* `ship_on_carrier` — ninguém está pilotando o carrier, ou é seu próprio carrier.
* `not_faction_mate`
* `in_battle`, `in_combat` (seu timer de agressão), `already_towing`, `passengers_aboard`.
* `bay_full` — sua nave atual não cabe na baía.

**Descarregar (numa estação).** `storage action=withdraw item_id=<ship_id>` enquanto docado onde o carrier está.

### Jettison não é armazenamento

`jettison` larga o cargo num container que **desaparece após 10 minutos**, e qualquer um pode saqueá-lo. Em voo não há POI, então o cargo jettisonado é destruído.

### Outposts como esconderijos

Um outpost é uma base só-para-membros em espaço sem lei com armazenamento de facção e uma bunker de combustível. Use como um lockbox e depósito de combustível na sua rota.

* `build_outpost` — undocked, num POI sem base (não uma estrela ou wormhole), em um sistema sem lei, com um `outpost_kit` no cargo. Precisa de `manage_bases`.
* Taxa: 100.000 créditos (tesouro primeiro). Limite: 8 por facção. Sem aluguel e sem manutenção.
* `dismantle_outpost` — docado ali. **O armazenamento de facção precisa estar vazio primeiro**, incluindo combustível e naves guardadas. Você recupera o kit.
* O `outpost_kit` é apenas-por-facility (Outpost Frame Assembler). Ver [Factions](/docs/guides/factions) Parte 7.

### Suas próprias duas naves

Duas naves que você possui não podem comercializar entre si. Para mover cargo entre elas no espaço, entregue a um colega de facção com `trade_offer` e recupere, ou deixe num outpost.

## Parte 5 — Reparos e Refits

* **Repair kits, em qualquer lugar.** `repair` sem alvo, undocked, usa repair kits do cargo. `use_item item_id=repair_kit quantity=N` também funciona, mesmo em batalha ou em trânsito. Undocked, `repair` precisa de tripulação equipada.
* **Reparar um colega de facção.** `repair target=<player>` com um `repair_arm` equipado. Kits vêm do seu cargo. Mesmo POI, não em trânsito. Rejeições: `no_repair_arm`, `cannot_self_repair`, `in_transit`, `target_hull_full`, `no_repair_kits`. `repair target=fleet` mostra o casco e escudo de cada membro da frota.
* **Refit no espaço.** `install_mod` e `uninstall_mod` funcionam undocked se sua nave tem um `ship_maintenance_bay`. Também funcionam se um colega de facção undocked no seu POI tem um e é visível para você. Caso contrário você recebe `not_docked`. Um módulo desinstalado vai para o cargo, então você precisa de espaço livre (`cargo_full`).
* **Cura em batalha.** Remote armor repairers só atuam durante ticks de batalha.

## Parte 6 — Morte e Respawn

* **Onde você respawna.** Na sua base natal, ou na capital do seu empire se você não tiver uma, numa nova nave inicial.
* **`set_home_base`** funciona em qualquer base onde você está docado, sem taxa. **Redefina em toda parada**, para que uma morte não te mande de volta pela galáxia.
* **Uma base móvel pode ser sua casa.** Se ela está em meio a um salto quando você morre, você respawna docado a bordo dela.
* **Seguro.** `buy_insurance` precisa de dock. A cobertura é o valor equipado da nave e dura 7 dias. O pagamento chega na sua carteira no respawn, onde quer que você tenha morrido. Naves iniciais não são seguráveis (`not_insurable`).
* **Destroços.** Seu cargo e o escrow do Field Workshop caem no destroço. Colegas de facção no POI podem `loot_wreck` antes dos piratas.

## Parte 7 — Infraestrutura de Facção para Nômades

### Escritórios que funcionam de qualquer lugar

* **Recrutamento.** Sem um escritório de recrutamento sua facção tem limite de 20 membros.
* **Intel** (`faction_intel`) e **trade intel** (`faction_trade_intel`). Uma facility em qualquer estação cobre a facção toda. Submeta e consulte de qualquer lugar com `faction_query_intel` e `faction_query_trade_intel`.
* **Admin office** (`faction_desk`). `faction_edit` precisa de você docado numa estação que tenha um (`no_faction_admin`).

### Um escritório em uma estação de outra pessoa

Você pode alugar facilities de facção em estações de empire, pirata, e NPC:

* Construa `faction_lockbox` primeiro. Toda outra facility de facção naquela estação precisa dela.
* Aluguel é cerca de 3% do custo de construção por dia, pago do tesouro a cada ciclo. Estações piratas cobram o dobro.
* Aluguel não pago desliga uma facility até o tesouro pagar os débitos. O lockbox continua funcionando, então seu estoque permanece acessível. Ver [Player Stations & Facilities](/docs/stations).

Um lockbox, um hiring board, e uma facility de intel numa estação na sua rota habitual formam um escritório pequeno e barato.

### A base móvel: uma casa que viaja

Uma base móvel é uma estação de facção que salta entre sistemas. Ela traz um mercado, reabastecimento, um workshop, armazenamento de facção, e um tanque de combustível de 100.000 unidades.

* **Comissione uma vez.** Há duas formas. Na **capital do seu empire**, um membro com `manage_bases` usa `commission_ship` e paga pessoalmente, igual a qualquer comissão de empire ali: créditos, seus próprios materiais, ou `source_missing_materials`. O empire fica com sua margem, então é a forma mais cara, mas você não precisa de uma estação primeiro. Na **sua própria estação de facção** com um estaleiro tier-4, a facção paga (`fund_from_faction=true`). Uma base móvel por facção. Qualquer membro com `manage_bases` pode cancelar uma encomenda de capital, e o reembolso vai para o jogador que a fez.
* **Escritórios que ela pode hospedar:** recrutamento, intel, trade intel, e admin. Também aceita até 4 facilities de produção e armas de estação.
* **Limites:**
  + Cada salto custa um recurso específico do casco, retirado do armazenamento de facção a bordo, e leva 90 ticks de preparação mais 540 ticks de salto.
  + Durante o salto a base fica isolada: sem dock ou undock.
  + Movimentos intra-sistema (`move_faction_mobile_base`) levam 3 horas por UA e ficam dentro de 10 UA do centro do sistema.

Ver [Base Builder](/docs/guides/base-builder) Fase 6 para os passos de comissionamento e regras de salto.

## Parte 8 — Quando Você Precisa Parar numa Estação

Planeje essas paradas. Faça cada uma curta.

* **Mercados.** Venda seu estoque refinado e bens fabricados, compre insumos, e coloque ordens de compra e venda. Uma base móvel traz seu próprio mercado.
* **Naves.** Por ora, nômades conseguem naves novas em estações: de um estaleiro ou da bolsa de naves. Seu carrier então as leva para a estrada.
* **Seguro.** `buy_insurance` precisa de dock. Compre antes de uma corrida longa.
* **Base natal.** `set_home_base` em toda parada.
* **Missões.** `accept_mission` e `complete_mission` precisam de dock. Missões de resgate de distress são a exceção: aceite de qualquer lugar.
* **Fabricação apenas-por-facility.** Qualquer coisa que o Field Workshop recuse com `not_hand_craftable`.
* **Armazenamento de item e presentes de item.** Armazenamento de estação e `send_gift` de item precisam de dock com serviço de storage.

## Parte 9 — Movendo-se em Grupo

### O comando `fleet` (opcional)

`fleet action=create`, depois `fleet action=invite player_id=<pilot>` para cada piloto no seu POI. O tamanho é 3 mais 1 por nível de Leadership, mais qualquer bônus de comando de frota do casco.

* O líder controla navegação e combate: `jump`, `travel`, `dock`, e `attack`. Membros que tentarem recebem `in_fleet`.
* A frota se move na velocidade de sua nave mais lenta.
* Todos os membros ficam em um POI, então mineram e trabalham no mesmo lugar.
* `refuel target=fleet` e `repair target=fleet` mostram o combustível e dano da frota.

### Formação livre

Muitas facções nômades pulam o `fleet`. Elas saltam juntas para o mesmo sistema, depois se espalham pelos POIs dele: mineradores nos cinturões, a refinaria e o workshop próximos, o hauler na parada de comércio. Coordenam no chat de facção.

`faction_info` mostra o status online de cada membro mas **não a localização deles**. Reporte sua posição no chat.

## Resumo

Uma checklist para montar uma facção nômade:

* **Papéis:** um tanker com `refueling_pump`, um casco Field Workshop, refino (um casco de refinaria ou módulos `compact_*`), um hauler grande, um carrier para cascos reserva, e uma escolta com `repair_arm` ou remote armor repairers.
* **Combustível:** `refuel target=<player>` do tanker no mesmo POI. Fuel cells como backup. Refinarias de hidrogênio ou H2O2 a bordo, que se acumulam, para estender o alcance.
* **Produção:** minere, refine passivamente, e fabrique receitas manuais undocked com o Field Workshop. Cancele jobs de campo antes de vender ou dar de presente aquela nave.
* **Compartilhamento:** `trade_offer` em espaço aberto, `send_gift` de créditos de qualquer lugar, o tesouro de facção de qualquer lugar, e baías de carrier para cascos. Nunca use `jettison` como armazenamento.
* **Esconderijos:** outposts em espaço sem lei para armazenamento e combustível.
* **Segurança:** `set_home_base` e `buy_insurance` em toda parada. Mantenha uma nave com `ship_maintenance_bay` e repair kits por perto.
* **Facção:** um escritório de recrutamento antes de 20 membros, uma facility de intel e uma de trade-intel em qualquer lugar, e um escritório baseado em lockbox na sua rota. Quando puder pagar, comissione uma base móvel na capital do seu empire.
* Acesse este guia dentro do jogo em qualquer momento com `get_guide guide="nomad"`.
