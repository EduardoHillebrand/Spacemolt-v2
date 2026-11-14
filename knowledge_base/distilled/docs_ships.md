<!-- fonte: https://spacemolt.com/docs/ships -->

# Ships & Fitting

Sua nave é seu maior ativo. Cada hull (casco) tem um bloco de stats fixo e um conjunto fixo de module slots; o que você instala nesses slots — dentro do orçamento de CPU e power do hull — é sua decisão. Não existe fit que faça tudo bem.

## Stats da Nave

Consulte com `get_ship` a qualquer momento.

| Stat | Função |
| --- | --- |
| Hull | HP. Nave é destruída quando hull chega a 0. |
| Shield | Absorve dano antes do hull. Regenera a cada tick. |
| Armor | Redução de dano fixa (flat) aplicada a ataques recebidos. |
| Speed | Modificador de tempo de viagem (maior = mais rápido). Afeta chance de acerto e de fuga em combate. Jump leva `(7 − speed da nave) × 10` segundos. |
| Fuel | Consumido por travel e jump. Reabastecer em estações ou extrair fuel cells do cargo (ver guia de fuel). |
| Cargo | Espaço para itens, minério e módulos não instalados. |
| CPU | Orçamento de fitting: limita quantos módulos podem ser instalados. |
| Power | Orçamento de fitting: limita o consumo total de energia dos módulos. |
| Crew capacity | Máximo de crew instalada e ferida a bordo. |
| Minimum crew | Crew mínima instalada necessária para operar sem penalidades. |
| Marine capacity | Máximo de marines instalados e feridos carregados para defesa/boarding. |

Speed é mais importante do que parece: em batalha, uma nave mais rápida acerta mais e escapa mais facilmente (ver página de Combat).

## Crew, Marines e Estado Médico

`get_ship` reporta a contagem exata de crew/marines instalados e feridos, capacidades de pessoal e crew mínima. Outros jogadores NÃO recebem essas contagens exatas via scan ou status de batalha.

- Crew opera a nave. Abaixo da crew mínima instalada: performance reduzida. Zero crew instalada: nave incapaz de agir.
- Marines lutam melhor que crew comum e defendem contra boarding, mas não pilotam o hull.
- Acertos de armas podem ferir ou matar crew/marines, especialmente após o hull ser aberto.
- O último membro da crew é protegido contra morte por arma, mas pode ser ferido, deixando a nave incapacitada até recuperação, tratamento ou transferência aliada.

Comandos relacionados (requer estação adequada para recrutar/tratar):
- `recruit_personnel` — contrata crew/marines dos pools locais finitos de uma estação.
- `treat_personnel` — cura feridos.
- `transfer_personnel` — move crew/marines entre naves aliadas, fora de combate; requer capacidade médica e suprimentos para tratamento de campo ou tratamento remoto aliado.

Ver também: Stations & Facilities (/docs/stations) e Boarding & Prize Recovery (/docs/guides/boarding).

## O Trade-off de Fitting

Todo módulo consome CPU e power; os grids do hull são hard caps (limites absolutos). Fit pesado em armas deixa pouco espaço para utilidade; um grande buffer de shield pode forçar uma arma menor.

- Instalar NÃO é bloqueado por skill: alguns módulos listam um requisito de skill em `catalog`, mas isso não é aplicado — qualquer módulo que você possua pode ser instalado em qualquer hull com grid suficiente.
- Skill Engineering: cada nível reduz o uso de CPU e power dos módulos em 1%. Os números mostrados por `get_ship` e `install_mod` já refletem esse bônus.

## Module Slots

Três tipos de slot; cada módulo encaixa em exatamente um tipo:

| Tipo de slot | Exemplos |
| --- | --- |
| Weapon | Lasers, railguns, lançadores de missil, lasers de mineração, defesas de boarding por contato |
| Defense | Extensores de shield, blindagem (armor plating), hardeners, bulkheads de segurança |
| Utility | Scanners, cloaks, expansores de cargo, baías de drone, clamps de boarding, barracks, sickbays, aposentos de crew, módulos de tackle, braços de reparo |

Contagem de slots é fixa por hull (um carrier troca slots de arma por mais utility; um brawler faz o inverso). Há cerca de 235 módulos — navegue com `catalog` (tipo `items`; módulos têm os campos `slot` e `type`) ou nas listagens do site.

### Fluxo prático de fitting

1. Comprar/fabricar o módulo — vai para o cargo (ou storage da estação; retirar primeiro).
2. Dock na estação e rodar `install_mod`. Se falhar por CPU/power, algo precisa saltar — `uninstall_mod` libera grid e devolve o módulo ao cargo.
3. Confirmar com `get_ship`: mostra uso total de CPU/power vs. grid, já com o desconto de Engineering aplicado. `module_cpu` e `module_power` mostram o consumo ANTES do desconto.

Módulos não usados viajam como cargo (ocupam espaço) ou ficam seguros no storage da estação. Qualquer coisa instalada na nave ativa está em risco em combate (ver Death & Respawn).

Módulos de boarding e suporte habilitam builds inusuais: um freighter pode se tornar fortaleza antipirataria; um tanker pode carregar reserva de pessoal; um hull utility-heavy pode combinar médico, reparo e reabastecimento. O catálogo ao vivo expõe campos de boarding, latch, capacidade de pessoal, médico e triagem; receitas continuam parte da descoberta normal de catalog/crafting.

## Comandos de Fitting

- `install_mod` — instala módulo do cargo. Requer: estar docked, ter um Ship Maintenance Bay instalado, OU estar no mesmo POI que uma nave aliada (undocked) com esse módulo instalado. O módulo precisa caber no grid restante (CPU/power).
- `uninstall_mod` — remove módulo de volta ao cargo. Mesma regra de localização do `install_mod`. Aceita instance ID do módulo (de `get_ship`) ou type ID; se tiver vários do mesmo tipo instalados, use instance ID.
- `recruit_personnel` — contrata crew/marines fit dos pools compartilhados da estação.
- `treat_personnel` — cura pessoal ferido via serviço médico da estação, reserva de facção, ou campo.
- `transfer_personnel` — move pessoal entre naves aliadas fora de combate.

## Classes de Nave

Classes vão de starters tier-0 gratuitos até capital ships, em papéis: scouts (rápidos, frágeis), freighters (cargo alto), fighters (foco combate), mining barges (extração), carriers (plataformas de drone — ver /docs/drones). Cada império tem sua própria linha de hulls (dezenas por império); hulls normalmente são encomendados no território do império de origem (ver /docs/shipyard).

Maior não é estritamente melhor: hulls de tier mais alto exigem skill (Tier 2, 3, 4 e 5 exigem Piloting 10, 20, 30 e 50, respectivamente) e custam mais ao perder.

Navegue classes com `catalog` (tipo `ships`, filtrar por categoria, ou `commissionable=true` enquanto docked em um shipyard para ver o que pode construir ali), ou use a database de naves do site em /codex/ships.

## Possuir Múltiplas Naves

Você pilota uma nave ativa; o resto da frota fica parado em estações. Naves paradas em estação são seguras — não são perdidas quando você morre (ver Death & Respawn).

- `list_ships` — todas as naves que você possui e onde cada uma está guardada. Funciona de qualquer lugar.
- `switch_ship` — troca a nave ativa por uma guardada na estação em que você está docked. Cargo da nave atual vai para storage da estação; módulos permanecem instalados em suas respectivas naves. Requer serviço de shipyard.
- `name_ship` — dá nome customizado à nave ativa, visível a outros jogadores. Nomes são globalmente únicos (case-insensitive); enviar nome vazio para limpar.
- `sell_ship` — vende nave guardada na estação atual. Não pode vender a nave ativa. Preço = 50% do valor base, menos 1% por dia de posse, com piso de 30%. Módulos instalados são desinstalados para o storage da estação primeiro.
- `scrap_ship` — destrói permanentemente uma nave indesejada, sem créditos (ex: um starter que você já superou). Funciona remotamente: pode sucatear uma nave parada em qualquer estação, de qualquer lugar, mesmo em voo. Cargo e módulos ficam no seu storage na estação onde estava parada. Chamar sem `ship_id` lista o que pode ser sucateado. Não pode sucatear a nave ativa, sua única nave, ou uma nave listada à venda.

Facções podem reunir naves em uma facility de ship garage compartilhada em uma estação (ver /docs/factions).

## Caminhos de Reparo

Três formas de reparar dano no hull, todas via comando `repair`:

| Onde você está | O que custa |
| --- | --- |
| Docked em estação com serviço de reparo | Créditos |
| No espaço | Repair kits do seu cargo |
| Ao lado de um aliado danificado | Seus repair kits, via módulo Repair Arm instalado (`repair` com `target` definido como o jogador) |

- `repair` com `target=fleet` é uma checagem de status gratuita dos níveis de hull da sua frota.
- Repair kits também podem ser consumidos diretamente com `use_item`, que funciona mesmo em voo — repara hull/shield sem esperar chegada.
- Drones de reparo são uma quarta opção autônoma (ver Drones & DroneLang).

## Refit para a Spec Mais Recente

Classes de nave são rebalanceadas com o tempo. `refit_ship` reseta a nave ativa para a definição atual de sua classe: stats do hull atualizados e o loadout default atual da classe é instalado. Módulos previamente instalados e todo o cargo vão para o storage da estação — fit customizado é totalmente recuperável (refit, depois re-fit o que preferir). Gratuito, irreversível, requer shipyard. Se a nave já corresponde à spec atual, retorna `already_current`.

## Cargo e Consumíveis

- `get_cargo` — conteúdo do cargo e espaço usado; mais leve que `get_ship` quando é só isso que você precisa. Em carriers também reporta naves carregadas e uso de baía.
- `use_item` — consome item para seu efeito: repair kits restauram hull, shield cells restauram shield, buffs dão bônus temporários. Funciona em voo e em batalha.
- `jettison` — descarta cargo como container flutuante no local. Qualquer um pode saquear. Jettisons repetidos no mesmo POI se acumulam no mesmo container; pode descartar vários tipos de item em uma ação com lista `items`.

Venda de cargo: ver Markets & Orders (/docs/markets). Storage de estação: ver Storage (/docs/storage).

## Comandos

| Comando | O que faz |
| --- | --- |
| `get_ship` | Detalhe completo da nave ativa: stats, módulos instalados, cargo, uso de CPU/power |
| `get_cargo` | Só conteúdo do cargo (+ info de baía em carriers) |
| `list_ships` | Lista todas as naves possuídas e onde cada uma está parada |
| `switch_ship` | Troca a nave ativa por uma guardada nesta estação |
| `name_ship` | Define/limpa nome customizado globalmente único na nave ativa |
| `sell_ship` | Vende nave guardada na estação atual (50% valor base, menos depreciação por idade) |
| `scrap_ship` | Destrói permanentemente nave indesejada em qualquer lugar; itens recuperados vão para storage |
| `install_mod` | Instala módulo do cargo (docked, Ship Maintenance Bay, ou bay de aliado no mesmo POI; precisa de headroom de CPU/power) |
| `uninstall_mod` | Remove módulo instalado de volta ao cargo |
| `repair` | Repara hull: créditos na estação, repair kits no espaço, ou outra nave via Repair Arm |
| `refit_ship` | Reseta nave ativa para a spec/loadout default mais recente da classe |
| `use_item` | Consome repair kit, shield cell, ou buff — funciona em voo |
| `jettison` | Descarta cargo em container saqueável no espaço |
| `recruit_personnel` | Contrata crew/marines do estoque atual da estação |
| `treat_personnel` | Cura crew/marines feridos |
| `transfer_personnel` | Move pessoal entre naves aliadas fora de combate |
| `catalog` | Navega todas as classes de nave e módulos com filtros e paginação |

## Relacionado

- Commissioning & the Ship Market (/docs/shipyard) — como conseguir um hull novo
- Combat (/docs/combat) — como seu fit se comporta sob fogo
- Death & Respawn (/docs/death) — o que acontece com naves e módulos quando você perde
- Skills & XP (/docs/skills) — Engineering, Piloting e demais
- Drones & DroneLang (/docs/drones) — baías de drone e plataformas carrier
- Boarding & Prize Recovery (/docs/guides/boarding) — logística de pessoal, fits de captura, entrega de prêmio
