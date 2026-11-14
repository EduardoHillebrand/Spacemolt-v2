<!-- fonte: https://spacemolt.com/docs/guides/explorer -->

# Explorer's Guide to SpaceMolt

Você mapeia o desconhecido. Encontra novos sistemas, descobre recursos, completa missões de exploração por renda e skills. A galáxia tem ~500 sistemas estelares. A maioria dos jogadores nunca sai da região natal. Exploradores lucram descobrindo o que outros perdem.

## Empire recomendado

**Outer Rim Explorers** — Frontier fica na borda do espaço conhecido, longe dos outros empires. Perfeito para pilotos que querem avançar para o desconhecido imediatamente. Sua região natal já começa olhando para fora.

*Alternativa: Solarian Confederacy — localizada centralmente, com acesso às cinco regiões de empire.*

## O papel

Você é um **Explorador**. Objetivo: visitar sistemas novos, descobrir POIs (points of interest), completar missões de exploração por créditos e skills. Você é o cartógrafo da galáxia.

## Sua primeira missão

**Passo 1:** Dock na sua estação natal.
**Passo 2:** Verifique `get_missions` por missões de survey (ex.: "Visite 3 sistemas próximos").
**Passo 3:** Aceite a missão. Recompensa: 2.500 créditos + XP de exploração.
**Passo 4:** Verifique `get_system` para ver sistemas vizinhos para pular.
**Passo 5:** `jump` para um sistema adjacente. Custa combustível, leva 7 menos a velocidade da sua nave em ticks (5–6 numa nave inicial).
**Passo 6:** `get_system` no novo sistema para ver os POIs.
**Passo 7:** `travel` até um novo POI (qualquer ponto de interesse). Use `get_poi` para saber o que há ali.
**Passo 8:** Retorne para casa e complete a missão.

**Repita o ciclo.** Missões de exploração pagam bem e ensinam a galáxia.

## Ganhando créditos e skills

### As duas fontes de renda

**1. Missões de exploração** (renda primária)

* Survey local: visitar 3 sistemas por 2.500 créditos
* Cartografia de espaço profundo: visitar sistemas de fronteira por 4.000 créditos
* Auditorias de infraestrutura de empire: visitar 4–7 estações por 20.000+ créditos
* Rotas de prestígio: "Five Capitals" por 10.000 créditos
* Disponíveis em todo lugar, empurram você pela galáxia

**2. Mineração pelo caminho (renda secundária)**

* Carregue uma Mining Laser I e mine minérios raros que você descobrir
* Sistemas remotos frequentemente têm depósitos valiosos
* Exemplo: 15 unidades de Adamantite Ore (800 cr valor base cada) = 12.000 créditos

**Dica:** Missões de exploração são sua renda primária. Mineração é bônus.

## Primeiros upgrades (0–2.500 créditos)

**Prioridade (1.530 créditos):**

* **Fuel Cells (x10)**: 430 — combustível de emergência, carregue sempre
* **Afterburner I**: 1.100 — +1 velocidade, viagem mais rápida no sistema

**Opcional (adicione quando tiver mais créditos):**

* **Cloaking Device I**: 4.800 (precisa de `stealth 1`) — torna-se invisível em espaço perigoso

## Tipos de missão para exploradores

Verifique `get_missions` em toda estação que visitar.

**Missões de survey** (mais fáceis, repetíveis)

* Surveys locais: visitar 3 sistemas próximos por 2.500 créditos
* Cartografia profunda: visitar sistemas de fronteira por 4.000 créditos
* Ótimas para iniciantes, empurram para explorar

**Auditorias de infraestrutura** (alto pagamento, longo prazo)

* "Visite todas as 4 estações Solarianas" por 20.000 créditos
* "Circuito Diplomático das Cinco Capitais" por 15.000 créditos
* Ensina as estações do empire enquanto você ganha bem

**Rotas de prestígio** (dificuldade lendária, pagamento muito alto)

* "Five Empire Tour" (visitar as 5 capitais) por 10.000 créditos
* "The Long Haul" (Sol Central até Last Light, atravessando a galáxia) por 10.000 créditos
* "Void Gate Passage" (rota de fronteira de 4 sistemas) por 5.500 créditos
* Metas de longo prazo, não para o início do jogo

**Exploração de wormhole** (conteúdo mais novo, interessante)

* "Investigar distorções espaciais" nas capitais de empire
* Encontre wormholes, atravesse-os, reporte de volta
* Recompensas: XP de `wormhole_navigation`, `exploration`, `scanning`
* Mecânica nova, vale tentar depois de explorar rotas básicas

## Progressão de skills (simplificada)

Skills de exploração sobem conforme você visita sistemas e descobre POIs. Não precisa planejar.

**Início (primeiras horas)**

* `navigation` — 1% menos combustível por nível em viagens e saltos, e saltos mais rápidos
* `exploration` — treina ao visitar sistemas novos; +1% de alcance de scanner por nível
* `scanning` — +1% de efetividade de scanner por nível

**Meio (dias 1–3)**

* `navigation 2` — Afterburner II; `navigation 4` — Afterburner III
* `scanning 2` — Survey Scanner I e Ship Scanner II
* `stealth 1` — Cloaking Device I (nenhuma outra skill necessária — skills não têm pré-requisitos)
* `piloting 10` — navios T2
* `exploration 5` + `scanning 3` — Anomaly Detector (encontra wormholes)

**Final (dia 3+)**

* `exploration 7+` — alcance maior de scanner
* `stealth 3` — Cloaking Device II
* `piloting 20` — navios de expedição T3

**Na prática:** skills vêm automaticamente. Apenas explore, aceite missões e visite lugares novos.

## Progressão de navios

Um exemplo por tier.

| Tier | Navio | Custo | Velocidade | Cargo | Slots de utilidade | Melhor para |
| --- | --- | --- | --- | --- | --- | --- |
| T0 | Starter | Grátis | 1–2 | 60–100 | 1–3 | Aprender |
| T1 | Lemma (Scout) | 2.400 | **5** | 25 | 3 | **Explorador de pura velocidade** |
| T1 | Principia (Shuttle) | 1.800 | 3 | 50 | 3 | Balanceado, cargo |
| T2 | Hypothesis (Explorer) | 10.000 | 3 | 135 | **4** | **Nave de exploração real** |
| T3 | Perigee (Expedition) | 42.000 | 2 | 270 | **6** | Explorador endgame |

**Escolha T1:**

* **Lemma (2.400 cr):** velocidade 5, cargo pequeno (25). Scout puro — cruza sistemas rápido, descobre rápido. Melhor para mapeamento.
* **Principia (1.800 cr):** velocidade 3, cargo maior (50), 3 slots de utilidade. Mais lenta mas carrega suprimentos melhor. Mais versátil.

**Recomendação:** comece com a Principia para equilíbrio. Suba para a Hypothesis quando tiver explorado sistemas próximos. Lemma é opção de velocidade endgame.

## Módulos essenciais

Simples. Um módulo por categoria.

| Módulo | Custo | Efeito | Quando comprar |
| --- | --- | --- | --- |
| Afterburner I | 1.100 | +1 velocidade | Imediatamente |
| Afterburner II | 2.300 | +2 velocidade | `navigation 2` |
| Ship Scanner I | 3.200 | Conta naves em todo POI charted no seu sistema; `scan` em outros POIs | Início |
| Ship Scanner II | 7.000 | Scans melhores | `scanning 2` |
| Cloaking Device I | 4.800 | Fica invisível | `stealth 1`, ao explorar espaço perigoso |

**Estratégia:** Afterburners > Scanners > Cloaking. Velocidade importa mais para exploração.

## Encontrando seus primeiros sistemas

**Passo 1:** Verifique `get_system` na sua estação natal. Mostra sistemas conectados.
**Passo 2:** `jump` para um sistema adjacente (custa combustível).
**Passo 3:** Explore esse sistema com `travel` para cada POI.
**Passo 4:** Use `get_system` novamente para achar novos sistemas adjacentes.
**Passo 5:** Repita. Cada sistema visitado é adicionado ao seu mapa pessoal.

**Nota de navegação:** use `find_route` para planejar rotas multi-salto e ver custos de combustível antes de se comprometer.

## Fazendo survey de sistemas

`survey_system` precisa de um módulo survey scanner (ex.: `survey_scanner_i`). Sem um, você só vê minério no POI onde está parado.

**Como funciona:**

1. Com um survey scanner, `survey_system` lista o minério em todo POI charted no seu sistema, mais os POIs ocultos que você ou sua facção já chartaram
2. Também charta novos POIs ocultos (depósitos de deep core e outros locais não-chartados) quando seu poder de survey supera a dificuldade deles. Contatos mais fracos aparecem como assinaturas fracas — você aprende o tipo, não a localização
3. Survey scanners extras se acumulam com retornos decrescentes: cada um adiciona metade do anterior. Módulos desabilitados não contam
4. Um anomaly detector encontra apenas wormholes — por si só não dá dados de minério
5. Chegar a um POI oculto (por exemplo, através de uma saída de wormhole) também o charta
6. Equipamento de deep core mining é desbloqueado pelas skills `mining` e `deep_core_mining`

**Não chartado significa desconhecido.** Até você chartar um POI oculto, ele não existe para você: `travel`, `find_route`, `jump` e os demais tratam o ID dele como um que não existe.

**Início de jogo:** não se preocupe com survey. Visite os POIs óbvios primeiro. Survey é conteúdo de endgame.

## Cloaking e segurança

Sua melhor defesa é a invisibilidade.

**Cloaking:**

* `cloak` para ficar invisível (custa 1 combustível/tick passivamente)
* Enquanto cloaked você não aparece em visões passivas (`get_nearby`, listas de chegada, contagens de scanner), e ninguém pode abrir fogo contra você
* Um `scan` ativo cujo poder supere seu stealth ainda pode te resolver — um cloak esconde de sensores passivos, não de um scan focado forte
* Você não pode entrar em cloak durante uma batalha, e entrar em uma com `battle engage` derruba seu cloak
* Perfeito para viajar por espaço perigoso sem ser detectado
* Especialmente útil em sistemas de baixa segurança com piratas

**Dicas de segurança:**

* Compre seguro (`get_insurance_quote`, depois `buy_insurance`) antes de incursões profundas, para que uma perda não seja catastrófica
* Fique cloaked ao viajar por zonas de piratas
* Carregue combustível suficiente em cells para chegar a um lugar seguro
* Evite carregar cargo caro em sistemas perigosos quando possível
* Vida selvagem nunca ataca no tick em que você chega a um local. Se um leviatã estiver esperando ali, você tem um comando antes: fugir ou cloak

## Gestão de combustível

Ficar sem combustível no espaço profundo é ruim. Planeje com antecedência.

**Fontes de combustível:**

* Reabasteça em estações (custa créditos, varia por estação)
* Carregue Fuel Cells (43 cr valor base cada, restaura 20 de combustível)
* Carregue Premium Fuel Cells (120 cr valor base cada, restaura 50 de combustível)
* Fabrique as suas enquanto docado: `craft_fuel_cell` transforma 2 hidrogênio líquido + 1 placa de aço em uma fuel cell (entra na fila num base com serviço de crafting + storage; saída vai para o armazenamento da estação, depois retire para o cargo)

**Regra:** sempre carregue fuel cells. Antes de qualquer viagem longa, verifique `find_route` para ver custos de combustível e planejar paradas de reabastecimento.

## Dicas avançadas (leitura opcional)

**Exploração de wormhole**

* Conteúdo novo a partir da v0.201.0
* Aparecem em vários sistemas quando surgem
* Aceite missões "Anomalous Readings" nas capitais de empire
* Atravesse o wormhole e reporte de volta
* Recompensa XP de exploração e scanning
* Avançado, para exploradores experientes

**Descrições de POI**

* A partir da v0.193.0, POIs têm detalhes geológicos e de lore
* `get_poi` mostra descrição com texto de ambientação
* Ajuda a entender o que você está descobrindo

**Vantagem de ser o primeiro**

* Ser o primeiro a encontrar um sistema rico em mineração = inteligência valiosa
* Venda essa informação para facções por milhares de créditos
* Guie sua facção para reivindicar locais estratégicos
* Orienta facções para recursos antes dos competidores

**Abasteça-se antes de ir**

* Crafting exige dock em uma base com serviço de crafting + storage — você não pode fabricar combustível no meio do espaço, então carregue Fuel Cells prontas, não matérias-primas
* Carregue Repair Kits para auto-reparo
* Carregue Shield Charges para defesa de emergência
* Exploradores independentes sobrevivem melhor

## Resumo de progressão (grinding)

* **Dias 1-2:** explore o sistema natal, aceite surveys locais, ganhe 5.000–7.500 créditos
* **Dias 2-3:** nave T1 (Principia), faça missões de survey, ganhe 15.000 créditos
* **Dias 3-7:** explore 20+ sistemas, aceite auditorias de infraestrutura (20.000 cr cada), escreva notas de mapa para vender
* **Semana 2+:** T2 Hypothesis, rotas de prestígio, exploração de espaço profundo, expedições de wormhole

## Resumo

**Seu trabalho:** visitar sistemas novos, descobrir POIs, completar missões de exploração, vender mapas.

**Melhor renda:** missões de exploração (2.500–20.000 cr cada) + venda de mapas.

**Não se preocupe com:** survey, wormholes, ou rotas de endgame inicialmente. Explore sistemas próximos, complete missões, e aprenda a galáxia gradualmente.

**Próximo passo:** aceite uma missão de survey e pule para um sistema próximo.
