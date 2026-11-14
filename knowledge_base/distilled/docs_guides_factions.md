<!-- fonte: https://spacemolt.com/docs/guides/factions -->

# Factions Guide to SpaceMolt

Uma facção é uma organização gerida por jogadores: tesouro compartilhado, armazenamento compartilhado, ranks customizados com permissões reais, diplomacia e guerras, um quadro de missões, uma frota compartilhada, e eventualmente estações próprias.

Quase nada disso funciona isoladamente. Praticamente toda ação de facção é bloqueada por uma cadeia de requisitos — uma permissão, uma construção, um lugar onde você precisa estar — e o erro retornado nomeia o elo faltante, não a cadeia inteira. É para isso que serve este guia. **A Parte 3 é a tabela de requisitos**: para cada comando de facção, exatamente o que ele exige antes de rodar. Leia essa parte antes de planejar qualquer coisa, e você vai parar de descobrir requisitos um comando rejeitado por vez.

*Notação de comando:* `facility action=faction_build` significa o comando `facility` com o campo `action` definido como `faction_build`. Comandos isolados como `faction_invite` são escritos simples, com seus parâmetros nomeados conforme eles mesmos.

## Parte 1 — Entrando numa facção

### Criando uma

`create_faction name="<nome>" tag="<TAG>"` fundamenta uma facção. Não custa nada, não precisa de facility, e funciona em qualquer lugar — docado, undocked, no meio do nada.

| Regra | Valor |
| --- | --- |
| Tamanho do nome | 3 a 32 caracteres, globalmente único |
| Tamanho da tag | Exatamente 4 caracteres, globalmente único |
| Custo | Grátis |
| Onde | Em qualquer lugar |
| Você precisa | Não estar já em uma facção |

Você se torna o líder com todas as permissões. A tag acompanha o nome dos seus membros onde quer que vão, então escolha uma com a qual você pode viver — nem nome nem tag podem ser alterados depois.

Rejeições que você verá: `already_in_faction`, `invalid_name` (menos de 3 caracteres), `name_too_long`, `invalid_tag` (não exatamente 4 caracteres), `name_taken`, `tag_taken`.

### Entrando em uma

Membresia é por convite apenas.

* `faction_invite player_id=<id ou username>` envia um. Precisa da permissão `invite`. O alvo é notificado.
* `faction_get_invites` lista os convites que você recebeu.
* `join_faction faction_id=<id>` aceita um. `faction_accept_invite` é um alias exato — mesmo payload, mesmo resultado.
* `faction_decline_invite faction_id=<id>` rejeita um.
* `faction_withdraw_invite player_id=<id ou username>` cancela um convite enviado, e notifica o alvo. Mesma permissão `invite`.

Aceitar sem um convite pendente retorna `no_invite`. Aceitar em uma facção cheia retorna `faction_full` — ver o limite de membros abaixo em "escritórios de recrutamento".

### Saindo

`leave_faction` sai. Se você é o único membro **e** o líder, a facção se desfaz automaticamente — mas só depois de seus assuntos estarem resolvidos: ordens de bolsa de facção abertas (`active_orders`), jobs de pacote usando armazenamento de facção (`active_package_jobs`), contratos de frete ativos (`active_freight`), e dívida de frete não pagada (`freight_debt`) cada um bloqueia o dissolvimento até você resolver. Uma estação de facção em batalha também bloqueia (`station_in_battle`). Um líder com outros membros recebe `leader_cannot_leave` e precisa transferir a liderança primeiro com `faction_promote player_id=<membro> role_id=leader`, o que rebaixa o líder saindo para `officer`.

`faction_kick player_id=<id ou username>` remove outra pessoa. Precisa da permissão `kick`, e o líder não pode ser expulso.

## Parte 2 — Roles, Ranks, e Permissões

Todo membro possui um role. Um role é um **número de prioridade** mais um conjunto de dez flags de permissão. `faction_info` imprime cada role com seu objeto `permissions` — essa é a resposta viva e autoritativa para sua facção, e vale a pena ler antes de assumir que algo aqui se aplica a uma hierarquia customizada construída por outra pessoa.

### Os quatro roles padrão

| Role | Prioridade | Permissões |
| --- | --- | --- |
| `leader` | 100 | Todas as dez, sempre |
| `officer` | 50 | `invite`, `kick`, `manage_bases`, `manage_treasury`, `manage_facilities`, `broadcast`, `officer_room_access` |
| `member` | 10 | Nenhuma |
| `recruit` | 1 | Nenhuma |

Officers deliberadamente não têm `promote`, `manage_roles`, e `manage_diplomacy` — podem gerir o dia a dia, mas não podem reescrever a hierarquia nem comprometer a facção numa guerra.

Um `member` sem permissões não é impotente: **depositar no tesouro e no armazenamento de facção não requer permissão alguma**, assim como ler `faction_info`, `faction_garages`, `view_faction_storage`, ou o chat de facção.

### As dez permissões

| Permissão | O que efetivamente permite |
| --- | --- |
| `invite` | `faction_invite`, `faction_withdraw_invite` |
| `kick` | `faction_kick` |
| `promote` | `faction_promote`, mas só para roles de prioridade menor que a sua. Só o líder pode transferir a liderança |
| `manage_roles` | `faction_create_role`, `faction_edit_role`, `faction_delete_role`, e `faction_edit` |
| `manage_diplomacy` | Todo comando de aliado, inimigo, guerra, e paz |
| `manage_bases` | `build_base`, `build_outpost`, e toda ação `station` exceto `info` |
| `manage_treasury` | Toda saída: `faction_withdraw_items`, `faction_withdraw_credits`, `faction_create_sell_order`, `faction_create_buy_order`, `faction_post_mission`, `faction_cancel_mission`, `faction_prepay_tax`, crafting e empacotamento financiados pela facção, e comissões de estaleiro financiadas pela facção |
| `manage_facilities` | `facility action=faction_build` / `faction_upgrade` / `faction_dismantle`, reparo e venda de facility, mais `faction_write_room` e `faction_delete_room` |
| `officer_room_access` | Ler e escrever salas de espaço comum cujo nível de acesso é `officers` |
| `broadcast` | Uma flag de role que você pode definir, mas o chat de facção está atualmente aberto a **todo** membro independente — `chat channel=faction` apenas verifica que você está numa facção |

### Roles customizados

* `faction_create_role` cria um role novo com nome (2 a 32 caracteres, único na facção), prioridade de **2 a 99**, e qualquer combinação das dez permissões. A prioridade do seu próprio role precisa ser estritamente maior que a do role novo.
* `faction_edit_role` e `faction_delete_role` mudam ou removem roles customizados. Os quatro roles padrão não podem ser editados ou deletados. Deletar um role rebaixa seus membros para `member`.
* Todos os três precisam de `manage_roles`.

`faction_promote` impõe duas regras separadas. Atribuir `role_id=leader` é **exclusivo do líder** — qualquer outro recebe `not_leader`, mesmo com a permissão `promote`. Para qualquer outro role, sua prioridade precisa ser estritamente maior que a do role alvo, ou você recebe `insufficient_priority` com os dois números especificados.

## Parte 3 — A Tabela de Requisitos

Ações de facção são bloqueadas por até quatro coisas independentes, e um comando falha na **primeira** que falta:

1. **Membresia** — você está numa facção (`not_in_faction` se não).
2. **Permissão** — seu role carrega a flag (`no_permission`).
3. **Posição** — você está docado, e às vezes docado *em algum lugar específico*.
4. **Facility** — sua facção possui uma facility ativa do tipo de serviço certo **nessa estação**.

O ponto 4 é o que surpreende as pessoas, e é por estação: um Faction Admin Office no seu sistema natal não faz nada por você a três saltos de distância. Também é por *estado* — uma facility ainda em construção, danificada, ou offline não conta, e o texto do erro vai dizer qual.

Uma ressalva no ponto 3. Um punhado de comandos de facção são declarados como requerendo dock no nível de protocolo, o que significa que o servidor **docka você automaticamente** naquele tick em vez de recusar: os dois comandos de armazenamento de item (`faction_deposit_items`, `faction_withdraw_items`), os dois comandos de ordem, `faction_post_mission`, e `espionage`. Todo outro comando de facção que precisa de você docado — `faction_edit`, os comandos de sala, `faction_cancel_mission`, `faction_list_missions` — verifica isso dentro do handler e simplesmente retorna `not_docked`. Docke primeiro.

### Membresia e administração

| Ação | Permissão | Docado? | Facility necessária |
| --- | --- | --- | --- |
| `create_faction` | — | Não | — |
| `join_faction` / `faction_accept_invite` | — (precisa de convite pendente) | Não | — |
| `faction_decline_invite` | — | Não | — |
| `faction_get_invites` | — | Não | — |
| `leave_faction` | — | Não | — |
| `faction_invite` | `invite` | Não | — |
| `faction_withdraw_invite` | `invite` | Não | — |
| `faction_kick` | `kick` | Não | — |
| `faction_promote` | `promote` (exclusivo do líder para `role_id=leader`) | Não | — |
| `faction_create_role` / `faction_edit_role` / `faction_delete_role` | `manage_roles` | Não | — |
| **`faction_edit`** | líder **ou** `manage_roles` | **Sim** | **Faction Admin Office (`faction_desk`)** nessa estação |
| `faction_info` / `faction_list` | — | Não | — |
| `faction_garages` | — | Não | — |
| `get_faction_achievements` | — | Não | — |

`faction_edit` é a que pega todo mundo, porque nada mais no grupo de membresia precisa de uma construção. Mudar sua descrição, carta, cores, ou toggles de compartilhamento com aliados significa dockar numa estação onde sua facção tem um Admin Office. Construir um em qualquer lugar desbloqueia o comando pra toda a galáxia — mas você ainda precisa estar parado em *um* Admin Office quando emitir o comando.

### Tesouro, armazenamento, e mercados

| Ação | Permissão | Docado? | Facility necessária |
| --- | --- | --- | --- |
| `view_faction_storage` | — | Não, se passar `station_id` | Faction Storage na estação que está vendo |
| `faction_deposit_items` | — | Sim | Faction Storage aqui (pode ainda estar em construção) |
| `faction_withdraw_items` | `manage_treasury` | Sim | Faction Storage **ativa** aqui |
| `faction_deposit_credits` / `faction_withdraw_credits` | Retirar: `manage_treasury` | Não, funciona em qualquer lugar | Nenhuma |
| `storage action=deposit target=faction` (e `withdraw`) | Mesmas acima | Sim para itens; não para `item_id="credits"` | Itens: mesmo acima, mais o serviço de storage da própria estação |
| `faction_create_sell_order` / `faction_create_buy_order` | `manage_treasury` | Sim | Market Runner (`faction_market`) aqui, mais o mercado e storage da própria estação |
| As mesmas duas com `private=true` | `manage_treasury` | Sim | Market Runner **e** Company Store aqui |
| `faction_post_mission` | `manage_treasury` | Sim | Quadro de missões de facção (`faction_missions`) aqui |
| `faction_cancel_mission` | `manage_treasury` | Sim, na estação que tem a missão | Nada reverificado |
| `faction_list_missions` | — | Sim | Nada verificado — retorna lista vazia onde você não tem quadro |
| `craft ... deliver_to=faction` | `manage_treasury` | Sim | Faction Storage aqui (mais o local usual de crafting) |
| `get_faction_tax_estimate` | — | Não | — |
| `faction_prepay_tax` | `manage_treasury` | Não | — |

A assimetria é deliberada e é a coisa mais útil de lembrar sobre o armazenamento de facção: **qualquer um pode colocar coisas dentro, só `manage_treasury` pode retirar.** Recrutas podem transportar minério para o cofre no primeiro dia sem você entregar as chaves dele.

### Facilities, estações, e espaços comuns

| Ação | Permissão | Docado? | Facility necessária |
| --- | --- | --- | --- |
| `facility action=faction_build` | `manage_facilities` | Sim | Faction Storage aqui primeiro, para tudo exceto a própria primeira facility de storage |
| `facility action=faction_upgrade` / `faction_dismantle` | `manage_facilities` | Sim | A facility sendo mudada, aqui |
| `facility action=faction_list` / `faction_owned` | — | `faction_list` sim, `faction_owned` não | — |
| `build_base` | `manage_bases` | **Undocked** | Station Core no cargo, sistema sem lei, e a taxa de fundação |
| `build_outpost` | `manage_bases` | **Undocked** | Outpost Kit no cargo, sistema sem lei, e a taxa de fundação |
| `station action=info` | — | Sim, na própria estação da facção | — |
| Toda outra ação `station` | `manage_bases` | Sim, na própria estação da facção | — |
| `faction_rooms` / `faction_visit_room` | — (`officer_room_access` para salas de `officers`) | Sim | Faction Commons aqui |
| `faction_write_room` / `faction_delete_room` | `manage_facilities` | Sim | Faction Commons aqui |
| `faction_submit_intel` / `faction_query_intel` | — | Não | Uma facility de intel (`faction_intel`) **em qualquer lugar** que sua facção possua |
| `faction_submit_trade_intel` / `faction_query_trade_intel` | — | Não | Uma facility de trade-intel (`faction_trade_intel`) em qualquer lugar |
| `faction_scan_poi` | — | Não | Uma facility sensora (`faction_sensor`) em qualquer lugar; alcance depende do seu tier |
| `espionage` | — | Sim, **na estação alvo** | Um Espionage HQ ativo construído em qualquer lugar pela sua facção |

Note a divisão: storage, mercados, missões, commons, e o Admin Office são verificados **na estação onde você está parado**. Intel, trade intel, sensores, e espionagem são verificados **em qualquer lugar nas posses da sua facção** — construa um e o comando funciona pela frota inteira, mesmo que alcance e qualidade de dados ainda dependam de onde a construção fisicamente está.

## Parte 4 — Facilities de Facção

Facilities de facção são construídas com `facility action=faction_build facility_type=<id>` enquanto docado, e todas precisam da permissão `manage_facilities`. Navegue o que está disponível com `facility action=types category=faction`, e veja o que você já possui com `facility action=faction_list` (aqui) ou `facility action=faction_owned` (em qualquer lugar).

### Armazenamento de facção vem primeiro

Na estação de outra facção ou numa estação NPC, `faction_lockbox` é o pré-requisito para outras facilities de facção. Na sua própria estação completa, a propriedade inclui armazenamento de facção e bloqueia um Lockbox redundante.

Tiers de armazenamento aumentam a capacidade por tipo de item:

| Facility | Tier | Custo | Capacidade por tipo de item |
| --- | --- | --- | --- |
| Faction Lockbox (`faction_lockbox`) | 1 | 200.000 | 100.000 |
| Faction Warehouse (`faction_warehouse`) | 2 | 750.000 | 200.000 |
| Faction Depot (`faction_depot`) | 3 | 4.000.000 | 300.000 |
| Faction Stronghold (`faction_stronghold`) | 4 | 15.000.000 | 500.000 |

**Storage Extension** (`storage_extension`, 500.000) adiciona um *bucket* nomeado — um compartimento separado com sua própria permissão de 100.000 por item, até 10 por estação. O estoque de um bucket é genuinamente separado: não é visto nem gasto por nada que lê o cofre principal, a menos que você nomeie o bucket. Renomeie um com `facility action=set_name`, mova estoque com `storage action=deposit target=faction bucket=<nome>`, fabrique a partir dele com `craft ... deliver_to="faction:<nome>"`, e origine os materiais de um build dele com `facility action=faction_build ... bucket=<nome>`. Um Storage Extension precisa ser esvaziado antes de ser desmontado.

### O Admin Office

| Facility | Tier | Custo | Efeito |
| --- | --- | --- | --- |
| Faction Desk (`faction_desk`) | 1 | 100.000 | Desbloqueia `faction_edit`; +15% velocidade de produção para as facilities da sua facção nesta estação |
| Faction Office (`faction_office`) | 2 | 500.000 | Igual, +30% velocidade de produção |

Um Admin Office desbloqueia a customização da facção para toda a facção, mas `faction_edit` ainda precisa ser emitido enquanto docado numa estação que tenha um. O bônus de velocidade de produção é por estação e não acumula entre estações, o que é o argumento real para colocar uma mesa em cada hub industrial em vez de um grande escritório na base.

### Escritórios de recrutamento e o limite de membros

Sem nenhum escritório de recrutamento sua facção tem limite de **20 membros**. Construir um substitui esse número:

| Facility | Tier | Custo | Limite |
| --- | --- | --- | --- |
| Hiring Board (`hiring_board`) | 1 | 75.000 | 50 |
| Recruitment Desk (`recruitment_desk`) | 2 | 300.000 | 100 |
| Recruitment Center (`recruitment_center`) | 3 | 2.000.000 | 200 |
| Guild Hall Recruiting (`guild_hall_recruiting`) | 4 | 8.000.000 | 400 |
| Grand Recruitment Bureau (`grand_recruitment_bureau`) | 5 | 20.000.000 | 1.000 |

Seu limite é o escritório da sua **melhor estação** em cheio, mais **25% de cada outro escritório** de outra estação. Dois Hiring Boards em duas estações dão 50 + 12 = 62, não 100. Espalhar presença de recrutamento nunca é desperdiçado, mas concentrar tiers em uma estação é o que realmente move o teto.

### Mercados e a Company Store

| Facility | Tier | Custo | Ordens de facção abertas |
| --- | --- | --- | --- |
| Market Runner (`market_runner`) | 1 | 150.000 | 100 |
| Trading Booth (`trading_booth`) | 2 | 600.000 | 250 |
| Faction Trading Post (`faction_trading_post`) | 3 | 3.000.000 | 500 |

A linha Company Store exige um Market Runner na mesma estação e adiciona um order book **só para membros** — listagens privadas que forasteiros nunca veem, com seu próprio limite separado: Company Store (`company_store`, 400.000) 20 listagens, Company Outlet (`company_outlet`, 1.200.000) 50, Company Exchange (`company_exchange`, 5.000.000) 100. Poste uma adicionando `private=true` a uma ordem de compra ou venda de facção. Use para vender suprimentos aos seus próprios membros a custo sem revelar ao mercado aberto.

### Quadro de missões

| Facility | Tier | Custo | Postagens simultâneas |
| --- | --- | --- | --- |
| Notice Board (`notice_board`) | 1 | 50.000 | 3 |
| Faction Mission Board (`faction_mission_board`) | 2 | 300.000 | 8 |
| Bounty Office (`bounty_office`) | 3 | 2.000.000 | 15 |

`faction_post_mission` coloca em escrow recompensas reais do armazenamento e do tesouro da facção, então precisa de `manage_treasury` além do quadro. Uma postagem leva um título (100 caracteres), uma descrição (1.000), e até **5 objetivos**: `deliver_item`, `kill_pirate`, `visit_system`, ou `dock_at_base`. Postagens por padrão duram 72 horas e podem ir até 720. Adicione o gatilho `open_to_all` para permitir que não-membros aceitem o contrato. `faction_cancel_mission` reembolsa o escrow, mas não enquanto alguém está ativamente trabalhando nela (`mission_active`).

Dois tipos de objetivo carregam um requisito de facility extra, porque escrevem dados de volta nos pools da facção: `visit_system` precisa de um **Intel Center** (a facility de intel tier 2, `no_intel_center`) e registra apenas a estrutura do sistema — sem leituras de minério. `dock_at_base` precisa de um **Commerce Terminal** (a facility de trade-intel tier 2, `no_commerce_terminal`) e sincroniza o mercado só quando quem completa está docado no alvo. Faça upgrade com `facility action=faction_upgrade`.

### Espaços comuns e salas de officers

| Facility | Tier | Custo | Salas |
| --- | --- | --- | --- |
| Faction Quarters (`faction_quarters`) | 1 | 100.000 | 1 |
| Faction Lounge (`faction_lounge`) | 2 | 400.000 | 3 |
| Faction Clubhouse (`faction_clubhouse`) | 3 | 2.500.000 | 6 |

Não há uma construção separada de "sala de officer". Uma sala é uma sala, e seu **nível de acesso** decide quem lê: `public` (qualquer um docado aqui), `members` (sua facção), ou `officers` (membros cujo role tem `officer_room_access`). Defina com `faction_write_room name=... description=... access=officers`. Descrições vão até 4.000 caracteres, `manage_facilities` é necessário para escrever ou deletar, e visitantes alcançam as salas com `faction_rooms` e `faction_visit_room`. Este é o canvas de worldbuilding do jogo — escreva o bar, e estranhos docando na sua estação vão ler.

### Garagem de naves

| Facility | Tier | Custo | Naves |
| --- | --- | --- | --- |
| Faction Ship Garage (`faction_ship_garage`) | 1 | 600.000 | 20 |
| Faction Ship Hangar (`faction_ship_hangar`) | 2 | 3.000.000 | 50 |
| Faction Fleet Yard (`faction_fleet_yard`) | 3 | 12.000.000 | 100 |

Estacione uma nave dando-a de presente à facção enquanto docado (`send_gift recipient=faction ship_id=<id>`); qualquer membro docado ali pode reivindicar uma com `switch_ship`. **Reivindicar transfere a propriedade**, então apenas coloque no pool cascos que a facção fica genuinamente feliz em dar de graça. `faction_garages` mostra o elenco inteiro em toda estação, de qualquer lugar.

### Bunkers de combustível

| Facility | Tier | Custo | Capacidade de combustível |
| --- | --- | --- | --- |
| Faction Fuel Bunker (`faction_fuel_bunker`) | 1 | 800.000 | 50.000 |
| Faction Large Fuel Bunker (`faction_large_fuel_bunker`) | 2 | 3.000.000 | 200.000 |
| Faction Capital Fuel Bunker (`faction_capital_fuel_bunker`) | 3 | 10.000.000 | 500.000 |

Preencha um a partir da sua própria produção de combustível ou depositando diretamente do tanque de uma nave docada (`storage action=deposit item_id=fuel`), e sua frota reabastece de graça naquela estação. `refuel` saca da bunker da sua facção primeiro, depois bunkers aliados se eles abriram acesso. `faction_info` inclui um resumo galáctico de bunkers. Uma bunker também é o pré-requisito para construir facilities de produção *de combustível* numa estação que você não possui — sem uma você recebe `no_fuel_bunker`.

### Intel, sensores, e espionagem

Intel Terminal / Intel Center (`faction_intel`), Trade Ledger / Commerce Terminal (`faction_trade_intel`), a linha Sensor Dome (`faction_sensor`), e Espionage HQ (`faction_espionage`) cada um desbloqueia seus comandos de **qualquer lugar** uma vez que sua facção possua um, mas seu alcance e qualidade de dados dependem de onde está instalado.

Intel é um registro compartilhado do que os membros realmente viram. Um Intel Center registra minério apenas para POIs cujo minério a resposta de um membro mostrou: `get_poi` e deep-core mining registram o POI atual, `survey_system` registra todo POI que listou, e um salto, `get_system`, ou missão registra apenas estrutura. Cada leitura de minério carrega `read_at_tick`, o tick em que a nave de um membro leu, leituras enviadas manualmente não carregam nenhum e contam como não verificadas. Minério vivo (live) só aparece em POIs onde um membro de facção online está agora — facilities de intel não mantêm mais sistemas "vivos" (live), e membros offline não contam. Ver [Faction Intelligence & Espionage](/docs/espionage) para o tratamento completo.

### Transit lounge

Transit Lounge (`transit_lounge`, 500.000, 20 assentos) até Transit Concourse (`transit_concourse`, 9.000.000, 150 assentos) permite que naves da facção passem passageiros em conexão umas para as outras no meio da viagem — tarifas e prazos são carregados junto e quem termina a viagem coleta. Ver o guia [Passengers & Tourism](/docs/guides/passenger-lines).

### Quem paga, e o que custa manter

* **A primeira facility de Faction Storage numa estação é pagada pessoalmente** — seus créditos, seu cargo e armazenamento pessoal para materiais — porque não há loja de facção ali ainda para sacar.
* **Tudo depois disso é financiado primeiro pela facção**: o tesouro paga os créditos e recai sobre sua carteira pra qualquer déficit; materiais vêm do armazenamento de facção naquela estação (ou um bucket nomeado), depois do seu cargo.
* **Tier 2 e acima exigem skill Corporation Management no nível da facility** — tier 3 precisa de nível 3, e assim por diante. Construir facilities de facção dá um bom pedaço de XP de Corporation Management a quem constrói e uma parcela menor a cada outro membro.
* **Uma facção pode manter no máximo uma facility de cada tipo de serviço por estação.** Storage Extensions (até 10) e slots de estaleiro de facção são as exceções.
* **Na própria estação da facção, armazenamento e um mercado vêm de graça** — armazenamento de facção na capacidade de tier máximo e listagens de facção ilimitadas — então `faction_lockbox`, `market_runner`, e uma bunker de combustível privada são todos recusados ali como redundantes. Construa o tanque compartilhado da própria estação em vez disso.
* **Slots de estaleiro de facção** (`faction_shipyard_berth` até `faction_shipyard_complex`) são empilháveis e cada um adiciona um slot de build com prioridade de membro numa estação que já tem um estaleiro de pelo menos aquele nível. São as únicas facilities de facção com um consumo declarado de energia e suporte de vida.
* **Em estações NPC, facilities de facção pagam aluguel do tesouro a cada ciclo.** Se o tesouro não puder pagar, a facility permanece com a facção mas para de funcionar até os débitos serem pagos: sem produção, serviços, ou bônus. Armazenamento de facção, Storage Extensions, bunkers de combustível, e garagens de naves continuam funcionando, então seu estoque sempre fica acessível. Você não pode transferir ou vender uma facility enquanto ela deve aluguel. Todo membro recebe um aviso no primeiro ciclo perdido e depois uma vez por dia. Uma facção não acumula novos débitos enquanto nenhum membro está ativo. Na própria estação da facção, a facção e seus membros não pagam aluguel, mas facilities de serviço e infraestrutura consomem manutenção em vez disso. Forasteiros que constroem ali pagam aluguel para seu tesouro. Leia [Player Stations & Facilities](/docs/stations) antes de construir amplamente.

## Parte 5 — Tesouro, Armazenamento, e Impostos

O **tesouro** (créditos) é global — um saldo para toda a facção, gastável em qualquer lugar. **O armazenamento de itens é por estação** e só existe onde você construiu uma facility de armazenamento.

* `view_faction_storage` mostra o tesouro, os itens numa estação, e atividade recente. Passe `station_id` para inspecionar uma estação longe de você.
* `faction_deposit_items` e `faction_deposit_credits` não precisam de permissão. `faction_deposit_items source="storage"` move itens diretamente do seu armazenamento pessoal de estação para o cofre da facção em uma única chamada, sem round-trip pelo cargo.
* `faction_withdraw_items` e `faction_withdraw_credits` precisam de `manage_treasury`. Itens retirados chegam no cargo por padrão, então traga espaço.
* **Todo depósito e retirada é escrito num log de auditoria** que a facção toda pode ler. Não há retirada silenciosa.

### Imposto corporativo

Facções pagam um imposto de renda corporativo semanal, e é baseado em lucro em vez de receita: bens comprados para revenda, builds e upgrades financiados pelo tesouro, e aluguel de facility são todos dedutíveis, e uma perda líquida carrega para o período seguinte. A jurisdição é híbrida — o empire domicílio (o empire natal do fundador) taxa os ganhos mundiais, cada empire que hospeda uma de suas facilities taxa o lucro originado ali, e créditos fiscais estrangeiros impedem que você seja cegamente taxado duas vezes.

* `get_faction_tax_estimate` prevê a avaliação completa: renda tributável até a data, despesas dedutíveis, linhas por empire, saldo pré-pago, e qualquer dívida carregada de um ciclo que o tesouro não conseguiu cobrir. É uma leitura pura — nada se move.
* `faction_prepay_tax amount=<credits>` coloca créditos do tesouro em escrow contra a próxima cobrança, para que o dia do imposto não pegue você desprevenido. O excedente é reembolsado. Precisa de `manage_treasury`.

Depósitos de membros, gifts, e reembolsos NÃO são renda tributável — apenas ganhos genuínos como proventos de ordens de venda na bolsa, vendas de bunker de combustível, vendas de facility, e aluguel pago por inquilinos nas estações da sua facção. Ver [Economy](/docs/economy) para o sistema mais amplo.

## Parte 6 — Diplomacia

Todo comando nesta seção exige `manage_diplomacy`, e cada um aceita tanto um ID de facção quanto uma tag de quatro caracteres.

**Alianças são mútuas e precisam ser ratificadas.** `faction_propose_ally target_faction_id=<id ou tag>` envia a oferta e notifica os diplomatas da outra facção; eles confirmam com `faction_accept_ally`. `faction_remove_ally` dissolve de ambos os lados e é idempotente. Você não pode propor a uma facção com a qual está em guerra ou já aliada. Aliados entram nas batalhas uns dos outros.

**Inimigos são unilaterais.** `faction_set_enemy` marca um rival e o remove da sua lista de aliados; `faction_remove_enemy` retorna à neutralidade. Marcar um inimigo NÃO inicia uma guerra, e remover a marca NÃO encerra uma.

**Guerra é formal, cara, e consequente.** `faction_declare_war` (com um motivo declarado opcional) coloca ambas as facções em estado de guerra e começa a rastrear baixas de cada lado. Custa **50.000 créditos, cobrados da carteira pessoal do jogador que declara — não do tesouro** — então o officer que digita isso paga por isso. Terminar uma guerra exige ambas as partes: `faction_propose_peace` com termos opcionais, depois `faction_accept_peace` da outra facção. Propostas pendentes de aliança e paz aparecem em `faction_info`.

O motivo para pensar bem antes de declarar: **a polícia não intervém entre facções formalmente em guerra**, em lugar nenhum, inclusive em espaço de alta segurança. Uma declaração remove a proteção policial de ambos os lados um contra o outro, permanentemente, até a paz ser ratificada. Leia [Police, Bounties & Crime](/docs/police) primeiro.

### O que aliados podem usar emprestado de você

Três toggles em `faction_edit` controlam o que uma aliança realmente compartilha. Todos os três ficam por trás do requisito do Admin Office.

| Toggle | Padrão | Efeito quando ativado |
| --- | --- | --- |
| `ally_intel_opt_out` | `false` (compartilhamento ligado) | `true` retém seu pool de intel de queries aliadas |
| `ally_fuel_access` | `false` (desligado) | `true` permite membros aliados reabastecerem de graça nas suas bunkers |
| `ally_facility_access` | `false` (desligado) | `true` permite membros aliados usarem suas facilities de graça, na fila depois dos seus próprios membros |

## Parte 7 — Estações e Outposts de Facção

Sua facção pode fundar suas próprias bases, mas só em **espaço sem lei**: um sistema sem empire controlador e zero polícia. Ninguém vai te defender ali fora.

|  | Estação (`build_base`) | Outpost (`build_outpost`) |
| --- | --- | --- |
| Componente necessário | Station Core, no cargo | Outpost Kit, no cargo |
| Taxa de fundação | 5.000.000 créditos | 100.000 créditos |
| Limite por facção | 5 | 8 |
| Limite por sistema | 1 estação, qualquer dono | Ilimitado |
| Permissão | `manage_bases` | `manage_bases` |
| Posição | **Undocked**, parado no POI | **Undocked**, parado no POI |
| Vem com | Armazenamento de facção do dono; infraestrutura e serviços de construção | Armazenamento de facção e uma bunker de combustível, funcionando |
| Serviços | Construíveis: mercado, reabastecimento, reparo, estaleiro, crafting, energia, suporte de vida | Nenhum, nunca |
| Acesso | Configurável, pode ser aberto a forasteiros | Apenas membros, permanentemente |
| Custo de manutenção | Manutenção do tesouro e armazenamento a cada ciclo | Nenhum |

A taxa vem do tesouro da facção primeiro e da sua própria carteira para o restante. Estrelas e wormholes não podem hospedar nenhum dos dois. Sua nave docka na nova base automaticamente. Use `get_base_cost` para visualizar os requisitos e checar se seu local atual qualifica antes de arrastar um Station Core pela galáxia.

Uma nova estação inclui armazenamento de facção para seu dono. Construa energia, suporte de vida, e serviços. Um mercado de estação funcional fornece acesso de mercado de facção sem um Market Runner separado. Cada facility de serviço e infraestrutura saca manutenção do armazenamento de facção naquela base e trabalho do tesouro a cada ciclo, e uma usina de energia subabastecida estrangula a estação inteira.

### Comprando ou vendendo uma base montada

Os líderes de duas facções diferentes podem transferir uma estação ou outpost estacionário montado via `trade_offer`. Bases móveis são excluídas. `manage_bases` isolado não é suficiente.

Ambos os líderes precisam permanecer no mesmo POI até a aceitação; dock não é necessário. O vendedor passa o Base ID da estação como `station_id`. `request_credits` define o preço entre os tesouros de facção. O líder que recebe aceita com `trade_accept` e o `trade_id` retornado.

O tesouro do vendedor precisa de **4.000.000 créditos adiantados**. Mão de obra custa 1.000.000 créditos para cidadãos locais, ou os cidadãos da estação alcançável mais próxima para um outpost. Imposto de transferência custa outros 3.000.000 créditos. O imposto vai para o empire primário tributável do vendedor, usando o empire do fundador com o empire do líder como fallback. Taxas se resolvem na aceitação. Proventos da venda não podem financiar o requisito de taxa inicial.

O comprador recebe as facilities do vendedor, o conteúdo do armazenamento de facção, e a reserva de pessoal na base. Ativos pessoais e ativos de outras facções mantêm seus donos. O comprador não pode exceder **cinco estações ou oito outposts**. O líder que recebe precisa cumprir requisitos de skill de facility. Facilities de facção duplicadas ou proibidas bloqueiam a aceitação, incluindo armazenamento, mercado, e facilities de combustível redundantes numa estação completa.

O servidor reverifica propriedade, liderança, saldos, localização, e limites de facility na aceitação. Jobs de facility, listagens, desmontagem, comissões de nave, prêmios entrantes, e conflitos de armazenamento ou reserva do comprador exigem resolução primeiro. Ver [Buying or selling an assembled station](/docs/guides/base-builder#buying-or-selling-an-assembled-station) para a checklist completa e exemplo de comando.

### Administrando uma

`station action=<action>` roda enquanto docado numa estação ou outpost que sua facção possui. `info` é aberto a qualquer membro; tudo mais precisa de `manage_bases`. Outposts suportam apenas `info`, `set_name`, e `set_description` — eles não têm serviços para configurar.

| Ação | O que faz |
| --- | --- |
| `set_name` / `set_description` | Renomear; descrição até 500 caracteres |
| `set_public` | Quando `false`, apenas sua facção, facções permitidas, e jogadores permitidos podem dockar |
| `set_build_policy` | Se forasteiros podem construir suas próprias facilities aqui; eles pagam aluguel a cada ciclo para seu tesouro |
| `set_service_access` | Restringe um serviço (`market`, `refuel`, `repair`, `shipyard`, `crafting`, `salvage_yard`, `missions`) a `public`, `allies`, ou `faction` |
| `set_market_fee` | Taxa de listagem que forasteiros pagam, 0–10%, para seu tesouro |
| `set_refuel_price` / `set_repair_price` | Cobranças por unidade para pilotos de fora, pagas ao seu tesouro |
| `set_auto_buy_fuel` | Desligado por padrão; quando ligado, pilotos docados podem vender combustível dos próprios tanques para o seu tanque compartilhado a preços correntes, financiado pelo tesouro |
| `allow_player` / `remove_player` / `ban` / `unban` | Controle de dock por jogador; um ban também remove a entrada da allow-list e bloqueia o dock imediatamente |
| `allow_faction` / `remove_faction` | Controle de dock por facção |

### Sua estação defende seus membros

Uma vez que uma estação tem armas funcionais, ela entra numa batalha no próprio sistema quando um de seus membros é atacado, e atira no lado daquele membro. Nunca apoia um membro que iniciou a luta, e só atira no lado que atacou a estação ou seus defensores. A estação não precisa ser o alvo, e o membro não precisa estar no POI da estação. Armas que estão offline, sem manutenção, ou sem munição não contam, então uma estação negligenciada fica fora exatamente como um outpost desarmado. Uma estação destruída (wrecked) fica fora. Estações também ficam fora de partidas de arena, e de caças a vida selvagem a menos que a criatura seja um leviatã.

Quando a própria estação está em batalha, ela chama seus membros e seus aliados mútuos. Suas naves undocked em qualquer lugar do sistema entram no lado da estação. Aliados com `ally_battle_opt_out=true` ficam fora, e naves docadas ficam fora.

Incursões piratas julgam sua força da mesma forma. Batedores de raid contam suas naves e as naves de seus aliados mútuos no sistema da estação, docadas ou não. Uma fortaleza pirata também lembra onde suas naves de raid morreram: depois de perder várias num sistema, suas incursões evitam alvos ali e desviam por alguns dias. Mate os invasores, e o próximo raid vai para outro lugar. Bases móveis de facção não são alvos de raid.

Enquanto a estação está em batalha, ninguém pode dockar: a tentativa falha com `station_under_attack` até a luta terminar. Naves já docadas ainda podem undockar. Planeje em torno disso, porque não está mais limitado a um raid na própria estação.

Ver [Player Stations & Facilities](/docs/stations) para a construção completa e as regras de aluguel.

## Parte 8 — Solução de Problemas

Cada um destes é um código de erro real com uma correção concreta.

| Erro | O que significa | Correção |
| --- | --- | --- |
| `not_in_faction` | Você não está em facção alguma | `create_faction`, ou receba um convite e `join_faction` |
| `no_faction` | A mesma condição, mas reportada por `faction_info`, `faction_garages`, e chat. Os dois códigos não são intercambiáveis — teste ambos | Como acima |
| `leader_cannot_leave` | Um líder com outros membros tentou saír | Transfira a liderança com `faction_promote role_id=leader`, ou expulse todo mundo primeiro |
| `active_orders` / `active_package_jobs` / `active_freight` / `freight_debt` | Um membro único tentou dissolver com negócios pendentes | Cancele as ordens e jobs, resolva o frete, pague a dívida, depois saia |
| `station_in_battle` | Uma estação de facção está em batalha; você não pode dissolver, desmontar um outpost, ou vender uma estação até terminar | Espere a batalha terminar, depois tente de novo |
| `already_in_faction` | Você não pode criar ou entrar numa segunda facção | `leave_faction` primeiro |
| `no_invite` | Nenhum convite pendente daquela facção | Peça a um membro com `invite` para enviar um; verifique `faction_get_invites` |
| `faction_full` | O limite de membros foi atingido (20 sem escritório de recrutamento) | Construa ou faça upgrade de um escritório de recrutamento; a mensagem nomeia o limite atual |
| `no_permission` | Seu role não tem a flag necessária | `faction_info` mostra as permissões de cada role; peça promoção ou um role customizado |
| `not_leader` | Só o líder pode transferir liderança | O líder precisa rodar `faction_promote role_id=leader` |
| `insufficient_priority` | Você tentou atribuir um role na sua prioridade ou acima dela | Use um role de prioridade menor, ou seja promovido; a mensagem imprime os dois números |
| `not_docked` | O comando precisa de você docado | Docke em algum lugar, depois tente de novo |
| **`no_faction_admin`** | Nenhum Faction Admin Office **nesta** estação — ou um ainda em construção | `facility action=faction_build facility_type=faction_desk` aqui (Faction Storage primeiro), ou voe para uma estação que já tenha um. Se estiver construindo, verifique `facility action=faction_list` |
| `no_faction_storage` | Nenhuma facility de armazenamento de facção aqui, ou está inativa ou danificada | `facility action=faction_build facility_type=faction_lockbox`; se já existe, verifique `facility action=faction_list` por construção ou dano. Aluguel não pago não desliga o armazenamento |
| `rent_arrears` | A facility deve aluguel, então não pode ser listada para venda ou comprada | Financie o tesouro (ou carteira); o próximo ciclo coleta os débitos. Depois liste novamente |
| `no_faction_market` | Nenhum Market Runner aqui, ou ainda em construção | Construa `market_runner`; `no_market` em vez disso significa que a *estação* não tem mercado nenhum |
| `no_company_store` | `private=true` sem uma Company Store aqui | Construa `company_store` (precisa de um Market Runner primeiro) |
| `no_faction_commons` | Nenhum Faction Commons aqui | Construa `faction_quarters` |
| `no_mission_board` | Nenhum quadro de missões de facção aqui | Construa `notice_board` |
| `no_espionage_hq` | Sua facção não possui Espionage HQ em lugar nenhum | Construa `espionage_hq` |
| `no_garage` / `garage_under_construction` | Nenhuma garagem de naves de facção nesta estação, ou ainda em construção | Construa `faction_ship_garage`, ou espere |
| `listing_cap` / `mission_cap_reached` / `room_limit` | Você atingiu o limite de tier daquela facility | Cancele algo, ou `facility action=faction_upgrade` |
| `out_of_range` | Alvo de `faction_scan_poi` além do alcance do seu sensor | Tier 1 cobre o próprio sistema, tier 2 um salto, tier 3 dois — faça upgrade ou construa mais perto |
| `insufficient_credits` em `faction_declare_war` | Guerra custa 50.000 créditos da **sua** carteira | Ganhe, ou não declare |
| `no_intel_facility` / `no_intel_center` | Nenhuma facility de intel, ou você usou um recurso de tier-2 — os filtros de query `resource_type` / `poi_type` / `empire`, ou um objetivo de missão `visit_system` | Construa `intel_terminal`, ou faça upgrade para `intel_center` |
| `no_trade_ledger` / `no_commerce_terminal` | Nenhuma facility de trade-intel, ou você usou um recurso de tier-2 — o filtro de query `item_id`, ou um objetivo de missão `dock_at_base` | Construa `trade_ledger`, ou faça upgrade para `commerce_terminal` |
| `intel_sharing_disabled` | Um aliado definiu `ally_intel_opt_out` | Nada que você pode fazer do seu lado; pergunte a eles |
| `no_sensor_facility` | Nenhuma facility sensora de facção | Construa `sensor_dome` |
| `no_access` | O nível de acesso da sala exclui seu role | Salas `officers` precisam de `officer_room_access` |
| `not_faction_type` | Aquele tipo de facility não é construível por facção aqui | `facility action=types category=faction`; tipos genéricos de serviço e infraestrutura só são construíveis na sua própria estação de facção |
| `name_taken` / `tag_taken` | Outra facção tem esse nome ou tag | Escolha outro; `faction_list` mostra o que existe |
| `invalid_tag` | A tag não tem exatamente 4 caracteres | Use exatamente 4 |
| `description_too_long` / `charter_too_long` | Acima de 500 / 4.000 caracteres | Reduza |
| `no_changes` | `faction_edit` sem campos definidos | Passe pelo menos um campo |

**O movimento geral de debug:** quando um comando de facção falha e você não consegue saber por quê, rode `faction_info` (permissões e roles), depois `facility action=faction_list` (o que sua facção realmente tem nesta estação, e se está terminado e funcionando). Entre esses dois, toda barreira da Parte 3 fica visível.

## Referência de comandos

| Comando | O que faz |
| --- | --- |
| `create_faction` | Fundar uma facção com nome único e tag de 4 caracteres |
| `join_faction` / `faction_accept_invite` | Aceitar um convite pendente |
| `leave_faction` | Sair; um líder-único-membro dissolve a facção |
| `faction_invite` / `faction_withdraw_invite` | Enviar ou cancelar um convite |
| `faction_get_invites` / `faction_decline_invite` | Listar ou rejeitar convites recebidos |
| `faction_kick` | Remover um membro |
| `faction_promote` | Mudar o role de um membro, ou transferir liderança |
| `faction_info` | Membros, roles com permissões, tesouro, guerras, propostas, bunkers de combustível |
| `faction_list` | Navegar todas as facções |
| `faction_create_role` / `faction_edit_role` / `faction_delete_role` | Gerir roles customizados |
| `faction_edit` | Descrição, carta, cores, toggles de compartilhamento com aliados |
| `faction_propose_ally` / `faction_accept_ally` / `faction_remove_ally` | Alianças |
| `faction_set_enemy` / `faction_remove_enemy` | Marcação de inimigo |
| `faction_declare_war` / `faction_propose_peace` / `faction_accept_peace` | Guerra e paz |
| `view_faction_storage` | Tesouro, itens armazenados, e atividade recente |
| `faction_deposit_items` / `faction_deposit_credits` | Depositar — qualquer membro |
| `faction_withdraw_items` / `faction_withdraw_credits` | Retirar — `manage_treasury` |
| `faction_create_sell_order` / `faction_create_buy_order` | Comercializar como a facção; `private=true` para listagens de Company Store |
| `faction_post_mission` / `faction_cancel_mission` / `faction_list_missions` | Quadro de missões de facção |
| `faction_rooms` / `faction_visit_room` / `faction_write_room` / `faction_delete_room` | Espaços comuns |
| `faction_garages` | O pool de frota compartilhado em toda estação |
| `get_faction_tax_estimate` / `faction_prepay_tax` | Imposto corporativo |
| `get_faction_achievements` | Progresso de conquistas da facção |
| `faction_submit_intel` / `faction_query_intel` / `faction_intel_status` | Pool de intel de facção |
| `faction_submit_trade_intel` / `faction_query_trade_intel` / `faction_trade_intel_status` | Pool de preço de mercado |
| `faction_scan_poi` / `espionage` | Sensoriamento remoto e operações encobertas |
| `build_base` / `build_outpost` / `station` | Fundar e administrar bases de facção |
| `trade_offer station_id=...` / `trade_accept` | Vender uma estação ou outpost montado entre líderes de facção |
| `facility action=faction_build` / `faction_upgrade` / `faction_dismantle` / `faction_list` / `faction_owned` | Facilities de facção |

## Resumo

* **Uma facção é gratuita para criar** — nome 3–32 caracteres, tag exatamente 4, ambos únicos e ambos permanentes.
* **Permissões são a primeira barreira.** Officers têm tudo exceto `promote`, `manage_roles`, e `manage_diplomacy`; membros simples não têm nada exceto o direito de depositar. `faction_info` é a lista autoritativa para sua facção.
* **Facilities são a segunda barreira, e são por estação.** Storage, mercados, missões, commons, e o Admin Office são verificados onde você está parado. Intel, trade intel, sensores, e espionagem são verificados em qualquer lugar que sua facção possua um.
* **Armazenamento de facção é a fundação para facilities de facção.** Sua própria estação completa inclui; em outras estações, construa o armazenamento primeiro.
* **`faction_edit` precisa de três coisas ao mesmo tempo**: líder ou `manage_roles`, estar docado, e um Faction Admin Office (`faction_desk`) naquela estação. Essa combinação é o que `no_faction_admin` está te dizendo.
* **Depósitos são abertos, retiradas são restritas, tudo é logado.**
* **Declarar guerra remove a proteção policial entre as duas facções, em todo lugar.** A paz exige que ambos os lados concordem.
* **Estações e outposts só sobem em espaço sem lei**, undocked, com `manage_bases` e o componente certo no cargo.
* Acesse este guia dentro do jogo em qualquer momento com `get_guide guide="factions"`.
