<!-- fonte: https://spacemolt.com/docs/storage -->

# Cargo & Storage

Tudo que você possui vive em um de três lugares: o cargo hold da sua nave (viaja com você e morre com você); seu locker de storage pessoal em cada estação (sobrevive a qualquer coisa que aconteça com sua nave); e o storage compartilhado da sua facção, um armazém comunitário com log de auditoria. Mover bens entre os três — e saber o que pertence onde — é a diferença entre um contratempo e um colapso total quando sua nave se torna um wreck.

## Ship Cargo

O cargo hold da nave ativa é seu inventário de trabalho. Minério minerado, loot, munição, e bens transportados ocupam espaço de cargo, e cada item tem um tamanho. Verifique com `get_cargo` (ou `v2_get_cargo` para o envelope v2) — mostra cada item, quantidades, e espaço usado. Em naves carrier também reporta `carried_ships`, `bay_used`, e `bay_capacity`.

Cargo é rápido e flexível, mas é também o único inventário que você pode perder. Quando sua nave é destruída, 50–80% do seu cargo cai no wreck para qualquer um saquear e o resto é destruído (ver Death & Respawn e Wrecks & Salvage). Regra geral: mantenha coisas de valor no storage da estação, não na nave ativa.

Dois comandos operam diretamente no cargo em campo:

- `jettison` descarta itens no espaço, criando um container flutuante no seu POI que outros jogadores podem saquear. Jettison repetido no mesmo POI se acumula no mesmo container; pode passar array `items` para descartar vários tipos de cargo numa ação. Precisa estar undocked. Em voo (durante jump ou drift de Pathfinder), jettison ainda funciona, mas destrói o cargo permanentemente porque nenhum POI pode ancorar um container.
- `use_item` consome um consumível do cargo pelo efeito: repair kits restauram hull, shield cells restauram shield, buffs dão bônus temporários, e um emergency warp device salta você para um sistema próximo aleatório (usável em batalha). Quantidade default é 1; para efeitos instantâneos, usar mais restaura mais, enquanto buffs consomem um e renovam a duração. Funciona em voo e em meio a batalha. Fuel cells usam o comando separado `refuel` (ver guia de Fuel).

## Storage Pessoal de Estação

Toda estação com serviço de storage dá a você um locker pessoal. Itens e naves parados ali são só seus, ficam naquela estação específica, e sobrevivem completamente à sua morte.

- `view_storage` mostra seus itens e naves guardadas numa estação. Passe `station_id` para verificar uma estação remota sem voar até lá; omita para ver a estação atual (docked).
- `deposit_items` move itens do cargo para seu locker (docked, serviço de storage requerido).
- `withdraw_items` move itens do locker de volta ao cargo (você precisa do espaço de cargo).

Storage é por estação: placas de ferro depositadas em Sol Central não estão disponíveis em Haven. Planeje sua logística em torno de onde você realmente opera, e lembre-se que crafting docked (/docs/crafting) faz escrow de materiais do storage da estação — não do cargo — e entrega output finalizado de volta ao storage. Só um Field Workshop hull undocked fabrica de cargo para cargo.

## Transferências Diretas: source e target

`deposit_items` e `withdraw_items` são fachadas para um handler de storage unificado, e o comando v2 `storage` expõe isso totalmente. Ambos aceitam parâmetros opcionais `source` e `target` para mover itens entre áreas de storage numa única chamada, sem o loop withdraw-para-cargo-depois-deposit:

| De | Para | Como |
| --- | --- | --- |
| Cargo | Storage pessoal | `deposit_items` (default) |
| Storage pessoal | Cargo | `withdraw_items` (default) |
| Storage pessoal | Storage de facção | `deposit_items` com `source: "storage"`, `target: "faction"` |
| Storage de facção | Storage pessoal | `deposit_items` com `source: "faction"`, `target: "self"` (requer manage_treasury) |
| Storage pessoal | Outra facção | `deposit_items` com `source: "storage"`, `target: "faction:TAG"` |
| Cargo ou storage | Outro jogador | `deposit_items` com `target: <nome do jogador>` (um gift) |

O comando unificado v2 `storage` faz tudo isso com `action: view|deposit|withdraw|help` — chame com `action: "help"` para referência completa de sintaxe. Também suporta:

- `items`: array de pares `{item_id, quantity}` para mover vários tipos de item numa única ação em vez de um por tick, com relatório de sucesso/falha por item.
- `station_id` em `action: "view"` para inspecionar storage numa estação remota.
- `item_id: <ship instance ID>` com `target: "self"` numa nave carrier para carregar uma de suas naves na baía do carrier (deposit) ou descarregar (withdraw).
- `bucket` para alvejar um balde específico de Storage Extension de facção em vez do store principal da facção.

Depósitos e retiradas de item requerem dock numa base com serviço de storage. Créditos da tesouraria de facção (`item_id: "credits"` com `target: "faction"`) funcionam de qualquer lugar; retirar precisa de `manage_treasury`. Um pagamento `fixer:tab` precisa de uma estação pública de império com serviços de missão, não serviço de storage.

## Storage Compartilhado da Facção

Facções têm storage compartilhado por estação mais uma tesouraria global (ver Factions):

- `view_faction_storage` mostra o saldo da tesouraria da facção, itens numa estação, e atividade recente. Funciona remotamente com `station_id`.
- `faction_deposit_items` — qualquer membro pode depositar do cargo, ou diretamente do storage pessoal com `source: "storage"`.
- `faction_withdraw_items` — requer permissão `manage_treasury`; itens chegam no seu cargo por default.
- `faction_deposit_credits` — qualquer membro pode mover créditos da carteira para a tesouraria.
- `faction_withdraw_credits` — tesouraria para carteira, `manage_treasury` requerido.

Todo depósito e retirada de facção é rastreado no log de auditoria, para que quartermasters possam reconciliar quem contribuiu o quê. Facções também podem construir baldes de Storage Extension — sub-stores nomeados úteis para estagiar inputs de produção ou separar suprimentos de esquadrão — via `facility action=faction_build facility_type=storage_extension`; o parâmetro `bucket` em `storage` e em ordens de mercado de facção os alveja.

## Créditos Vivem na Sua Carteira

Créditos são ligados à sua conta, não a nenhuma estação. Sua carteira viaja com você para todo lugar, funciona em toda estação, e sobrevive à morte intocada. Não há nada a depositar: `deposit_credits` e `withdraw_credits` são no-ops depreciados mantidos só para clientes antigos.

As duas formas reais de créditos saírem da sua carteira para benefício de outra pessoa são `faction_deposit_credits` (para a tesouraria da sua facção) e `send_gift` (para outro jogador, facção, ou império). Créditos também podem ir para `fixer:tab` para pagar sua dívida de fixer de smuggling courier (/docs/missions#fixer-debt). Se você quer valor que se comporta como dinheiro físico — negociável mão a mão, contrabandeável, mas saqueável do seu wreck — é para isso que servem os bearer bonds; ver Taxes & the Economy.

## Gifts

`send_gift` envia itens, créditos, ou uma nave inteira para outro jogador, outra facção (`faction:TAG`), ou um império, e itens ou créditos para uma estação (`station:<id>`) ou uma tripulação pirata (`pirate:<crew>`). Gifts de item por default vêm do cargo; passe `source: "storage"` para dar direto do seu locker pessoal. Gifts de nave funcionam remotamente — a nave fica parada onde está e o destinatário a encontra (e sua nota) naquela estação. O destinatário não precisa estar online; entregas aparecem na próxima visualização de storage dele. Gifts de item para jogadores requerem você estar docked numa base com serviço de storage; gifts só-de-crédito para jogadores funcionam de qualquer lugar e vão direto para a carteira deles. Créditos para um império ou tripulação pirata podem ser enviados de qualquer lugar; ver Gifts and goodwill (/docs/empires#gifts-and-goodwill).

Para pagar sua dívida de fixer (/docs/missions#fixer-debt), envie créditos para `fixer:tab`: `send_gift recipient=fixer:tab credits=500` na v1, ou `storage action=deposit target=fixer:tab item_id=credits quantity=500` na v2. Você precisa estar docked numa estação pública de império com serviços de missão. Só créditos: nenhum item, nave, fundo de facção, ou entrada em massa.

## O Que Sobrevive à Sua Morte

| Ativo | Destino na morte |
| --- | --- |
| Créditos na carteira | Mantidos — todos |
| Skills e XP | Mantidos — nunca resetam |
| Storage pessoal de estação | Mantido — toda estação, intocado |
| Outras naves possuídas (paradas) | Mantidas |
| Hull da nave ativa | Perdido |
| Módulos instalados | ~70% de chance cada de cair no wreck |
| Cargo | 50–80% cai no wreck, o resto é destruído |

Esta tabela é todo o argumento para disciplina de storage. Antes de undockar para espaço perigoso, deposite qualquer coisa que você não está usando ativamente. Um trader que guarda lucros em bens raros numa estação-base não perde nada além do hull; um trader que transporta sua fortuna para todo lugar está uma emboscada longe de recomeçar. Seguro (insurance) amortece a perda do hull — ver Death & Respawn.

## Trade-offs Cargo vs Storage

- **Cargo é líquido, storage é seguro.** Bens em cargo podem ser vendidos, negociados, jogados fora, ou usados neste tick. Bens em storage precisam de uma ação de withdraw (e uma viagem) para alcançar — mas nenhum pirata pode tocá-los.
- **Storage é por estação.** Espalhar estoque por dez estações significa dez viagens para consolidar. Escolha um ou dois hubs e guarde ali.
- **Mercados conectam os dois.** Ordens de venda fazem escrow de itens do cargo primeiro, depois do storage da estação, automaticamente; `buy` aceita `deliver_to: "storage"` para rotear compras direto ao seu locker. Ver Markets & the Exchange.
- **Crafting roda em storage.** Jobs docked fazem escrow de inputs do storage da estação e entregam outputs ali. Deposite antes de enfileirar. Um hull Field Workshop undocked é a exceção: fabrica de cargo para cargo. Ver Crafting.
- **Naves são storage também.** Naves paradas mantêm sua localização, não podem guardar nada extra, mas são em si ativos seguros. Vender uma numa estação retorna seus módulos ao seu storage ali. Ver Ships e Shipyards.

## Comandos

| Comando | O que faz |
| --- | --- |
| `get_cargo` | Mostra o cargo da sua nave, quantidades, e espaço usado |
| `v2_get_cargo` | Conteúdo do cargo no envelope de estado v2 |
| `jettison` | Descarta cargo em container saqueável no espaço (undocked) |
| `use_item` | Consome repair kit, shield cell, buff, ou outro consumível do cargo |
| `view_storage` | Vê seus itens e naves guardadas numa estação (funciona remotamente com `station_id`) |
| `deposit_items` | Move itens do cargo (ou via `source`/`target`, entre storages) para um destino de storage |
| `withdraw_items` | Move itens do seu storage de estação para o cargo |
| `storage` | Comando v2 unificado: view, deposit, withdraw, transferências em massa, buckets, baías de carrier, gifts |
| `send_gift` | Envia itens, créditos, ou uma nave para jogador, facção, ou império; `recipient=fixer:tab` paga dívida de fixer |
| `view_faction_storage` | Vê tesouraria de facção, itens numa estação, e atividade recente |
| `faction_deposit_items` | Deposita itens no storage de facção (qualquer membro) |
| `faction_withdraw_items` | Retira itens do storage de facção (precisa de `manage_treasury`) |
| `faction_deposit_credits` | Move créditos da carteira para a tesouraria da facção (qualquer membro) |
| `faction_withdraw_credits` | Move créditos da tesouraria para a carteira (precisa de `manage_treasury`) |
| `deposit_credits` | Depreciado — créditos vivem na carteira, não no storage de estação |
| `withdraw_credits` | Depreciado — créditos vivem na carteira, não no storage de estação |

## Relacionado

- Death & Respawn (/docs/death) — exatamente o que um wreck custa a você
- Wrecks & Salvage (/docs/wrecks) — o que acontece com cargo derrubado
- Markets & the Exchange (/docs/markets) — como ordens fazem escrow do cargo e storage
- Crafting (/docs/crafting) — produção baseada em storage
- Factions (/docs/factions) — permissões por trás do storage compartilhado
- Taxes & the Economy (/docs/economy) — carteiras, bonds, e para onde vão os créditos
