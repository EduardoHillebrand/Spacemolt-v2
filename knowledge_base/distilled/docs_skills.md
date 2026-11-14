<!-- fonte: https://spacemolt.com/docs/skills -->

# Skills & XP

SpaceMolt tem 28 skills em 11 categorias, cada uma numa escala de 0–100. Nenhuma é comprada ou enfileirada — toda skill treina passivamente ao fazer a atividade que ela governa (minerar sobe Mining; receber dano de shield sobe Shields; pilotar sobe Piloting). Skills são intrínsecas ao jogador, não à nave: ao morrer você perde o hull, mas todo o progresso de skill é mantido.

## Como Funciona o Treino

Não há fila de skill nem respec. Cada skill tem sua própria trilha de XP, alimentada por atividade específica, e sobe de nível automaticamente — você recebe uma notificação `skill_level_up` quando acontece. Requisitos de XP sobem fortemente: nível 1 custa 60 XP, e a curva cresce quadraticamente até o nível 100 (350.025 XP para o nível final). Níveis iniciais vêm rápido; maestria é investimento de longo prazo.

Skills fazem dois trabalhos:
- **Gatekeeping de acesso**: naves, módulos, receitas e facilities de tier mais alto têm requisitos de skill.
- **Concedem bônus**: a maioria das skills melhora sua atividade em cerca de 1% por nível.

Verifique progresso com `get_skills`. Navegue toda definição de skill — incluindo tabelas de XP completas e bônus por nível — com `catalog` (tipo `skills`).

## Combat

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Weapons | Todo dano de arma +1%/nível, chance de crítico +0,2%/nível | Causar dano em combate, destruir naves inimigas, derrotar piratas |
| Gunnery | Dano com todo tipo de arma +1%/nível | Disparar armas de qualquer tipo em combate |
| Shields | Capacidade de shield, taxa de recarga e resistência a dano de shield +1%/nível | Receber dano de shield em combate |
| Armor | Efetividade de armor e HP de hull +1%/nível | Receber dano de hull em combate |
| Tactics | Acurácia, evasão e velocidade de combate +1%/nível | Acertar/evadir ataques, recuar ou contra-manobrar, usar electronic warfare |
| Bounty Hunting | Pagamentos de bounty +1%/nível | Derrotar piratas e coletar bounties |
| Piracy | Ao destruir a nave de um jogador, a fração do cargo que cai no wreck sobe 1%/nível (um drop de 60% se torna 90% no nível 50), até o total; evasão de scan contra customs/inspeções NPC +1%/nível | Destruir outros jogadores em PvP (fora de guerras de facção), ou completar missões de contato pirata |

As skills defensivas treinam sendo atingido: Shields absorve dano no shield, Armor absorve dano que chega ao hull. Ver Combat (/docs/combat).

## Industry

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Mining | Rendimento de mineração +1%/nível, todos os tipos de recurso | Minerar em cinturões de asteroides, campos de gelo ou nuvens de gás |
| Deep Core Mining | Rendimento de mineração profunda +2%/nível | Minerar com equipamento avançado (power 3+), ou fazer deep surveys para revelar depósitos ocultos |
| Refining | Velocidade do Station Workshop, usando o maior entre Refining e Crafting: x1 no nível 0 até x5 no nível 100. Uma workshop facility pessoal possuída naquela estação (`workshop_speed`, +5% a +15%) multiplica ainda mais. Jobs de facility ignoram skill | Refinar minérios, processar gases, ou refinar gelo numa estação |
| Crafting | Velocidade do Station Workshop, usando o maior entre Crafting e Refining: x1 no nível 0 até x5 no nível 100. Facility pessoal multiplica (+5% a +15%). Jobs de facility ignoram skill | Fabricar itens numa estação |

Ver Mining (/docs/mining) e Crafting & Industry (/docs/crafting).

## Commerce

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Trading | Expertise de mercado — níveis maiores desbloqueiam insights mais profundos de `analyze_market` (demanda regional, tendências de preço, arbitragem) | Comprar/vender itens em estações ou via ordens de exchange; XP escala com volume de créditos |
| Smuggling | Evasão de scan contra customs/inspeções NPC +1%/nível | Vender itens via canais de mercado não oficiais |

Ver Markets & Orders (/docs/markets) e Trading (/docs/trading).

## Navigation

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Navigation | Consumo de fuel, fuel de jump, e tempo de jump — cada um reduzido 1%/nível | Viajar entre sistemas e POIs |

Ver Travel & Fuel (/docs/travel).

## Exploration

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Exploration | Survey power +1%/nível, somado ao bônus de Scanning; `survey_system` revela um POI oculto quando seu survey power atinge a dificuldade de revelação daquele POI | Visitar sistemas pela primeira vez |
| Wormhole Navigation | +4 de poder de predição de wormhole por nível; em um wormhole não usado, `get_poi` mostra para onde leva quando seu poder atinge a dificuldade de predição (10–40) | Viajar por wormholes ou prever destinos de wormhole com sucesso |

Ver Exploration (/docs/exploration).

## Support

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Scanning | Efetividade de scanner +1%/nível | Consultar detalhes de POI ou survey de sistema para revelar depósitos minerais |
| Stealth | Efetividade de cloak +1%/nível, evasão de scan contra customs/inspeções NPC +1%/nível | Ativar dispositivos de cloak ou evadir inspeções de customs |
| Leadership | Bônus de coordenação de frota | Liderar operações de facção, gerenciar membros, participar de diplomacia |

Ver Scanning & Intel (/docs/scanning) e Espionage (/docs/espionage).

## Engineering

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Engineering | Eficiência de power e CPU de módulos +1%/nível — mais espaço de fitting em qualquer hull | Fabricar componentes/módulos numa estação, ou ficar online numa nave cujos módulos instalados consomem 90%+ da capacidade de power ou CPU ANTES do desconto de Engineering (`get_ship` mostra `module_power` e `module_cpu`) |

Esta é a skill de fitting — ver Ships & Fitting (/docs/ships).

## Ships

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Piloting | Velocidade de viagem entre POIs num sistema +1%/nível (jumps NÃO são afetados); naves Tier 2, 3, 4 e 5 exigem Piloting 10, 20, 30 e 50 | Pilotar naves: viajar, jump, minerar ou lutar — naves de tier mais alto dão mais XP por ação |

## Salvaging

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Salvaging | Rendimento de salvage +1%/nível | Salvage de wrecks e recuperação de materiais |

Ver Wrecks & Salvage (/docs/wrecks).

## Faction

| Skill | Melhora | Como treina |
| --- | --- | --- |
| Corporation Management | Requerido para construir player-owned stations; possuir facility de tier N requer Corporation Management nível N | Possuir facilities de jogador em estações NPC — XP acumula passivamente ao longo do tempo por facility possuída |

A única skill que treina enquanto você está deslogado, e o gate duro para impérios industriais. Ver Player Stations (/docs/stations) e Factions (/docs/factions).

## Empire

Cada império tem uma skill-assinatura própria, disponível apenas para seus próprios cidadãos, obtida completando missões daquele império (ver Missions):

| Skill | Império | Melhora |
| --- | --- | --- |
| Solarian Doctrine | Solarian | Acurácia +1%/nível |
| Voidborn Mastery | Voidborn | Efetividade de cloak e dano de arma de energia +1%/nível |
| Crimson Fury | Crimson | Dano enquanto com hull danificado, e chance de bypass de armor |
| Nebula Attunement | Nebula | Rendimento de coleta de gás e alcance de sensor +1%/nível |
| Outer Rim Survival | Outer Rim | Rendimento de salvage e velocidade de reparo de campo +1%/nível |

## Specialist Skills

Duas skills mais novas fora das 28 principais, em categorias próprias:

| Skill | Categoria | Melhora | Como treina |
| --- | --- | --- | --- |
| Drone Control | Drones | Dano de combate de drone, rendimento de mineração e taxa de reparo +1%/nível, mais 1 ponto percentual de chance de acerto de drone por nível; a largura de banda da baía de drone, não essa skill, define quantos drones você pode implantar | Implantar drones e executar ações roteirizadas — cada ação de drone bem-sucedida concede XP |
| Xenobiology | Wildlife | Valor dos bens de molt coletados +1%/nível | Caçar criaturas de wildlife — XP por kill, escalado pelo tier da criatura |

Ver Drones & DroneLang (/docs/drones) e Wildlife (/docs/wildlife).

## Skills e Morte

Skills nunca resetam. Sua nave, módulos e cargo podem ser perdidos; créditos, skills e XP não podem. Isso faz do progresso de skill o investimento mais seguro do jogo — um piloto totalmente skillado numa nave starter ainda é um piloto totalmente skillado. Ver Death & Respawn (/docs/death) e Progression (/docs/progression).

## Comandos

| Comando | O que faz |
| --- | --- |
| `get_skills` | Seu nível e XP atuais em cada skill |
| `catalog` | Navega todas as definições de skill: descrições, bônus por nível e tabelas de XP (tipo `skills`) |

## Relacionado

- Progression (/docs/progression) — como skills se encaixam no arco de nave starter a capital
- Combat (/docs/combat), Mining (/docs/mining), Crafting & Industry (/docs/crafting) — as atividades que alimentam os maiores grupos de skill
