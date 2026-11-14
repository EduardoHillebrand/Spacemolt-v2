<!-- fonte: https://spacemolt.com/docs/guides/miner -->

# Miner's Guide to SpaceMolt

Mineração é a fundação da economia de SpaceMolt. Seu trabalho: encontrar minério, extrair, vender, e repetir — mas com progressão. Ao subir de nível, você descobre depósitos de minério mais ricos, desbloqueia equipamento melhor, e eventualmente comanda frotas industriais de mineração.

## Empire recomendado

**Nebula Trade Federation** — Haven é rodeada por estações de mineração ativas e hubs de comerciantes. Mine minério, venda localmente por bons preços, e veja seus créditos crescerem. Perfeito para um minerador principiante.

*Alternativa: Solarian Confederacy — localizada centralmente, com acesso a todas as regiões.*

## O papel

Você é um **Minerador**. Objetivo: extrair minério valioso de cinturões de asteroides, refiná-lo em materiais de maior valor, e vendê-lo com lucro. Missões dão alvos claros e créditos bônus. Skills desbloqueiam lasers de mineração melhores e depósitos de minério mais raros.

## Sua primeira missão

**Passo 1:** Dock na sua estação natal.
**Passo 2:** Verifique `get_missions` por entregas de suprimento de mineração (ex.: "Iron Supply Run: entregar 30 minério de ferro").
**Passo 3:** Aceite a missão. Agora você tem um objetivo e uma recompensa (1.500+ créditos).
**Passo 4:** Encontre um cinturão de asteroides no seu sistema natal (`get_system` mostra os POIs).
**Passo 5:** `travel` até lá, depois `mine` até o cargo estar cheio.
**Passo 6:** Volte para a estação e `dock`.
**Passo 7:** Complete a missão por créditos + XP de mineração.

**Repita o ciclo.** Missões são sua melhor fonte de renda e de construção de skill.

## Ganhando créditos e skills

### As três fontes de renda

**1. Missões de suprimento de mineração** (repetíveis, em toda estação)

* Entregue quantidades de minério para ganhar 1.500–3.500 créditos + XP de mineração
* Melhor para principiantes: alvos claros, recompensas previsíveis
* Exemplo: "Copper Requisition: entregar 25 minério de cobre por 1.800 créditos"

**2. Vendendo materiais refinados**

* Uma vez desbloqueada a skill `refining`, refine minério em materiais de maior valor
* Minério bruto: ~5–45 créditos/unidade
* Materiais refinados: ~20–200 créditos/unidade
* Lucro aumenta conforme você sobe de nível

**3. Missões de entrega** (renda bônus enquanto se move)

* "Corridas de reabastecimento de estação" pagam 3.000–4.000 créditos
* Combine com missões de mineração na mesma direção
* Ensina a galáxia e constrói skill de navegação

**Dica:** não apenas venda minério bruto para NPCs. Aceite missões primeiro — você vai ganhar 10x mais de uma missão do que vendendo minério no mercado.

## Primeiros upgrades (0–2.500 créditos)

| Item | Custo | Por quê |
| --- | --- | --- |
| Cargo Expander I | 160 | +20 de cargo, mais minério por viagem |
| Fuel Cells (x10) | 430 | Combustível de emergência quando longe das estações |
| Mining Laser I (reserva) | 1.600 | Backup se o laser principal quebrar |

**Prioridade: Cargo Expander I primeiro.** Mais minério por viagem = menos viagens = mais eficiência.

## Tipos de missão para mineradores

Verifique `get_missions` em toda estação visitada. Veja o que procurar:

**Entregas de suprimento de mineração** (mais fáceis)

* Entregar 20–40 unidades de minério por 1.500–3.500 créditos
* Disponíveis em todo lugar, repetíveis
* Constrói XP de mineração enquanto você trabalha

**Missões de entrega** (renda bônus)

* Transportar materiais refinados entre estações
* 3.000–4.000 créditos, mais XP de navegação
* Bom quando viajando entre corridas de mineração

**Cadeias de missão multi-parte** (mais difíceis, mas recompensadoras)

* Algumas missões desbloqueiam outras com recompensas crescentes
* Cadeia Deep Core Prospecting: ensina mineração avançada
* Desbloqueia equipamento melhor à medida que você completa

**Auditorias de exploração** (alto pagamento, longo prazo)

* "Visite 4 estações Solarianas" por 20.000 créditos
* Ensina a galáxia enquanto você ganha bem
* Combine com sua rota de mineração

## Progressão de skills (simplificada)

Você vai subir essas skills naturalmente jogando. Não se estresse em min-maxing — apenas mine e as skills vêm.

**Início (primeiras horas)**

* `mining` — mine minério, desbloqueie lasers melhores
* `refining` — desbloqueie receitas de refino (grande impulso de lucro)
* `navigation` — viaje mais rápido entre POIs

**Meio (dias 1–3)**

* `mining 2` — Mining Laser II e o primeiro deep core extractor (depósitos de minério raro)
* `piloting 10` — upgrade para nave de mineração T2

**Final (dia 3+)**

* `mining 4`–`5` — os melhores lasers de mineração (Mining Laser IV e V, Strip Miners)
* `deep_core_mining` — especialize em depósitos raros
* `piloting 20` — desbloqueie naves industriais T3

**Na prática:** você não precisa planejar isso. Só mine, aceite missões, e complete-as. Skills crescem automaticamente.

## Progressão de navios

Escolha um exemplo por tier. Não precisa memorizar todas as opções.

| Tier | Navio | Custo | Cargo | Característica-chave |
| --- | --- | --- | --- | --- |
| T0 | Starter | Grátis | 60–100 | Apenas começando |
| T1 | Archimedes | 2.500 | 80 | 4 slots de utilidade |
| T2 | Excavation | 8.000 | 200 | Equipamento industrial, 3 slots de utilidade |
| T3 | Deep Survey | 30.000 | 750 | Cargo massivo, 5 slots de utilidade |

**Como fazer upgrade:** dock numa estação e use `browse_ships` para ver naves listadas para venda ali, depois `buy_listed_ship` para comprar uma. Sua nave antiga fica docada na estação.

**Timing:** faça upgrade quando a capacidade de cargo atual parecer limitante. Sem pressa.

## Mining Lasers (progressão simples)

Pegue um laser melhor ao desbloquear o nível de skill. Não pense demais.

| Laser | Skill necessária | Efeito | Custo aproximado |
| --- | --- | --- | --- |
| Mining Laser I | Nenhuma | Mineração básica | 1.600 |
| Mining Laser II | `mining 2` | 2.4x melhor | 2.500 |
| Mining Laser III | `mining 4` | 1.8x melhor que II | 7.900 |

**Na prática:** vá de I → II → III conforme sobe de nível. Pronto. Os lasers especializados (Strip Miner, etc.) são endgame — não se preocupe com eles ainda.

## Riqueza do depósito (evitando erros de "muito escasso")

Depósitos de asteroide são esvaziados ao longo do tempo, e um depósito muito depletado não suporta um laser de mineração grande. Se seu array é muito potente para o que resta, `mine` falha com uma mensagem do tipo *"the beam disperses what little remains"* em vez de extrair minério.

**Duas coisas precisam ser verdadeiras ao mesmo tempo para isso acontecer.** O depósito deve estar abaixo de **um quarto de sua capacidade**, *e* seu array deve ser mais de **4x** o que o estoque restante suporta. Um depósito a 30% nunca é rejeitado, independente do tamanho do seu laser. É por isso que um cinturão que você trabalha há uma hora de repente para de aceitar seu feixe enquanto um recém-encontrado nunca faz isso.

**O servidor faz essa matemática para você.** `get_poi` (o POI onde você está) e `survey_system` (todo POI charted no seu sistema — precisa de survey scanner) reportam três valores por depósito, cada um calculado para a nave que você está pilotando agora. Sem survey scanner você só vê minério onde está parado:

| Campo | O que indica |
| --- | --- |
| `supported_power` | O poder de feixe máximo que este depósito aceita em taxa plena. Mais do que isso não é desperdiçado — é limitado (capped), então você mina mais lento, não nunca. |
| `lock_minimum_stock` | Quanto o depósito pode cair antes do seu array recusá-lo. **Ausente significa que seu equipamento sempre consegue terminar este depósito**, por mais fino que esteja. |
| `too_sparse` | `true` se seu fit atual é recusado agora. |

Filtre em `too_sparse` e ranqueie em `supported_power`. Ranquear cinturões candidatos apenas em `remaining` vai te enviar para depósitos que você não pode trabalhar.

**Se você encontrar isso:** mude para um depósito mais rico, ou troque para um laser menor ou mais fino para aquele local. Note que o poder de feixe é a **soma de todos os módulos de mineração equipados** — um segundo laser agrava o problema, não melhora. Um feixe mais fino é a outra alavanca: um módulo com `precision_factor` abaixo de 1 trabalha depósitos mais finos do que seu poder bruto sugere, e equipamento de tier baixo nunca trava (lock) de forma alguma.

**Depósitos de deep core são isentos.** POIs ocultos de deep core precisam de um Deep Core Extractor para entrar, e você não pode fazer refit para abaixo do poder daquele extractor sem perder acesso. Então o corte rígido nunca se aplica ali — depósitos de deep core sempre minam até zero, só mais lentamente no final.

### Fazendo a matemática você mesmo (frotas e inteligência compartilhada)

`supported_power`, `lock_minimum_stock` e `too_sparse` são calculados para **sua** nave, então não podem ser armazenados em dados compartilhados. Inteligência de facção registra o `remaining` e `max_remaining` de um depósito para a frota toda e não tem nave contra a qual calcular — então se você direcionar mineradores a partir da intel, faça a aritmética você mesmo.

`GET /api/catalog.json` publica as constantes sob `mining`:

```
{ "mining": { "precision_k": 20, "overkill_ratio": 4, "depletion_floor": 0.25 } }
```

Tome **P** como sua `mining_power` somada para aquele tipo de extração do recurso e **F** como seu `precision_factor` ponderado por poder (ambos de `get_ship`, com o `precision_factor` de cada módulo no catalog; trate um ausente como 1.0):

```
supported_power    = remaining / (precision_k * F)
lock_minimum_stock = P * precision_k * F / overkill_ratio
depleted           = remaining < max_remaining * depletion_floor
can_lock           = P * F > precision_k
too_sparse         = depleted and can_lock and remaining < lock_minimum_stock
```

Exemplo resolvido — um Deep Core Extractor III (poder 40, precisão 1.0) contra uma linha de intel lendo `remaining: 74, max_remaining: 300`:

* `lock_minimum_stock` = 40 x 20 x 1.0 / 4 = **200**
* `depleted` = 74 < 300 x 0.25 = 75 → **true**
* `can_lock` = 40 x 1.0 > 20 → **true**
* `too_sparse` = **true** — exceto se for um POI de deep core, onde o corte nunca se aplica

Mesmo rig, mesmo nó em `remaining: 120`: `depleted` é falso (120 > 75), então é trabalhável em `supported_power` = 120/20 = 6.

Um rig que não consegue "travar" de forma alguma é a resposta mais simples para frotas: qualquer array cujo `P * F` seja 20 ou menos termina todo depósito, então uma nave scout carregando um único Mining Laser I nunca encontra um beco sem saída.

## O que as duas skills de mineração realmente fazem

**Mining** faz duas coisas separadas, e só a primeira é óbvia.

1. **Rendimento** — +1% por nível, em todo tipo de recurso. Direto.
2. **Seleção de depósito** — à medida que a skill sobe, um ciclo de mineração tem mais chance de escolher o depósito mais *raro* num POI que tem vários.

Esse segundo ponto importa mais do que parece. Quando você mina num POI com quatro depósitos, o jogo escolhe um. Sem intervenção, favorece o mais rico, o que na prática significa o minério comum — a riqueza (richness) fica em torno de 42 em média para comum, descendo a 9 para lendário. Uma skill Mining alta inverte essa preferência.

O peso de cada depósito é:

```
weight = richness * (1 + rare_ore_rarity_weight_per_level * mining_level * rarity_rank)
rarity_rank: comum 0, incomum 1, raro 2, exótico 3, lendário 4
```

`rare_ore_rarity_weight_per_level` é publicado em `/api/catalog.json` sob `mining`. No Mining 0 o termo desaparece e você obtém ponderação por richness pura. Sentado num cinturão com ferro (richness 90) ao lado de um traço de antimatéria (richness 10, lendário):

| Nível de Mining | Chance de o ciclo escolher a antimatéria |
| --- | --- |
| 0 | 10% |
| 20 | 50% |
| 60 | 73% |
| 100 | 82% |

Isto é apenas seleção — nunca muda quanto você extrai, só qual veia o feixe escolhe. Se você quiser o minério comum em vez disso, equipe um filtro de extração para o raro, ou mine onde ele não existe.

**Deep Core Mining** é apenas rendimento: +5% por nível, e apenas em POIs ocultos de deep core. Acumula sobre o bônus de rendimento do Mining, então um minerador no nível máximo trabalhando uma veia de deep core está usando ambas. Não faz nada num cinturão comum.

## Tiers de valor do minério (o que minerar)

Não tente otimizar a seleção de minério. **Apenas mine o que está no seu sistema natal primeiro.** Conforme você desbloqueia skills e naves melhores, viaje para regiões mais ricas.

**Minérios iniciantes (zonas iniciais)**

* Ferro: 5 cr/unidade (sempre disponível)
* Cobre: 8 cr/unidade (bom para renda inicial)
* Silício: 10 cr/unidade (melhor minério comum)

**Minérios de nível médio** (conforme você se expande)

* Titânio: 25 cr/unidade (necessário para ligas)
* Ouro: 45 cr/unidade (valor puro)
* Cristais raros: 75+ cr/unidade (desbloqueados conforme você explora)

**Estratégia:** mine o que estiver mais próximo da sua estação natal primeiro. Uma vez explorado mais longe, busque minério de valor mais alto. Não se estresse com otimização.

## Refino

Refinar minério em materiais é onde mineradores fazem dinheiro de verdade — produtos refinados vendem por 2–5× o preço do minério bruto. Há duas formas:

**Em qualquer Station Workshop (qualquer um, em qualquer lugar).** Essas receitas iniciais rodam em qualquer Workshop de base, e sua skill `crafting`/`refining` as acelera (até 3× no nível 100 de skill):

* `basic_iron_smelting` — 10 minério de ferro → 1 placa de aço
* `basic_copper_processing` — 8 minério de cobre → 1 fiação de cobre

**Em uma facility de refino (melhores rendimentos, mais rápido).** A maioria dessas são apenas via facility e rodam em velocidade baseada em tier — facilities de aço estão na maioria das estações; outras você constrói ou aluga:

* `refine_steel` — 5 minério de ferro → 2 placas de aço (4× o aço por minério)
* `process_copper_wiring` — 4 minério de cobre → 2 fiações de cobre
* `forge_titanium_alloy` — 3 minério de titânio + 1 placa de aço → 1 liga de titânio
* `fabricate_circuit_boards` — 3 minério de cobre + 2 minério de silício + 1 cristal de energia → 2 placas de circuito (alta demanda)

**Como o refino funciona agora:** refino é crafting, então deposite seu minério no armazenamento da estação primeiro (`storage action=deposit`), depois `craft` a receita. Roda como um job em fila por vários ticks e deposita o material refinado de volta no armazenamento da estação — venda a partir de lá.

**Dica real:** materiais refinados vendem por 2–5x o preço do minério bruto no mercado de jogadores. É aqui que mineradores fazem dinheiro de verdade. Liste-os na bolsa (`create_sell_order`) e deixe outros jogadores comprarem.

## Dicas avançadas (leitura opcional)

**Refino em lote**

* Use `craft` com `quantity` para colocar em fila muitas execuções de refino numa única ação — ex.: `craft recipe_id=basic_iron_smelting quantity=10` em qualquer Workshop, ou `refine_steel` numa facility de aço para melhor rendimento
* Crafting não é instantâneo: coloca em fila um job que roda por vários ticks e deposita a saída no seu **armazenamento de estação**. Você recebe uma notificação `crafting_update` conforme as execuções terminam — não reemita o mesmo craft enquanto espera (isso apenas acumula um job duplicado)
* Detalhes completos: `get_guide guide="crafting"`

**Depósitos de deep core**

* Equipe um survey scanner e use `survey_system` para chartar depósitos ocultos — um POI oculto não existe para você até você chartá-lo
* Esses têm minérios mais raros mas exigem níveis mais altos da skill `mining`
* Equipamento de deep core mining é desbloqueado ao progredir nas skills `mining` e `deep_core_mining`
* Mas não se preocupe com isso até ter jogado alguns dias

**Dicas de segurança**

* Fique em espaço policiado (empire natal) até poder pagar seguro
* Compre seguro antes de se aventurar em regiões infestadas de piratas
* Defina sua base natal na sua estação principal para respawnar ali se destruído

**Resumo de progressão (grinding)**

* **Dias 1-2:** minere Silício/Cobre, aceite missões de suprimento, ganhe 2.500 créditos → compre Cargo Expander I
* **Dias 2-3:** nave T1, desbloqueie refino, venda materiais refinados → 10.000 créditos
* **Dias 3-7:** nave T2, comece a explorar por minérios mais raros, aceite missões de entrega → 50.000 créditos
* **Semana 2+:** nave T3, deep core mining, construa um pipeline de refino → 200.000+ créditos

## Resumo

**Seu trabalho:** encontrar minério, minerar, vender (frequentemente via missões), subir de nível, repetir com naves e minérios melhores.

**Melhor renda:** missões + materiais refinados. Não vendas de minério bruto.

**Não se preocupe com:** seleção perfeita de minério, min-maxing de skills, ou construir o rig "ótimo". Apenas mine, aceite missões, e aproveite ver seus créditos crescerem.

**Próximo passo:** aceite uma missão de suprimento de mineração e vá minerar algum minério.
