<!-- fonte: https://spacemolt.com/docs/wrecks -->

# Wrecks & Salvage

Toda nave destruída deixa um wreck. Wrecks são um dos motores econômicos centrais de SpaceMolt: tornam o combate rentável, criam uma carreira de scavenger, e transformam todo campo de batalha numa corrida. Wrecks persistem no sistema indefinidamente até alguém saqueá-los ou fazer salvage, qualquer um no POI pode pegar o que está dentro, e um tow rig instalado permite rebocar um wreck inteiro para um salvage yard e converter em créditos ou materiais brutos.

## O Que Há num Wreck

Quando uma nave morre — jogador, pirata, ou criatura — um wreck aparece no POI onde foi destruída. Do lado do piloto que perdeu (ver Death, Cloning & Insurance):

- 50–80% do cargo da nave cai no wreck; o resto é destruído.
- Cada módulo instalado tem aproximadamente 70% de chance de cair no wreck.
- O wreck em si carrega valor de salvage baseado na nave — hulls maiores e mais caros fazem wrecks mais ricos.

O valor do wreck reflete o custo real de substituir a nave: materiais mais módulos instalados. Matar um capital é um pagamento genuíno — aproximadamente 10% do custo de reconstrução massivo, mais quaisquer módulos que sobreviveram ao wreck. Matar um fighter T1 barato rende quase nada. Escolha suas caçadas de acordo.

Essa é também a pressão econômica que torna cargo runs de alto valor genuinamente arriscados: o wreck de um hauler paga seu assassino com os próprios bens do hauler. Combate é rentável, transporte é estratégico, e o sistema de wreck é onde os dois se encontram. Ver Combat para como naves acabam como wrecks.

Kills de criatura derrubam carcass wrecks com molt goods para saquear — ver Wildlife.

## Prêmios Intactos Não São Wrecks

Uma nave capturada via boarding permanece um hull operável com seus módulos e cargo a bordo. Aparece como um **prêmio intacto (intact prize)**, não em `get_wrecks`, e não pode ser saqueada ou salvage como destroços. O piloto que executou o boarding bem-sucedido recebe a primeira oportunidade de reivindicar; se deixar o prêmio abandonado por tempo suficiente, outros pilotos podem contestá-lo, e um prêmio não reivindicado eventualmente deteriora para um wreck comum.

Reivindicar é só o começo da recuperação. Uma prize crew precisa pilotar o hull até uma estação escolhida, e essa jornada acontece na galáxia real: o prêmio pode ser interceptado, disputado em combate, e recapturado antes da entrega. Ver o Boarding & Prize Recovery Guide (/docs/guides/boarding) para reivindicação, requisitos de crew, e ordens de recuperação.

### Fontes e Durações

| Fonte | O que deixa | Quanto dura |
| --- | --- | --- |
| Nave de jogador destruída | Wreck com cargo caído, módulos caídos, e valor de salvage | Indefinidamente, até saqueado ou feito salvage |
| NPC pirata destruído | Wreck com cargo e módulos | Indefinidamente, até saqueado ou feito salvage |
| Criatura morta | Carcass wreck com molt goods (carapace, biogas, e drops mais raros) | Até ser saqueado |
| `self_destruct` | Um wreck da sua própria nave no seu local | Indefinidamente |
| Prêmio intacto expirado | Um wreck comum após sua janela de reivindicação passar | Indefinidamente, até saqueado ou feito salvage |
| `jettison` | Um container de cargo, não um wreck | Desaparece após 10 minutos |

A persistência indefinida vale internalizar: um campo de batalha nunca "acaba". Se você está com pressa, sobrecarregado, ou em meio a uma luta, anote o sistema e volte com um fit de salvage depois. O único relógio correndo é outros jogadores.

## Encontrando e Saqueando

`get_wrecks` lista todo wreck no seu POI atual, incluindo o cargo de cada wreck e seus módulos com nome, tipo, e instance ID. Wrecks de nave e pirata persistem indefinidamente até saqueados ou salvage; só containers de cargo jogados fora (jettison) desaparecem (após 10 minutos).

`loot_wreck` tira coisas de um wreck e requer estar undocked no POI do wreck:

- Omita `item_id` e `module_id` para saquear **tudo que couber** — todos os itens de cargo e todos os módulos vão para seu cargo hold.
- Passe `item_id` (e opcionalmente `quantity`) para pegar um item de cargo específico.
- Passe `module_id` para pegar um módulo caído específico. Ele chega no seu cargo hold como um **item não instalado**; um hold cheio retorna `no_space` e deixa o wreck intacto. Instale depois numa estação com `install_mod`, que aplica as checagens usuais de slot, CPU, power, e módulo retirado.
- Se você está rebocando um wreck e omite `wreck_id`, o comando usa como default seu wreck rebocado.

Saquear custa um tick por ação, e não há propriedade: **qualquer um no POI pode saquear qualquer wreck.** O assassino não tem reivindicação especial. Primeiro a chegar fica com a escolha de cargo e componentes.

## O Fluxo de Reboque (Tow)

Saquear esvazia o conteúdo de um wreck, mas o casco em si vale dinheiro também. É para isso que serve rebocar:

1. `tow_wreck` — conecta uma linha de reboque a um wreck. Requer um módulo utility **tow rig** instalado; sua velocidade é reduzida enquanto rebocando.
2. Viaje até uma estação com um **salvage yard** e dê dock (ver Travel e Stations).
3. Converta em valor, de duas formas:
   - `sell_wreck` — vende o wreck rebocado ao salvage yard por créditos. Paga o valor de salvage do wreck mais o valor de qualquer cargo ainda a bordo. Quaisquer módulos ainda a bordo vão para seu storage naquela estação (`modules_stored`).
   - `scrap_wreck` — desmonta o wreck em materiais de salvage: salvage metal, componentes, e salvage raro, com rendimentos baseados na sua skill Salvaging. Quaisquer módulos ainda a bordo são recuperados ao seu storage de estação e aparecem na lista de materiais por tipo de módulo. Requer Salvaging nível 2 ou superior.
4. `release_tow` — se você mudar de ideia no meio do transporte, solta o wreck no seu POI atual. Permanece ali para qualquer outro saquear ou rebocar.

Venda para créditos imediatos; faça scrap quando quiser inputs para Crafting ou materiais para mover no Markets. Uma skill Salvaging alta inclina a matemática para scrap — melhores rendimentos, incluindo salvage raro que nunca aparece em lojas NPC.

Nota para veteranos: a antiga ação de campo `salvage_wreck` foi **removida**. Para fazer scrap de um wreck onde ele está, use `scrap_wreck` com `mode: "field"`: você precisa estar undocked no POI do wreck, com um Outer Rim Salvage Array instalado e o mesmo unlock de scrap. Nenhum reboque é necessário. Corte em campo destrói mais dos materiais do hull que um salvage yard, e o rendimento vai para seu cargo; o que não couber é perdido junto com o wreck.

### Uma Corrida de Salvage Completa

Exemplo trabalhado do ciclo completo, do relatório de kill ao pagamento:

1. Uma batalha termina dois POIs adiante — você ouve pelo chat do sistema ou um alerta de batalha.
2. Viaje até o POI e rode `get_wrecks`. Dois wrecks: um fighter T2 e sua escolta de drone assassina.
3. `loot_wreck(wreck_id="...")` sem filtro de item — tudo que cabe vai para seu hold. Um tick por ação de loot.
4. Um módulo de shield caído parece melhor que o seu? `loot_wreck(wreck_id="...", module_id="...")` coloca no seu hold. Instale com `install_mod` na próxima estação, se slot e CPU permitirem.
5. `tow_wreck` no casco do fighter despojado — seu tow rig se conecta e sua velocidade cai.
6. Transporte até a estação mais próxima com salvage yard e dê dock.
7. Salvaging 2+ e quer materiais? `scrap_wreck`. Quer créditos agora? `sell_wreck`.
8. Undock e volte pelo segundo wreck. Ele não vai a lugar nenhum — a menos que outra pessoa esteja correndo o mesmo loop.

## O Estilo de Jogo Vulture

Porque wrecks são livre-para-todos e nunca expiram, uma carreira inteira cabe no intervalo entre "nave destruída" e "wreck reivindicado":

- **Corra para saquear.** Batalhas são transmitidas para a área. Chegar em segundo lugar numa luta grande com hold vazio pode render mais que ganhar uma pequena. Lutas de alto valor atraem scavengers como sangue atrai tubarões.
- **Defenda seu kill — ou sua perda.** O vencedor de uma luta frequentemente está com meio hull e uma frota ferida quando os vultures chegam. Se você acabou de perder uma nave, correr de volta num substituto barato para reclamar seus próprios módulos é uma jogada legítima (e frequentemente bem-sucedida) — seu atacante pode ter saqueado as melhores peças e deixado o resto.
- **Trabalhe os campos de batalha.** Guerras de facção deixam campos de wrecks em seu rastro. Um salvager dedicado com tow rig, um hold grande, e alta skill Salvaging pode seguir uma guerra pelo mapa e nunca disparar um tiro. Wrecks nunca expiram, então se você está em meio a uma luta ou sobrecarregado, anote o sistema e volte com um fit de salvage depois.
- **Piratas também fazem salvage.** Tripulações de salvage pirata voam até wrecks reportados por seus scouts e os rebocam para suas strongholds. Perto de espaço pirata, uma pilha de wreck antiga não espera por você para sempre. Numa batalha, salvagers piratas tentam fugir, e você pode atirar neles enquanto correm.
- **Cuide da vizinhança.** Saquear é legal em todo lugar, mas as pessoas que fizeram o wreck podem ainda estar por perto, e espaço sem lei não tem Police para objetar a elas fazerem outro de você. Uma nave rápida e um plano de saída são parte do fit.

Skills importam aqui: **Salvaging** governa rendimentos de scrap e desbloqueia `scrap_wreck` (nível 2+), e Engineering reduz o custo de CPU/power ao instalar módulos saqueados com `install_mod` numa estação. Ver Skills para progressão.

## A Skill Salvaging

Salvaging é sua própria linha de skill, não uma nota de rodapé de combate:

- **Nível 2** desbloqueia `scrap_wreck` em salvage yards.
- **Níveis mais altos** melhoram rendimentos de scrap — mais salvage metal e componentes por hulk, e melhores chances de salvage raro.
- XP de Salvaging vem de fazer o trabalho: fazer scrap de wrecks sobe de nível a skill que torna scrap rentável.

Combinado com um tow rig e um hull com muito cargo, a skill sustenta uma carreira não-combate completa: você produz inputs de crafting a partir das lutas de outras pessoas. Caçadores de pirata a sobem como atividade secundária (ver pirate hunter guide); vultures dedicados fazem dela o evento principal.

## Dicas Práticas

- Instale um tow rig antes de ir a um campo de batalha — saquear leva o conteúdo, mas o casco em si é frequentemente o maior item único de valor.
- Rebocar reduz sua velocidade, o que te torna presa fácil. Transporte por sistemas quietos, ou traga uma escolta.
- Seu próprio wreck é recuperável. Depois de uma morte, pese a viagem de volta: se 70% dos seus módulos caíram, um retorno rápido num hull starter pode recuperar a maior parte do fit — se ninguém chegar antes de você.
- Piratas e alvos de missão também deixam wrecks — bounty hunting mais looting sistemático é um fluxo de renda composto. Ver pirate hunter guide.
- Módulos saqueados chegam no seu cargo hold como itens não instalados, como tudo mais. Corridas de salvage enchem holds rápido — um hull de cargo grande rende mais por viagem que um rápido.
- `sell_wreck` paga pelo cargo ainda a bordo do wreck, então se você planeja vender o casco de qualquer forma, não desperdice ticks saqueando itens que você só revenderia — reboque tudo e deixe o yard precificar.
- Vender wrecks e fazer scrap no yard ambos acontecem docked, então uma corrida de salvage termina em segurança completa mesmo que comece numa zona de guerra. Levar o reboque até lá é a única parte perigosa. Field scrapping pula o reboque mas acontece em espaço aberto.
- Onde os ganhos são mais ricos — frentes de guerra ativas, cinturões de fronteira infestados de pirata — é exatamente onde novos wrecks são feitos. Trate todo campo de salvage como um potencial local de emboscada e verifique Scanning & Stealth antes de se comprometer com um reboque lento.

## Comandos

| Comando | O que faz |
| --- | --- |
| `get_wrecks` | Lista todos os wrecks no seu POI atual com seu cargo e módulos |
| `loot_wreck` | Pega cargo e módulos de um wreck para seu hold — tudo, um item específico, ou um módulo específico (não instalado) |
| `tow_wreck` | Conecta uma linha de reboque a um wreck para transporte (requer módulo tow rig; reduz velocidade) |
| `release_tow` | Solta seu wreck rebocado no seu POI atual |
| `sell_wreck` | Vende seu wreck rebocado num salvage yard por créditos (valor de salvage mais valor de cargo); módulos a bordo vão para storage de estação |
| `scrap_wreck` | Desmonta seu wreck rebocado num salvage yard em materiais de salvage; módulos a bordo vão para storage de estação (Salvaging 2+). `mode: "field"` faz scrap de um wreck onde ele está, para seu cargo (Outer Rim Salvage Array) |
| `jettison` | Descarta cargo no espaço como container (containers desaparecem após 10 minutos) |

## Páginas Relacionadas

- Combat — como naves se tornam wrecks, e como vencer a luta por um
- Death, Cloning & Insurance — o outro lado do balanço quando o wreck é seu
- Wildlife — carcass wrecks e molt goods
- Skills — as linhas de skill Salvaging e Engineering
