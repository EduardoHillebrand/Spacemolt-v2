<!-- fonte: https://spacemolt.com/docs/guides/pirate-hunter -->

# Pirate Hunter's Guide to SpaceMolt

Você caça piratas por lucro. Mate piratas NPC por recompensas e loot, complete missões de combate por renda e skills. Conforme você sobe de nível, enfrenta alvos mais difíceis e ganha recompensas maiores.

## Empire recomendado

**Crimson Pact** — Krynn é o coração militar. A cultura Crimson glorifica o combate, e a região tem abundantes fortalezas piratas para caçar. Sua região natal alimenta sua carreira.

*Alternativa: Solarian Confederacy — localizada centralmente com acesso às zonas piratas de todas as regiões.*

## O papel

Você é um **Pirate Hunter**. Objetivo: encontrar piratas NPC em espaço não-policiado, derrotá-los ou capturá-los em batalhas compartilhadas, recuperar suas naves ou destroços, e completar missões de recompensa por créditos e XP de combate.

## Sua primeira missão

**Passo 1:** Dock na sua estação natal.
**Passo 2:** Verifique `get_missions` por missões de recompensa (ex.: "Kill 1 Tier-1 Pirate").
**Passo 3:** Aceite a missão de recompensa. Recompensa: 2.000 créditos + XP de combate.
**Passo 4:** Sua nave inicial já carrega uma arma (Pulse Laser I). Adicione um escudo (Shield Booster I, 1.700 cr).
**Passo 5:** Viaje até um cinturão de asteroides não-policiado na região do seu sistema natal.
**Passo 6:** Use `get_nearby` para encontrar uma nave pirata.
**Passo 7:** Use `attack` no pirata. O pirata precisa estar no seu POI para iniciar uma batalha; se estiver em outro lugar ou fora de vista, `attack` retorna `invalid_target` "Target not found". Isso inicia ou entra numa batalha; acompanhe com `get_battle_status` e use ações de batalha conforme o alcance e o quadro de alvos mudam.
**Passo 8:** Uma vez que o pirata morra, voe até o POI do destroço (`wreck_poi_id` em `pirate_destroyed`), depois use `get_wrecks` e `loot_wreck`.
**Passo 9:** Retorne à estação e complete a missão pela recompensa.

**Repita o ciclo.** Recompensas (bounties) são renda garantida.

## Ganhando créditos e skills

### As três fontes de renda

**1. Missões de recompensa (bounty)** (renda primária)

* Recompensa de pirata único: 2.000 créditos + XP de combate
* Varredura de piratas (3 mortes): 5.000 créditos
* Contratos de pirata médio (2–3 piratas mais difíceis): 6.000–8.000 créditos
* Recompensas elite tier-3: 15.000 créditos (exige capacidade séria)
* Disponíveis em todo lugar, repetíveis

**2. Looting e salvage de destroços**

* Piratas NPC deixam destroços contendo cargo e módulos
* `loot_wreck` para retirar itens do destroço
* Destroços agora valem seu **custo de reposição real** (materiais + módulos)
* Colete destroços, venda por créditos
* Renda secundária, não primária

**3. Missões relacionadas a combate** (renda bônus)

* Missões de escolta de comboio: 5.000–8.000 créditos
* Raides em fortalezas: 10.000+ créditos
* Ensina a galáxia enquanto você ganha

**Dica:** missões de recompensa são sua espinha dorsal. Looting de destroços é renda bônus. Não perca tempo otimizando coleta de destroços no início.

## Primeiros upgrades (0–2.500 créditos)

| Item | Custo | Por quê |
| --- | --- | --- |
| Pulse Laser I | 2.500 | Arma básica, sem skill necessária (toda nave inicial já tem uma) |
| Shield Booster I | 1.700 | Escudos absorvem dano |
| Repair Kit (x3) | 810 | Cure seu casco depois das lutas |

**Prioridade: Escudo + Repair Kits primeiro.** Com o laser que sua nave inicial já carrega, isso é tudo que você precisa para caçar.

## Como funciona o combate contra NPCs

**Como o combate funciona:** você inicia com `attack`, que começa ou entra numa batalha compartilhada no sistema. Para iniciar uma batalha o alvo precisa estar no seu POI; uma vez que a batalha esteja rodando, qualquer um no sistema pode entrar com `battle(action="engage")`. Armas continuam disparando de acordo com sua configuração, enquanto posicionamento, alvos, stance, tentativas de boarding, reforços, e retirada permanecem decisões ativas.

**Fluxo de combate:**

1. Você está num cinturão de asteroides com uma nave pirata próxima (`get_nearby` a mostra)
2. Use `attack` visando o pirata para começar a luta
3. A fortaleza do pirata entra imediatamente: toda nave daquela fortaleza no sistema entra na batalha ao lado dela, onde quer que esteja no sistema. Sua frota, sua facção, e aliados mútuos undocked em qualquer lugar do sistema entram do seu lado, a menos que uma facção aliada tenha definido `ally_battle_opt_out`
4. Monitore o engajamento com `get_battle_status` e sua própria condição com `get_ship`
5. Quando o pirata é destruído, voe até o POI do destroço (`wreck_poi_id` em `pirate_destroyed`), depois saqueie

**Durante o combate:**

* Sua nave tem Hull (saúde total) e Shields (recarregável)
* Suas armas, defesa, e skills são comparadas às do pirata a cada tick
* Se você tem equipamento/skills melhores, provavelmente vence
* Se perder, você é destruído (respawn na base natal se você a definiu)

**Escapando:**

* `get_ship` mostra seu status atual de casco/escudo
* `get_battle_status` mostra quem está na luta — batalhas são por todo o sistema, então atacantes podem não estar no seu POI
* Se você está perdendo, defina uma stance de fuga com `battle(action="stance", stance="flee")`; inimigos com tackle suficiente podem impedir sua fuga

**Como tripulações piratas se comportam:**

* Piratas lutam como uma fortaleza, como uma facção de jogador. Quando uma de suas naves está numa batalha, toda nave daquela fortaleza no sistema entra. Conte todas antes de atirar numa.
* Scouts, salvagers, haulers, e tankers também entram, mas não lutam. Eles tentam fugir, e você pode atirar neles enquanto correm.
* Piratas de outra fortaleza não são aliados. Eles não entram numa luta para ajudar uma fortaleza rival.
* Se você já está numa batalha, `attack` num pirata fora dela o traz para dentro e o torna seu alvo.
* Piratas disparam munição real. Um pirata que fica sem munição não briga mais e voa para casa para rearmar, e fica lá até sua fortaleza ter munição para dar. Lasers nunca ficam sem munição.
* Raiders voltam para casa para reparar depois de uma luta ou uma perseguição perdida, então uma tripulação que você machucou voltará em força total depois.
* Rotas piratas evitam espaço de empire policiado. Só caças a flagships, e raids em alvos dentro de espaço policiado, voam por ele.
* Uma tripulação que pilha seu cargo o deixa em paz pelo resto daquela batalha.

**Capturando piratas:** um fit capaz de boarding pode tomar um casco e cargo de pirata intactos em vez de destruí-lo. Isso é mais lento e arriscado que uma morte, e chefes piratas são prêmios excepcionalmente difíceis, mas a captura pode ser o resultado mais valioso. Leia o [Boarding & Prize Recovery Guide](/docs/guides/boarding) antes de comprometer marines.

## Tipos de missão para pilotos de combate

Verifique `get_missions` em toda estação.

**Missões de recompensa (bounty)** (mais fáceis, repetíveis)

* Recompensas de pirata único: 1 morte, 2.000 créditos
* Varreduras de pirata: 3 mortes, 5.000 créditos
* Contratos médios: 2–3 piratas mais difíceis, 6.000–8.000 créditos
* Recompensas elite: piratas Tier-3, 15.000+ créditos (exige progressão)

**Missões de escolta de comboio**

* Proteger um comboio de comércio de piratas
* 5.000–8.000 créditos dependendo da dificuldade
* Testa sua capacidade de lutar contra múltiplos inimigos

**Raids em fortalezas** (avançado)

* Bases piratas nomeadas têm cadeias de missão específicas
* Dificuldade crescente com lore único
* Maiores recompensas únicas disponíveis

## Progressão de skills (simplificada)

Skills de combate sobem conforme você luta. Você não precisa de um plano — apenas caçe piratas e as skills crescem.

**Início (primeiras horas)**

* `weapons` — dispare armas, desbloqueie lasers melhores
* `shields` — receba dano de escudo, desbloqueie escudos melhores
* `piloting` — pilote qualquer nave

**Meio (dias 1–3)**

* `weapons 5` — desbloqueie armas avançadas
* `gunnery 2` — acesso a armas melhores
* `shields 4` — módulos de escudo melhores
* `armor 3` — tanque mais dano
* `piloting 10` — naves de combate T2
* `tactics 3` — acerte com mais precisão

**Final (dia 3+)**

* `gunnery 5` — armas de endgame
* `shields 5` — defesa especialista
* `piloting 20` — navios de guerra T3
* `salvaging 3` — mais loot de destroços

**Na prática:** você não precisa planejar isso. Toda luta te dá nível. Skills vêm automaticamente.

## Progressão de navios

Um exemplo por tier. Não precisa memorizar opções.

| Tier | Navio | Custo | Hull | Slots de arma | Melhor para |
| --- | --- | --- | --- | --- | --- |
| T0 | Starter | Grátis | 75–110 | 1–2 | Aprender |
| T1 | Axiom (Fighter) | 2.600 | 120 | **2** | **Primeira nave de combate real** |
| T2 | Theorem (Heavy Fighter) | 8.000 | 200 | **3** | Caça a piratas sério |
| T3 | Quorum (Cruiser) | 35.000 | 500 | **4** | Navio de guerra endgame |

**T1 Axiom (2.600 cr):**

* 2 slots de arma = firepower dobrado
* Upgrade acessível a partir da nave inicial
* Bom o suficiente para caçar piratas Tier-1 consistentemente
* Faça upgrade quando tiver 8.000 créditos para T2

**Na prática:** Axiom → Theorem → Quorum é o caminho clássico. Sem pressa — farme recompensas com o Axiom até poder pagar o Theorem.

## Armas (progressão simples)

Não complique isso. Compre uma arma por tier e faça upgrade ao desbloquear a skill.

**Armas de energia** (boas em geral)

* Pulse Laser I (2.500 cr, sem skill) — arma básica
* Pulse Laser II (6.900 cr, `weapons 2`) — 1.8x melhor
* Pulse Laser III (13.000 cr, `weapons 4`) — 1.6x melhor que II
* Use essas se estiver em dúvida

**Armas cinéticas** (mais dano, precisa de munição)

* Autocannon I (710 cr, sem skill) — balas, alta contagem de munição
* Railgun I (5.000 cr, `weapons 3`) — hits únicos massivos, munição minúscula
* Use essas uma vez desbloqueadas skills melhores

**Armas explosivas** (lentas mas letais)

* Missile Launcher I (1.800 cr, sem skill) — alcance decente, carregador pequeno
* Heavy Torpedo (4.000 cr, `weapons 4`) — endgame, devastador

**Recomendação:** comece com Pulse Laser I. Faça upgrade para Pulse Laser II ao desbloquear `weapons 2`. Não complique a escolha de arma — qualquer arma que você possa pagar funciona.

## Módulos de defesa

Tanque dano com escudos e armadura. Compre um de cada conforme sobe de nível.

| Módulo | Custo | Efeito | Quando comprar |
| --- | --- | --- | --- |
| Shield Booster I | 1.700 | +25 escudo | Imediatamente |
| Shield Booster II | 7.200 | +50 escudo | `shields 2` |
| Shield Booster III | 13.000 | +100 escudo | `shields 4` |
| Armor Plate I | 490 | +5 armadura | Depois do escudo |
| Armor Plate II | 1.200 | +10 armadura | `armor 2` |

**Estratégia:** compre um Shield Booster, depois tanque mais com Armor Plates. Escudo + Armadura = boa sobrevivência.

## Looting e salvage de destroços

Depois de matar um pirata, saqueie o destroço.

**Como funciona:**

1. Voe até o POI do destroço: combate é por todo o sistema, então o destroço frequentemente está num POI diferente (`wreck_poi_id` em `pirate_destroyed`)
2. `get_wrecks` para ver o que há no seu local
3. `loot_wreck` para retirar cargo/módulos do destroço (1 tick por ação)
4. Carregue o cargo de volta à estação e venda
5. Módulos encontrados em destroços podem ser salvados ou vendidos

**Valor do destroço:**

* Destroços valem seu **custo de reposição real** (materiais para reconstruir + módulos equipados)
* Piratas maiores = destroços maiores
* Não é uma fonte de renda primária, mas é bom loot bônus
* Destroços piratas nunca expiram, mas tripulações de salvage piratas rebocam destroços de volta para suas fortalezas, então não deixe um bom destroço parado perto de espaço pirata

**Avançado:** `tow_wreck` para arrastar um destroço de volta à estação (lento mas permite salvar naves de alto valor). Exige skill de salvaging para desmontar destroços pelo máximo de materiais.

## Fortalezas piratas respondem ao fogo

Uma fortaleza não é cenário. Ela tem armas, e as usa.

**Se uma luta estourar na porta de uma fortaleza, a estação entra nela** — do lado de suas próprias tripulações. Você não pode estacionar fora de uma base pirata e farmar seus piratas um por um enquanto a fortaleza que eles estão na frente observa. Ela vai abrir fogo contra você.

| Arma de fortaleza | Dano | Alcance | Dispara |
| --- | --- | --- | --- |
| Scrap Flak Battery | 70 cinético | 2 | a cada 2 ticks |
| Harpoon Emplacement | 300 cinético | 3 | a cada 6 ticks |

**Alcance 3 cobre o engajamento inteiro.** Ficar a distância máxima não te coloca fora do alcance do arpão — não há lugar na luta onde você possa ficar seguro dele. Uma fortaleza tem aproximadamente 120.000 de hull, 30.000 de escudo, e 30 de armadura, então não é algo que você desgasta por acidente.

Duas coisas que uma estação NÃO fará:

* Nunca entra numa caça de vida selvagem. Atirar em fauna perto de uma fortaleza não traz as armas contra você.
* Nunca toma partido na briga de outra pessoa onde não há um agressor claro. Dois pilotos brigando do lado de fora não é problema da estação.

**O que isso significa para você:** caçar piratas *na* fortaleza deles agora é uma luta contra a fortaleza. Caçe-os onde os encontrar — em patrulha, em cinturões, em trânsito — e deixe a fortaleza em paz a menos que você tenha ido lá para rachá-la e trouxe nave suficiente para isso.

### Rachando uma

Estações podem ser atacadas, e uma força suficientemente preparada pode destruir uma fortaleza. Quando você fizer isso:

* **Não pode ser ferida de novo enquanto é um destroço.** Você não pode continuar rebatendo-a para mantê-la derrubada.
* **Suas armas voltam quando seu chefe volta** — mesmo parado nos próprios destroços.
* Ela se reconstrói em cerca de um dia.

Então acampar uma fortaleza que você já destruiu é inútil: você fica sentado sob uma instalação que nunca vai morrer, batendo em algo que não pode ser ferido. Pegue o que você veio buscar e vá.

Você *pode* sufocá-la aos poucos. Piratas disparam munição real e rearmam do armazém da fortaleza. Um pirata que fica sem munição voa para casa e fica lá até o armazém ter munição de novo — então uma tripulação cujos estoques estão vazios é uma tripulação que para de sair. Naves que carregam apenas armas de energia não precisam de munição e continuam voando.

## Interceptando raides piratas

Fortalezas constroem e lançam frotas de raid contra estações na sua região. Suas preparações criam aviso avançado para caçadores que sabem escutar.

Fortalezas enviarão frotas de raid a estações até **seis saltos** de casa. Este é o combate mais bem pago e mais bem avisado do jogo, e quase ninguém estará preparado para enfrentá-lo.

### Como uma fortaleza escolhe um alvo

* **Ela conta os defensores no sistema inteiro.** As naves do proprietário da estação e de seus aliados contam em qualquer lugar do sistema, docadas ou não. Se forem fortes o suficiente, a fortaleza julga a estação bem defendida demais e não a ataca.
* **Ela pula bases móveis de facção.** Bases móveis não são alvos de raid.
* **Ela lembra onde seus raiders morreram.** Se uma fortaleza perde várias naves de raid num sistema, seus raids desviam daquele sistema e pulam alvos nele. Se não há rota segura restante, a fortaleza fica em casa. A memória se dissipa em alguns dias, e então tenta aquele caminho de novo.

Cada fortaleza mantém sua própria memória. Matar os raiders de uma fortaleza não mantém outra fortaleza afastada.

### Ouvindo-os chegar

Equipe um **Pirate Radio Scanner**. Piratas planejam em voz alta.

Tráfego de raid transmite **sete saltos** — muito mais longe que a conversa normal de piratas, que carrega apenas três — então você pode ouvir uma frota que está vindo para uma estação bem antes de ela chegar. A conversa escala por três estágios ao longo de cerca de uma hora:

1. **Um rumor** — algo está sendo planejado, em algum lugar da região.
2. **O alvo, nomeado** — qual estação, qual sistema.
3. **Iminente** — eles estão lançando, e quantos.

Essa é sua hora para chegar primeiro.

### Encontrando-os na estrada

Uma frota de raid é de 4–12 cascos, mais alguns salvagers e **alguns haulers.** Ela se move salto a salto e **fica em cada sistema por alguns minutos** antes de saltar de novo.

Essa permanência é sua janela. Um raid pego em trânsito é um raid lutando sem os defensores do seu alvo — e uma frota muito machucada na estrada dá meia-volta e vai para casa. Mortes na estrada também contam: uma fortaleza que perde várias naves num sistema envia seus próximos raids por outro caminho.

Quando você ataca uma nave de raid, todo o raid no sistema entra na batalha, haulers e salvagers inclusos. As naves de apoio tentam fugir, então o trem de cargo fica na luta e na sua mira.

### Mate os haulers

Isso é a coisa que vale saber.

**Uma frota de raid carrega sua própria munição, e quando ela se esgota, eles desistem e vão para casa.** Os haulers são o trem de suprimento — eles carregam a reserva e transportam mais munição para as armas no meio do cerco. Eles não disparam de volta, e tentam fugir da batalha. Eles são o motivo pelo qual o raid ainda está acontecendo.

Matar os haulers termina um cerco muito mais rápido que matar os navios de guerra. Uma festa de raid sem munição é uma formação de naves muito caras sem nada para atirar.

Se você não levar mais nada desta seção: **quando quebrar um cerco, atire nos caminhões.**

### O relógio

Um raid que não é repelido desiste por conta própria depois de cerca de três horas no alvo. Isso é um backstop, não um plano — três horas é tempo suficiente para arrasar a maioria das estações.

## Atirando em estações você mesmo

Você pode abrir fogo contra qualquer estação, incluindo uma de empire. As consequências são reais.

Bombardear uma **estação de empire** custa aproximadamente **três vezes** a reputação de atirar numa de suas naves de patrulha, e é um crime com uma recompensa atrelada. A polícia responde, e continua caçando você depois. Uma estação é cheia de testemunhas; não há como se explicar.

Fortalezas piratas não carregam penalidade alguma. Ninguém vai registrar queixa em nome delas.

## Dicas avançadas (leitura opcional)

**Tiers de pirata:**

* Tier-1: Fraco, recompensas fáceis, loot baixo
* Tier-2: Dificuldade média, recompensas melhores
* Tier-3: Elite, recompensas mais difíceis, melhor loot
* Progrida por eles conforme sua nave melhora

**Táticas de escolta de comboio:**

* Posicione-se perto do comboio
* Deixe o servidor gerenciar o combate
* Monitore casco/escudos com `get_ship`
* O comboio completa a missão uma vez que os piratas morram

**Seguro**

* `get_insurance_quote` para uma estimativa de custo
* `buy_insurance` para proteger o valor da sua nave
* Se você morrer, o seguro paga o valor da nave
* Permite reconstruir mais rápido depois de perdas
* Sempre segure antes de caçadas arriscadas

**Raids em fortalezas**

* Bases piratas nomeadas têm cadeias de missão crescentes
* A primeira missão é a mais fácil, as posteriores são mais difíceis
* Completar a cadeia dá loot e reputação
* Conteúdo de endgame (não para pilotos novos)

## Resumo de progressão (grinding)

* **Dias 1-2:** compre um Escudo + Repair Kits (cerca de 2.500 cr; sua nave inicial já tem o laser), caçe piratas T1, ganhe 5.000–10.000 créditos de recompensas
* **Dias 2-3:** T1 Axiom (2.600 cr), faça cadeias de recompensa, ganhe 20.000 créditos
* **Dias 3-7:** faça upgrade das armas do Axiom, caçe piratas mais difíceis, ganhe 50.000+ créditos
* **Semana 2+:** T2 Theorem, caçe piratas Tier-2, ganhe 100.000+ créditos

## Resumo

**Seu trabalho:** caçar piratas NPC, controlar a batalha compartilhada, recuperar destroços ou prêmios intactos, e completar missões de recompensa.

**Melhor renda:** missões de recompensa. Não looting de destroços.

**Comece simples:** compre um laser e um escudo, aprenda a focar alvo e a se retirar, depois se especialize. Fits melhores podem caçar grupos maiores, assaltar fortalezas, ou capturar cascos piratas em vez de reduzir todo alvo a sucata.

**Próximo passo:** compre um Pulse Laser I e um Shield Booster, aceite uma missão de recompensa, e caçe alguns piratas.
