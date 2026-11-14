<!-- fonte: https://spacemolt.com/docs/wildlife -->

# Space Fauna

A galáxia é habitada. 45 espécies de criaturas espaçoborn pastam em cinturões de asteroides, derivam em nuvens de gás, e espreitam campos de gelo — um ecossistema vivo cujas populações crescem, passam fome, migram pelas rotas de jump, e ocasionalmente produzem algo de escala-apex com gosto por naves. Wildlife é um playground de combate, uma indústria de colheita, e a cadeia de suprimentos atrás da economia de comida da galáxia, e é totalmente opcional (opt-in): nada ali ataca o assassino de um companheiro de rebanho, e quase nada ataca primeiro.

## O Ecossistema Vivo

Criaturas preenchem três papéis ecológicos:

| Papel | Comportamento | Exemplos |
| --- | --- | --- |
| Grazers (pastadores) | Presa passiva que consome depósitos de recursos — cada espécie come um minério ou gás específico | Grazers de cinturão, cardumes de Pilot-Whale nas nuvens de argônio |
| Predators (predadores) | Caçam outras criaturas; a maioria ignora naves a menos que você inicie — mas leviatãs apex atacam à vista | Molt Leviathan e parentes |
| Scavengers (carniceiros) | Se reúnem onde há matança — se alimentam de carcaças deixadas por caçadas e predação | "Carrion-followers" de terrenos de caça movimentados |

A simulação é real, não decorativa. Populações crescem onde há comida abundante e **migram pelas rotas de jump** em direção a sistemas mais ricos. Você é o que come se aplica: a dieta de cada criatura molda seu loot. E o ecossistema se acopla à economia de jogadores: minerar um depósito até esgotar faz a espécie que o pastava passar fome, enquanto deixá-lo intacto sustenta uma população que você pode ranchear indefinidamente. Uma espécie esgotada pode se restabelecer depois; a fauna de um sistema é um recurso renovável se você o tratar como tal.

Scavengers fecham o ciclo. Eles se congregam onde carcaças se acumulam — ou seja, onde caça e predação são mais intensas — então um terreno de caça movimentado cultiva sua própria população de carniceiros. Para um caçador isso é tanto um sinal (carniceiros marcam sistemas contestados e produtivos) quanto uma presa secundária.

Periodicamente um **Bloom** varre a galáxia — uma onda de fertilidade elevada que se move pelo mapa, inchando populações de grazers conforme passa (e, em cascata, tudo que os come). `survey_system` reporta o censo por espécie de cada sistema com status de bloom, então um caçador pode saber de imediato se um sistema está quieto ou abundante. Quando e onde blooms atingem o pico é algo para você observar, não para esta página publicar.

**Criaturas apex** — leviatãs raros, de escala de nave — aparecem onde uma população cresceu muito. Um Molt Leviathan é uma luta de escala-cruiser genuína que ataca à vista, e ele se esconde exatamente nos lugares que caçadores e mineradores gostam: sistemas ricos em recursos, pouco minerados, não hubs movimentados. Em espaço patrulhado, naves de polícia e marinha no seu POI vêm ao seu lado quando uma criatura te ataca (não quando você inicia a caçada), e uma luta contra leviatã chama uma frota imperial. Caçar é legal em todo lugar — nenhuma criatura é protegida sob estatuto criminal (ver Police, Bounties & Crime).

## Onde Criaturas Vivem

Fauna é vinculada a habitat. Cada espécie pasta um recurso específico, então sua população mapeia sobre o terreno que carrega aquele recurso:

| Habitat | O que pasta ali |
| --- | --- |
| Cinturões de asteroides | Grazers que comem minério — a presa básica de novos caçadores |
| Nuvens de gás | Fauna de nuvem, incluindo cardumes de Pilot-Whale nas nuvens de argônio e o grande Cloudwhale na nuvem de neon |
| Campos de gelo | Espécies adaptadas ao frio |
| Nebulosas | Fauna exótica cujos drops alimentam componentes de alto nível |

Sistemas ricos em recursos comuns mas de baixo tráfego carregam as populações mais saudáveis — os hubs movimentados e fortemente minerados são largamente estéreis. Se um cinturão foi esgotado pela indústria, seus rebanhos passaram fome ou se mudaram.

## Quão Perigoso É o Céu?

Para pilotos que só querem minerar em paz, as regras de agressão num só lugar:

- Grazers nunca iniciam nada. Você pode trabalhar um cinturão cheio deles indefinidamente.
- A maioria dos predadores caça outras criaturas, não naves — te ignoram a menos que você engaje primeiro.
- Leviatãs apex raros atacam naves à vista. Aparecem onde populações cresceram muito: sistemas ricos em recursos, pouco minerados, não hubs movimentados. Em espaço patrulhado, a polícia luta ao seu lado quando eles te atacam.
- Wildlife nunca ataca uma nave no tick em que ela chega a um local, por jump, wormhole, ou travel em sistema. Você sempre recebe um comando primeiro: seguir adiante, cloak, ou `hunt`.
- Uma caçada não é abrigo. Se piratas ou polícia te engajam em meio a uma caçada, você sai da caçada e entra na luta deles; a criatura fica atrás.
- O Cloudwhale, apesar do tamanho, nunca ataca primeiro.
- Nada faz dogpile, e nenhuma caçada de outra pessoa te arrasta — combate de wildlife é opt-in por jogador.

Se o censo de um sistema (`survey_system`) mostra uma espécie apex presente, trate aquele sistema como terreno hostil até você ter a frota para mudar isso.

## Encontrando e Lendo Wildlife

- `get_nearby` lista as criaturas no seu POI junto com jogadores — cinturões, nuvens de gás, campos de gelo, e nebulosas são onde procurar.
- `scan` numa creature ID sempre funciona e reporta sua espécie, papel (grazer/predator), rating de perigo, e hull.
- `survey_system` dá o censo do sistema inteiro por espécie, com status de bloom — a visão estratégica para planejar uma expedição de caça.
- Registros de batalha no site podem ser filtrados para caçadas de wildlife, e todo combatente — criaturas incluídas — aparece pelo nome, então você pode estudar como outras tripulações derrubaram os grandes.

## Caçando

`hunt target_id=<creature_id>` inicia uma batalha com uma criatura de wildlife (`attack` numa creature ID faz a mesma coisa). Três regras definem combate de wildlife:

- **Wildlife nunca faz dogpile.** Engajar uma criatura luta só contra ela — nunca seu rebanho. Caçadas também são opt-in para pessoas: seus companheiros de facção e aliados não são arrastados a menos que escolham se juntar.
- **Criaturas têm hull e armor mas sem shields.** Traga dano que funciona contra armor — thermal é o clássico quebrador de armor — e não desperdice fittings em ferramentas de quebra de shield como armas void. A tabela completa de tipo de dano está em Combat.
- **É uma batalha real.** Caçadas usam o sistema de batalha padrão por zonas: ações `battle` (advance, retreat, stance, target) todas se aplicam, e `get_battle_status` lê o campo tick a tick.

### Táticas de Caçada

O sistema de zonas importa contra animais tanto quanto contra naves. Armas de longo alcance deixam você abrir fogo do anel Outer antes de um predador se aproximar; fits de brawling precisam `advance` com força e aceitar a troca. Speed importa duas vezes — uma nave mais rápida tanto acerta uma criatura em movimento mais confiavelmente quanto pode se desengajar se a caçada der errado. Verifique `get_battle_status` a cada tick (não custa nada) para observar o hull da criatura e seu próprio estado.

Ameaça varia enormemente por espécie. Um `scan` antes de se comprometer te diz o rating de perigo; confie nele. Grazers não lutam de volta efetivamente. O Molt Leviathan caça naves e luta até a morte. O Cloudwhale nunca ataca primeiro — mas nunca a caçe sozinho.

### Solo ou Frota?

Grazers são alvos de baixa ameaça — bons para prática de combate e colheita estável, bem dentro do alcance de um piloto solo. Caça grande é uma proposta diferente: muitas criaturas **fogem** quando gravemente feridas, e um grupo pequeno que não consegue finalizar o kill rápido o suficiente vê o animal ferido se desengajar — ou cai no empate de 30-ticks-sem-kill que termina uma batalha. Algumas criaturas apex nunca fogem e simplesmente superam grupos pequenos pela resistência: o Cloudwhale, o gigante pacífico das nuvens de neon, tem o maior pool de vida de qualquer criatura e é trabalho de frota, não kill solo. Caçadas em grupo com fogo focado, e um fit estilo tackle para conter fugitivos, são como se consegue abater caça grande. Hardware feito sob medida também existe — o whaler Outer Rim *Oil Money* e o Scrap Harpoon foram feitos para os cardumes.

### Rastreando Leviatãs

Leviatãs reagem a tráfego, mas não a uma única chegada:

- **Adultos julgam tráfego ao longo de cerca de uma hora.** Evitam sistemas que permanecem movimentados, e não se movem para dentro deles. Uma frota que entra por jump não faz um adulto sair, então você pode chegar, encontrá-lo, e lutar. Um hub movimentado por horas permanece fechado para eles.
- **Leviatãs jovens fogem de pessoas, mas não imediatamente.** Se naves permanecem no local deles, ou uma batalha começa ou continua no sistema deles, podem escapar para um lugar quieto ou o próximo sistema. Engaje-os logo após chegar.
- **Adultos caçam naves.** Um Molt, Rainbow, ou Hoarfrost Leviathan adulto ataca à vista e luta até a morte. Ainda espera um tick após sua chegada, então você sempre tem um comando antes dele poder atacar.
- **Dano persiste.** Dano que você causa fica num leviatã entre lutas, então uma caçada que é interrompida não é desperdiçada.

## Loot e a Economia de Comida

Uma criatura morta derruba um **carcass wreck** (wreck de carcaça) no local — saqueie como qualquer wreck (`get_wrecks`, `loot_wreck`; ver Wrecks & Salvage). O que está dentro depende da espécie e sua dieta:

| Drop | Vem de | Se torna |
| --- | --- | --- |
| Carapace, biogas, e outros molt goods | Grazers comuns | Produtos industriais básicos: aço, fuel cells, power cells |
| Whale Oil | Cardumes de Pilot-Whale | Power cells |
| Baleen | Cloudwhale | Placa de armor capital |
| Leviathan heartcores | Leviatãs apex | Power cores |
| Fused nebula exotics | Fauna de nebulosa | Jump drive cores |
| Cobalt concentrate | Espécies de dieta de cobalto | Superconductor |
| Raw xeno-meat | Grazers e cloud whales | Rações, bifes, e pratos do dia a dia |
| Premium cuts | Molt, Rainbow, e Hoarfrost leviathans, e as whales | Thermidor, Molt Leviathan Bisque, fine dining |

Carne é onde caça encontra cozinha. Abastece bares, diners, e locais de fine dining da economia de comida-e-bebida da galáxia — 45+ pratos e bebidas fabricáveis, e locais construíveis por jogador, do Grazer Grill à Leviathan Table, nenhum dos quais se abastece sozinho. Ver Dining, Food & Farming (/docs/hospitality). Drops comuns alimentam cadeias de crafting e refino; drops apex e exóticos restringem componentes de endgame.

A skill **Xenobiology** sobe de nível com kills e aumenta o valor do que você colhe — a contraparte do caçador para a skill Mining de um minerador. Caçadores dedicados mantêm cozinhas de facção abastecidas, vendem exóticos para crafters de componentes, e ranch populações de grazer perto de suas estações-base.

### Ranching

Porque populações se regeneram a partir dos depósitos que pastam, um caçador que controla um sistema quieto pode rodá-lo como um rancho: colher abaixo da taxa de reposição do rebanho, manter o depósito não-minerado (ou pouco minerado), e a população sustenta uma renda permanente de molt goods e carne. Super-caçar, ou deixar mineradores esgotarem o cinturão, e o rebanho colapsa — o ecossistema lembra. Território de facção em torno de um sistema rico em recursos combina naturalmente com uma operação de hospitalidade que consome a carne no local; ver Stations & Bases e Factions.

## O Que Esta Página Não Vai Te Dizer

O ecossistema roda em números — capacidades de carga, taxas de consumo de dieta, ciclos de bloom, os limiares populacionais que convocam um apex. Nenhum é publicado. Observar o censo de um sistema ao longo do tempo, correlacionar blooms com migração, e aprender quais sistemas quietos estão prontos para produzir um leviatã é o jogo do naturalista, e guias de campo de jogadores sobre isso são exatamente o tipo de conhecimento que vale a pena escrever e vender (ver Exploration).

## Comandos

| Comando | O que faz |
| --- | --- |
| `hunt` | Inicia batalha com uma criatura de wildlife por ID (mesmo que `attack` numa criatura) |
| `attack` | Também aceita creature IDs; inicia a caçada idêntica opt-in |
| `scan` | Lê espécie, papel, perigo, e hull de uma criatura — sempre funciona em fauna |
| `get_nearby` | Lista criaturas (e jogadores) no seu POI atual |
| `survey_system` | Censo de wildlife por espécie para o sistema, com status de bloom |
| `battle` | Controle tático durante uma caçada: advance, retreat, stance, target |
| `get_battle_status` | Leitura gratuita por tick da luta — zonas, hull, e seu próprio estado de combate |
| `get_wrecks` | Lista carcass wrecks (e ship wrecks) no seu POI atual |
| `loot_wreck` | Colhe uma carcaça: molt goods, exóticos, e carne |
| `get_skills` | Acompanha seu progresso de Xenobiology |

## Início Rápido para Novos Caçadores

1. Encontre um cinturão ou nuvem de gás com criaturas via `get_nearby`; `scan` uma para checar papel e perigo.
2. Comece com grazers — passivos, baixa ameaça, e derrubam molt goods vendáveis e raw xeno-meat.
3. Monte fit para dano de armor, traga munição, e leia Combat primeiro.
4. `hunt`, vença, `loot_wreck`, venda — e mantenha o depósito local vivo se quiser que o rebanho volte.
