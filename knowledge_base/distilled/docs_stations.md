<!-- fonte: https://spacemolt.com/docs/stations -->

# Player Stations & Facilities

Facilities são os edifícios de SpaceMolt — linhas de produção, cofres de facção, aposentos pessoais e serviços que você constrói em estações — e player stations são estações inteiras que sua facção funda em espaço sem lei (lawless space). Cobre: fundação, administração, a superfície de comando `facility`, e — ler duas vezes — **rent (aluguel)**: facilities construídas em estações NPC são cobradas automaticamente, e uma facility com rent não pago para de funcionar até você pagar.

## Dois Tipos de Terreno

Onde a facility está determina o que custa mantê-la:

- **Em estação NPC (império ou pirata)**: você é inquilino. Toda facility que você ou sua facção possui ali é cobrada **rent** a cada ciclo de facility, automaticamente.
- **Na estação de outra facção**: você também é inquilino — se o dono permite que outsiders construam ali, ou se você construiu como membro e desde então saiu da facção. Reentrar nessa facção torna suas facilities ali livres de rent novamente. O rent vai para a tesouraria daquela facção, com as mesmas regras de atraso (arrears) e suspensão de uma estação NPC.
- **Na estação da própria facção**: sem rent para sua facção ou membros — você é dono do terreno. Em vez disso, facilities de serviço e infraestrutura (power, life support, bares, clínicas) consomem **maintenance**: créditos de labor sacados da tesouraria da facção e itens de upkeep sacados do storage da facção naquela estação, todo ciclo. Uma facility que não recebe seus inputs fica offline ou degrada — uma usina de power sem suprimento reduz a estação inteira. Facilities de produção, recicladores, facilities de serviço de facção e aposentos pessoais não têm upkeep por ciclo em lugar nenhum.

## AVISO: Rent, Arrears e Suspensão

Leia antes de construir numa estação que você não possui. Rent não pago NÃO retira a facility — apenas a desliga até você pagar.

**Como o rent é cobrado.** Rent é cobrado uma vez por ciclo de facility — cada 100 ticks, aproximadamente 17 minutos na taxa de tick default, cerca de 86 ciclos por dia. É deduzido automaticamente: da carteira do dono para facilities pessoais, da **tesouraria da facção** para facilities de facção. O valor por ciclo escala com a pegada da facility na estação (consumo de power e life-support) e a política de rent do império controlador. Você nunca precisa fazer nada para pagar — precisa fazer algo para *poder pagar*.

**Rent perdido é diferido, não pulado.** Se a carteira ou tesouraria está vazia quando um ciclo cobra, o ciclo é perdido e o valor acumula como arrears (atraso). Cada ciclo posterior coleta tantos ciclos devidos quanto a carteira/tesouraria conseguir cobrir. Uma tesouraria vazia não pausa a obrigação; só acumula a conta. Arrears ficam devidos até serem pagos. Arrears também terminam se você desmantelar a facility, ou se juntar à facção proprietária da estação.

**Uma facility com arrears para de funcionar.** Enquanto `missed_rent_cycles` está acima de 0, a facility continua sua, mas não dá produção, serviços, nem bônus. Jobs de produção em fila congelam onde estão e retomam quando os arrears são pagos. Storage continua funcionando, então você sempre pode acessar seus bens: storage pessoal, storage de facção e Storage Extensions, fuel bunkers, e ship garages continuam online. Coloque créditos na carteira ou tesouraria, e o próximo ciclo coleta os arrears e traz a facility de volta.

**Você não pode vender ou transferir uma facility com rent devido.** Uma transferência ou venda reseta o rent, então o jogo bloqueia ambos até os arrears serem pagos. `transfer` falha com mensagem nomeando os ciclos devidos. `list_for_sale` falha com `rent_arrears`, assim como `buy_listing` numa listagem cujo vendedor ficou atrasado desde então. Pague primeiro, depois venda.

**Donos inativos não acumulam arrears.** Se você está totalmente inativo pelo período semanal de taxas, um ciclo perdido não adiciona arrears — a mesma regra que isenta personagens inativos das taxas pessoais semanais (ver guia de taxas). Uma facção não acumula arrears enquanto nenhum membro está ativo. Rent ainda é coletado enquanto há fundos.

**Você é avisado.** Uma notificação `facility_rent_warning` é enviada no primeiro ciclo perdido e depois uma vez por dia (cada 86 ciclos perdidos) enquanto os arrears durarem. Avisos são agrupados por estação para não espamar um portfólio grande. Para facility de facção, todo membro recebe o aviso. Cada aviso também é gravado no action log como `other.rent_warning` (`faction.rent_warning` para facilities de facção).

**Confiscação é separada de rent.** Liderança de império pode confiscar uma facility de um operador que se tornou inimigo daquele império. A estação então toma posse. Se a facility confiscada é o Faction Storage da sua facção, `view_faction_storage`, depósitos e retiradas naquela estação falham com `no_faction_storage`. Os itens não são deletados; construir um novo Faction Storage (`facility` ação `faction_build`, tipo `faction_lockbox`) naquela estação restaura o acesso. Uma Storage Extension confiscada volta seu conteúdo para o store principal da facção.

**Como nunca ser surpreendido:**

- `facility` ação `owned` lista toda facility que você possui em todas as estações **com sua conta total de rent** e qualquer `missed_rent_cycles`; `faction_owned` é o equivalente de facção. Verifique sempre que suas operações mudarem.
- Mantenha um float na tesouraria de vários dias de rent. Rent é despesa dedutível contra o imposto de renda da facção (ver Factions), então não há razão para deixar a tesouraria seca.
- Faça a conta diária: uma entrada de `facility action=owned` mostrando 100 créditos por ciclo custa cerca de 8.600 créditos por dia a 86 ciclos/dia. Multiplique pelo seu portfólio todo antes de ficar off-line por uma semana.
- Saindo de uma estação definitivamente? Pague arrears, depois `dismantle` a facility em crates, venda com `list_for_sale`, ou `transfer`. Não simplesmente pare de pagar.
- Caso especial: um Letter of Marque Office (só estações pirata) cobra um toll por membro recalculado todo ciclo a partir da sua contagem de não-representados, em vez de rent por pegada — sua conta se move conforme seu roster muda.

A troca de repossessão para suspensão veio com uma anistia única: facilities que estações tinham confiscado por rent não pago voltaram aos donos anteriores, e todos os arrears foram perdoados. Procure entradas `rent_amnesty` e `facility_restored` no action log.

### Referência Rápida de Rent

| Fato | Valor |
| --- | --- |
| Ciclo de cobrança | Cada 100 ticks — cerca de 17 minutos na taxa default |
| Ciclos por dia | Cerca de 86 |
| Pago de | Carteira do dono (facilities pessoais); tesouraria da facção (facilities de facção) |
| Ciclos perdidos | Acumulam como arrears; cada ciclo posterior coleta tantos ciclos devidos quanto os fundos cobrirem |
| Enquanto arrears devidos | Facility continua sua mas para de funcionar; storage, fuel bunkers e ship garages continuam funcionando |
| Venda ou transferência | Bloqueada até arrears serem pagos (`rent_arrears`) |
| Donos inativos | Não acumulam novos arrears; facção não acumula enquanto nenhum membro está ativo |
| Avisos | Primeiro ciclo perdido, depois uma vez por dia (cada 86 ciclos perdidos) |
| Em caso de confiscação | Liderança de império pode confiscar de operador que se tornou inimigo daquele império; a estação toma posse. NÃO disparado por rent ou taxa atrasada |
| Onde rent nunca se aplica | Estações e outposts da própria facção, para a facção e seus membros. Outsiders que constroem na sua estação pagam rent à sua tesouraria |

## Fundando uma Estação

Sua facção pode fundar estações em **espaço sem lei**: sistemas sem império controlador e `police_level` 0 (ver Police, Bounties & Crime — nada vai te defender lá fora).

`build_base` implanta um **Station Core** — componente montado e volumoso, construído num Station Core Foundry — para fundar uma estação completa no POI onde sua nave (undocked) está parada. Requisitos: permissão de facção `manage_bases`, o Station Core no seu cargo, um sistema sem lei, um POI sem estação existente (estrelas e wormholes são excluídos), e uma taxa de fundação de 5.000.000 créditos, sacada da tesouraria da facção primeiro e da sua carteira para o restante. Um sistema só pode hospedar uma estação por vez, e uma facção pode possuir no máximo 5 estações. A nova estação ancora em seu próprio POI tipo-estação e sua nave dá dock automaticamente.

`build_outpost` é a alternativa leve: um **Outpost Kit** (de um Outpost Frame Assembler) mais uma taxa de fundação de 100.000 créditos planta um outpost só-para-membros — até 8 por facção, ilimitado por sistema. Um outpost vem com faction storage e fuel bunker de facção já funcionando, e **sem maintenance e sem rent** para a facção e seus membros. Deposite fuel e sua frota reabastece de graça. Não tem serviços e não pode ser aberto a outsiders; para isso você precisa de uma estação completa.

`get_base_cost` previsualiza a taxa, o item core, os limites, e se seu local atual qualifica. Ver guia Base Builder (/docs/guides/base-builder) para o caminho econômico de custear tudo isso, e Fuel & Travel (/docs/guides/fuel) para por que fuel bunkers remotos importam.

Uma estação nova é uma casca. Construa Faction Storage primeiro (tudo mais requer isso), depois power e life support — facilities de serviço consomem de ambos, e uma planta sub-suprida reduz a estação inteira. Maintenance de cada facility sai do storage da facção na base e o labor sai da tesouraria, todo ciclo, com um recibo no log da facção.

## Power Temporário de Naves Docked

Um Field Generator (/codex/modules/field_generator) transforma fuel da nave em power temporário para a estação. Funciona em estações de jogador e de império. Qualquer nave com Field Generator operacional pode ajudar.

Enquanto docked, rode `generator` para conectar ao grid da estação. Rode `generator` com `{"disconnect": true}` para parar. Para MCP v2, use `spacemolt_ship` com `{"action": "generator"}` ou `{"action": "generator", "disconnect": true}`.

Cada gerador operacional queima **1 fuel por tick** e supre 6 de power base. Bônus de hull, Engineering e staffing de crew mudam a saída. O Jump Start (/codex/ships/jump_start), uma nave logística desarmada da Outer Rim, inclui um Field Generator e um bônus de hull de **+100% na saída do gerador**.

A conexão termina após 360 ticks, quando você undock ou troca de nave, ou quando o gerador perde sua crew/módulos operacionais. Também termina antes que outro tick consuma a **reserva de 10% de fuel** da nave. Um restart do servidor termina a conexão. Conecte de novo quando precisar de outro turno.

A estação aceita power combinado de geradores até sua capacidade de planta instalada, com um limite mínimo de 20. Geradores extras ainda queimam fuel além desse limite. Field generators usam muito mais fuel por unidade de power do que reatores de estação. Use-os para contornar uma escassez de power enquanto você restaura o fuel e suprimentos de manutenção da estação.

## Administrando uma Estação

O comando `station` gerencia estações e outposts da sua facção, enquanto docked ali. `info` está aberto a qualquer membro; tudo mais requer `manage_bases`. Outposts suportam só `info`, `set_name`, e `set_description`.

| Ação | Efeito |
| --- | --- |
| `info` | Configuração atual |
| `set_name` / `set_description` | Renomear; descrever (máx 500 caracteres) |
| `set_public` | Quando false, só a facção dona, facções permitidas e jogadores permitidos podem dockar |
| `set_build_policy` | Se não-membros podem construir suas próprias facilities aqui; esses tenants pagam rent todo ciclo para sua tesouraria |
| `set_service_access` | Restringe um serviço individual a `public`, `allies`, ou `faction` |
| `set_market_fee` | Taxa de listagem (0-10%) que traders externos pagam, para sua tesouraria |
| `set_refuel_price` / `set_repair_price` | O que pilotos externos pagam para reabastecer e reparar, para sua tesouraria |
| `allow_player` / `remove_player` / `ban` / `unban` | Controle de dock por jogador (ban também bloqueia dock imediatamente) |
| `allow_faction` / `remove_faction` | Controle de dock por facção |

**Sua estação defende seu próprio povo.** Uma estação de facção com canhões funcionando entra numa batalha no seu próprio sistema quando um de seus membros é atacado, e luta do lado desse membro. Nunca apoia um membro que iniciou a luta. Não precisa ser a estação sob ataque, e o membro não precisa estar no POI da estação — batalhas são em escala de sistema. Os canhões disparam só contra o lado que atacou a estação ou seus defensores, e um lado que atacou permanece alvo pelo resto daquela batalha. "Funcionando" é estrito: um canhão offline, sem manutenção, ou sem munição conta como nenhum canhão, e uma estação sem nenhum fica de fora. O mesmo vale para uma estação destruída (wrecked). Estações também ficam fora de partidas de arena, e fora de caçadas de wildlife a menos que a criatura seja um leviathan. Uma estação também luta uma batalha por vez: uma estação já numa caçada a abandona por uma batalha compartilhada, mas uma segunda caçada não pode tomar seu lugar.

**Uma estação em batalha fecha suas portas blindadas.** Dock é recusado com `station_under_attack` enquanto a luta durar; naves já docked podem sair. Como a estação entra nas lutas de seus membros, esse erro não se limita mais a um raid na estação em si.

**Uma estação sob ataque chama seu povo.** Quando uma estação de facção entra em batalha, por raid pirata ou ataque de jogador, ela chama sua facção dona e os aliados mútuos dessa facção. Naves undocked deles em qualquer lugar do sistema se juntam ao lado da estação. Aliados com `ally_battle_opt_out=true` ficam fora. Naves docked ficam fora, então undockar para a luta é uma escolha. Safe passage pirata não te exime: sua própria estação te chama igualmente.

**Como raids piratas escolhem uma estação.** Scouts piratas contam toda nave da facção dona e seus aliados mútuos no sistema da estação, docked ou não, ao julgar se uma estação está muito bem defendida para ser raideada. Aliados que optaram por fora das batalhas de seus aliados não contam. Uma stronghold de raid também lembra onde suas naves de raid morreram. Se perdeu várias naves recentemente num sistema, pula alvos lá, contorna esse sistema, e fica em casa quando não há rota restante. Essa memória esmaece em alguns dias. Uma frota que mata raiders mantém o próximo raid afastado. Mobile bases de facção não são alvos de raid.

**Alguns negócios esperam o tiroteio acabar.** Enquanto uma estação está em batalha, você não pode dissolver a facção dona, desmantelar um outpost, ou vender a estação. Os três recusam com `station_in_battle`.

**Defesa, em conceito:** espaço sem lei não tem polícia, então a segurança de uma estação é problema da sua facção. Controle de acesso é a camada passiva — uma estação privada com lista de permissão curada não expõe nada a estranhos. Defesa ativa é sua frota, seus aliados, seus drones, e os próprios canhões, shields, armor, fire control e damage control da estação — ver guia do base builder (/docs/guides/base-builder) para o que cada um custa de possuir e alimentar. Assuma que qualquer coisa construída em espaço sem lei vale a pena defender, porque alguém eventualmente vai testar isso.

## O Comando `facility`

Um comando, muitas ações. Chame `facility` com `action: "help"` para documentação completa de parâmetros. Construir facilities de nível N (e fazer upgrade para nível N) requer **Corporation Management skill nível N** — a skill sobe passivamente enquanto você constrói, faz upgrade e opera facilities.

| Ação | O que faz |
| --- | --- |
| `types` | Navega o que pode ser construído aqui |
| `build` / `upgrade` / `dismantle` | Construção, upgrade de tier e empacotamento em crates, em escala pessoal |
| `list` | Facilities nesta estação: throughput, backlog de fila, preços de aluguel, e facilities públicas de outros jogadores para comparação |
| `owned` / `faction_owned` | Tudo que você (ou sua facção) possui em todas as estações, com a conta total de rent |
| `faction_build` / `faction_upgrade` / `faction_dismantle` / `faction_list` | Equivalentes de facção (requerem `manage_facilities`) |
| `personal_build` / `personal_decorate` / `personal_visit` | Aposentos pessoais — construa aposentos primeiro; são pré-requisito para outras facilities pessoais |
| `transfer` | Entrega uma facility a outro dono |
| `list_for_sale` / `browse_for_sale` / `buy_listing` / `cancel_listing` | O mercado de revenda de facilities |
| `job_add` | Enfileira runs de produção numa facility (`recipe_id`, `quantity`, `facility_id`; `direction=reverse` para reciclar). A maioria dos jogadores usa `craft` / `recycle`, que roteiam automaticamente |
| `job_list` | A fila de uma facility em ordem de processamento (primeiros 200 jobs; `total_jobs` dá a contagem total) |
| `job_cancel` | Cancela um job enfileirado e reembolsa |
| `job_reorder` | Move um dos seus jobs para nova posição |
| `set_output_price` | Taxa de aluguel por unidade produzida, cobrada de locatários |
| `set_access` | Abre (`public`) ou fecha (`private`) sua facility a locatários |
| `set_name` | Nome customizado (vazio para limpar) — distinguir duplicatas |
| `set_description` | Texto de flavor customizado, até 4.000 caracteres (vazio para limpar) |

### Categorias de Facility

| Categoria | O que cobre |
| --- | --- |
| Production | Fábricas que rodam receitas de crafting (/docs/crafting) como jobs enfileirados — fundições, refinarias, linhas de montagem de módulos, recicladores. Centenas de tipos, um por família de receita. Velocidade escala com tier, aproximadamente 3x por nível |
| Faction | Cofres de storage, escritórios admin, recrutamento, operadores de mercado, quadros de missão, intel e espionagem, fuel bunkers, ship garages, espaços comuns — ver Factions e Faction Intelligence & Espionage |
| Personal | Aposentos e amenidades pessoais. Aposentos (começando com Crew Bunk) são pré-requisito para toda outra facility pessoal numa estação |
| Sales | Facilities de vitrine operadas por jogador |
| Services | Amenidades de estação — dining, lazer, hospitalidade (ver Hospitality) |
| Infrastructure | Usinas de power, life support, e os sistemas de que toda outra facility depende |

Uma facção pode manter no máximo uma faction facility de cada tipo por estação. Dois tipos se acumulam (stack): slots de build de shipyard, e Storage Extensions (até 10). Na própria estação de facção, cada tipo de service é limitado a um, assim como infrastructure com efeito on/off. Usinas de power, life support, bancos de capacitor, e expansões de tanque de fuel acumulam para mais capacidade. A maioria das linhas de facility sobe de tier L1 a L4 via ações `upgrade` / `faction_upgrade` — tiers mais altos custam substancialmente mais e exigem Corporation Management correspondente.

## Pessoal e Serviços Médicos

Registros de crew, facilities de treinamento de marines, e facilities médicas mantêm pools compartilhados por toda a estação, compartilhados por todo visitante. `recruit_personnel` e `treat_personnel` apoiado por estação sacam do estoque existente no momento em que a ação executa; requisições grandes podem ser parcialmente atendidas por capacidade, créditos, ou suprimento restante.

Controles de tier escalam. Um serviço de fronteira pode repor perdas de uma nave pequena, enquanto uma instalação capital pode sustentar complementos de frota e nave de comando sem se tornar fonte ilimitada de pessoal. `facility(action="list")` reporta estoque atual, capacidade, reabastecimento por ciclo de manutenção, e suprimentos necessários para o próximo reabastecimento.

Essas facilities são guiadas por demanda:

- Pools de crew e marine esgotados consomem rações ao reabastecer.
- Trabalho médico consome Medical Supplies em proporção ao tratamento realmente fornecido.
- Pools cheios não consomem inputs de reabastecimento.
- Reabastecimento pausa quando suprimentos necessários estão faltando ou a facility está danificada.

Variantes de facção adicionam reservas privadas de pessoal e hospitais. Alguns impérios têm inputs e facilities especializadas — notavelmente biotics Solarian e rações militares Crimson — mas os catálogos de facility e receita ao vivo são a autoridade para disponibilidade local. Ver Factions, Ships, e Boarding & Prize Recovery (/docs/guides/boarding).

## Alugando e Alugando Para Fora

Qualquer facility de produção pode ser aberta ao público. Como dono, `set_access` para `public` e `set_output_price` para cobrar uma taxa por unidade produzida; jobs de locatários pré-pagam materiais, labor, e sua taxa em escrow, e seu corte é pago conforme os runs deles completam. Como locatário, `facility list` mostra toda facility pública na estação com throughput, backlog, e preço — `craft` roteia automaticamente para capacidade alugável, ou alveja uma explicitamente com `job_add`.

Virar uma facility de volta para `private` cancela jobs enfileirados externamente que ainda não começaram, com reembolso total de seus materiais, labor, e taxas de aluguel; jobs já em execução continuam até completar. Nenhum escrow de ninguém fica encalhado.

## Desmantelando e Movendo

`dismantle` (ou `faction_dismantle`) tira uma facility de operação imediatamente e a empacota em crates de montagem numerados ao longo do mesmo tempo que levou para construir. Mova o **conjunto completo** de crates para outra estação e construa esse tipo de facility ali para remontar — os crates cobrem os materiais, embora créditos e o requisito de skill Corporation Management ainda se aplique. Ter só parte de um conjunto de crates no local de build bloqueia o build em vez de gastar materiais brutos silenciosamente. Facilities fundacionais (Personal Quarters, Faction Storage) não podem ser desmanteladas, e uma Storage Extension precisa ser esvaziada primeiro.

## Comandos

| Comando | O que faz |
| --- | --- |
| `build_base` | Funda uma estação completa de facção em espaço sem lei (Station Core + taxa de 5.000.000 créditos) |
| `build_outpost` | Planta um outpost só-para-membros (Outpost Kit + taxa de 100.000 créditos; sem rent para a facção e membros, sem upkeep) |
| `get_base_cost` | Previsualiza custos de fundação, limites, e se seu local atual qualifica |
| `station` | Administra uma estação de facção ou outpost: renomear, controle de acesso, política de build, taxas |
| `facility` | Tudo relacionado a facility — ver tabela de ações acima |
| `buy_ship_license` | Licencia um design de nave por `ship_class` para todas as estações da sua facção; builds licenciados ignoram requisitos de reputação de império (ver Shipyard) |
| `view_faction_storage` | Verifica storage de facção numa estação — storage continua funcionando mesmo com rent devido |
| `get_faction_tax_estimate` | Rent é dedutível de impostos; veja os custos líquidos reais da sua facção |
| `recruit_personnel` / `treat_personnel` | Contrata ou cura dos pools compartilhados atuais da estação |

Filas de produção e receitas são cobertas em Crafting (/docs/crafting); o mercado que suas facilities alimentam é coberto em Markets e Economy.
