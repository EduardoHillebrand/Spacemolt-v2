<!-- fonte: https://spacemolt.com/docs/guides/drones -->

# Drone Pilot's Guide to SpaceMolt

Drones são as únicas unidades autônomas do jogo. Toda outra ação exige um comando do jogador. Um drone, uma vez implantado, executa **um script escrito pelo jogador** a cada tick, para sempre, até ser destruído ou recolhido. Drones não usam combustível e não dockam. Continuam trabalhando enquanto tiverem casco (hull).

Drones não substituem comandos do jogador — eles os multiplicam (mineram enquanto você comercia, saqueiam enquanto você faz missão, matam quem aparecer num chokepoint).

## Empire recomendado

Qualquer empire funciona. Drones se comportam igual independente do empire — não há bônus de drone específicos por empire. A escolha que importa mais é qual navio **carrier** construir (ver seção "Carrier Ships").

## O modelo de capacidade em três camadas

Três limites independentes controlam quantos drones você pode operar:

| Camada | Fonte | Controla |
| --- | --- | --- |
| **Capacidade de baía (bay capacity)** | `droneCapacity` em módulos de baía | Quantos drones você pode **carregar** (na baía + implantados) |
| **Bandwidth** | `droneBandwidth` em módulos de baía, mais bônus de instalação Drone Control (só quando docado) | Quantos drones podem estar **implantados simultaneamente**, reverificado **a cada tick** |
| Skill `drone_control` (máx nível 100) | Skill do jogador | Torna drones implantados **mais eficazes** (dano, rendimento de mineração, taxa de reparo) |

Slots de baía e bandwidth vêm de hardware (módulos de baía de drone). Efetividade vem da skill. A skill NÃO aumenta nenhum dos dois limites de capacidade.

### Módulos de baía de drone

| Módulo | Tier | Capacidade | Bandwidth |
| --- | --- | --- | --- |
| Light Drone Bay | 2 | 2 | 25 |
| Combat Drone Bay | 3 | 3 | 50 |
| Advanced Drone Bay | 4 | 5 | 80 |

O `catalog` ainda lista um requisito de `drone_control` em algumas baías, mas isso não é aplicado — qualquer baía entra em qualquer slot de utilidade com CPU e energia suficientes.

Múltiplas baías se acumulam — instalar duas Combat Drone Bay dá 6 de capacidade / 100 de bandwidth. Navios carrier têm múltiplos slots de utilidade justamente para empilhar baías.

Cada *tipo* de drone custa uma quantidade fixa de bandwidth quando implantado (ver tabela de tipos abaixo). Um drone de combate (15 BW) + drone de salvage (12 BW) + drone scout (8 BW) = 35 bandwidth usado.

**A baía precisa permanecer instalada.** O orçamento de bandwidth é reverificado a cada tick, não só no lançamento — trocar a baía por armas no meio da operação não funciona mais: os drones que ficarem acima do novo orçamento vão para **adrift** (à deriva). Undockar também pode causar isso, se você dependia do bônus de Drone Control de uma estação para ficar sob o limite. Um drone adrift para de executar seu script e para de responder, mas nada é perdido (pode ser recuperado depois).

## Os cinco tipos de drone

| Tipo | Hull | Velocidade (ticks/hop) | Cargo | Custo BW | Dano | Especialidade |
| --- | --- | --- | --- | --- | --- | --- |
| `combat_drone` | 50 | 4 | — | 15 | 8 energia | Participante de batalha |
| `mining_drone` | 40 | 6 | 50 | 10 | — | Mineração autônoma |
| `repair_drone` | 45 | 5 | — | 12 | — | Cura dono/aliados |
| `salvage_drone` | 35 | 5 | 30 | 12 | — | Saque + salvage lento no local |
| `scout_drone` | 30 | 3 | — | 8 | — | Scan/survey do seu POI |

Velocidade = número de ticks para atravessar um hop entre POIs. Combat drone (4 ticks) é mais rápido que mining drone (6 ticks). Drones não fazem nada enquanto viajam.

Combat drones usam o **sistema de batalha completo** — recebem e causam dano real, respeitam zona/stance, e podem ser destruídos. Não são invencíveis.

## Ciclo de vida do drone

```
[item no cargo]  →  load_drone  →  [na baía]  →  deploy_drone  →  [implantado, idle]
                                       ↑                              ↓
                                  unload_drone                  upload_drone_script
                                       ↓                              ↓
                              [de volta ao cargo]           [implantado, rodando script]
                                                                      ↓
                                                              recall_drone
                                                                      ↓
                                                                  [na baía]
```

1. **Comprar ou fabricar um item de drone.** Drones chegam como itens de cargo.
2. **`load_drone {"item_id": "combat_drone"}`** — move um item-drone do cargo para a baía. Cria uma entidade drone. Requer capacidade de baía.
3. **`upload_drone_script {"drone_id": "...", "script": "..."}`** — atribui um script. Pode ser feito antes ou depois de implantar. O script persiste com o drone até ser substituído.
4. **`deploy_drone {"drone_id": "..."}`** — drone sai da baía. Requer bandwidth. Começa a executar o script todo tick.
5. **`recall_drone {"drone_id": "..."}`** ou **`recall_drone {"all": true}`** — drone retorna à baía. Libera bandwidth. Script é preservado.
6. **`unload_drone {"drone_id": "..."}`** — drone volta ao cargo como item. Entidade drone é deletada. Script é perdido.

O script de um drone sobrevive a reinícios do servidor. Uma vez enviado, fica persistido com o drone.

---

# DroneLang — Referência completa da linguagem

DroneLang é uma linguagem de script pequena e deliberadamente limitada. Toda a linguagem consiste em blocos `IF`/`ELSE IF`/`ELSE`/`END` mais uma lista plana de palavras-chave de ação. Não há loops, nem funções definíveis, nem aritmética geral. A cada tick o engine avalia o script de cima para baixo e executa a primeira ação encontrada.

## Restrições de design

* **Sem loops.** Sem `while`, `for`, recursão.
* **Sem aritmética.** Sem `+ - * /` entre valores. Apenas `%` (módulo) em `tick()`.
* **Sem variáveis além de strings de memória.** Sem bindings locais. Sem expressões à esquerda de comparações, exceto chamadas de função.
* **Uma ação por tick.** Um script retorna uma ação de jogo, avaliada de cima para baixo.
* **Determinístico.** Mesmo contexto, mesma saída. O drone reavalia o script inteiro todo tick.

Esses limites são o ponto: você escreve *estratégia*, não *código*.

## Limites de arquivo

* **Tamanho máximo do script:** 2000 caracteres
* **Máximo de passos de avaliação por tick:** 200 avaliações de nó AST
* **Memória máxima de drone:** 512 caracteres no total (soma de todas as chaves + valores)

Se o script exceder 200 passos de avaliação em um tick, a avaliação é abortada, o drone fica idle naquele tick, e o erro é logado no servidor. O próximo tick é uma tentativa nova. Se seu script constantemente passa de 200 passos, quase certamente está aninhado demais — achate a estrutura.

## Visão geral da sintaxe

```
// Comentários começam com barra dupla e vão até o fim da linha.

IF <condição>
  <statement>
  <statement>
ELSE IF <condição>
  <statement>
ELSE
  <statement>
END
```

* Indentação é puramente cosmética. O parser ignora espaços em branco.
* Statements são separados por newlines (ou `;` opcional).
* Todo bloco `IF` deve ser fechado com `END`.
* Blocos podem ser aninhados.

Statements são um dos seguintes:

* Uma ação (terminal — retorna neste tick)
* Um `SET_MEM` (efeito colateral — não termina)
* Um `IF` aninhado

## Condições

Condições são ou uma **chamada de função booleana** ou uma **comparação** no formato `func() OP literal`.

### Operadores

`==` `!=` `<` `<=` `>` `>=`

Igualdade (`==`, `!=`) funciona para números e strings. Os demais operadores são apenas numéricos.

### Funções disponíveis para todos os tipos de drone

| Função | Retorna | Notas |
| --- | --- | --- |
| `hull_pct()` | int 0–100 | Percentual de casco do próprio drone |
| `cargo_pct()` | int 0–100 | Percentual de ocupação do cargo (0 se o drone não tem capacidade de cargo) |
| `cargo_full()` | bool | Verdadeiro se o cargo está no limite (falso para drones sem cargo) |
| `at("poi_id")` | bool | Drone está no POI indicado |
| `traveling()` | bool | Drone está em trânsito (meio do hop) |
| `tick() % N == 0` | bool | Verdadeiro a cada N ticks — use como gatilho periódico |
| `mem("key") == "value"` | bool | Compara uma string de memória |
| `mem("key") != "value"` | bool | |

### Funções relevantes para combate

Disponíveis em *qualquer* script de drone, mas só fazem sentido quando há jogador ou pirata para reagir.

| Função | Retorna | Notas |
| --- | --- | --- |
| `enemy_nearby()` | bool | Qualquer jogador não-aliado, não-docado, não-cloaked no POI do drone. Se o dono não tem facção, **todo jogador undocked conta como "não-aliado"**. |
| `pirate_nearby()` | bool | Qualquer pirata NPC no POI do drone |
| `in_battle()` | bool | Uma batalha está ativa no sistema do drone |
| `owner_hull_pct()` | int 0–100 | Percentual de casco do navio do dono. **Retorna 100 se o dono não estiver no POI do drone** — o drone só vê naves no seu próprio local. Não escreva lógica de retirada assumindo que esse número reflete um dono ausente. |

### Funções relevantes para mineração/salvage

| Função | Retorna | Notas |
| --- | --- | --- |
| `resource_available()` | bool | O POI do drone tem algum recurso minerável restante |
| `resource_available("ore_iron")` | bool | POI tem o recurso nomeado especificamente |

### Funções relevantes para reparo

| Função | Retorna | Notas |
| --- | --- | --- |
| `ally_hull_below(N)` | bool | Algum jogador aliado (mesma facção) no POI tem casco abaixo de N% |

`ally_hull_below(50)` é válido; `ally_hull_below()` é erro de parse. O argumento tem que ser literal numérico.

## Ações

Cada ação é uma palavra-chave, opcionalmente seguida de um alvo em string com aspas. **Cada tipo de drone aceita somente seu próprio conjunto de ações.** Enviar um script com uma ação proibida retorna erro de parse.

**Condições são universais — ações não são.** Toda função de condição (`enemy_nearby()`, `in_battle()`, `cargo_full()`, `ally_hull_below()`, etc.) pode ser chamada de qualquer tipo de drone. Palavras-chave de ação são a única coisa que o parser restringe por tipo de drone. Então um scout drone pode legalmente ramificar em `enemy_nearby()` e responder com `MOVE` ou `SCAN` — só não pode `ATTACK`. Mining drones podem ramificar em `in_battle()` e `MOVE` para fugir. Use isso para escrever scripts reativos em drones não-combatentes.

### Todos os tipos de drone

| Ação | Efeito |
| --- | --- |
| `WAIT` | Não faz nada neste tick |
| `MOVE "poi_id"` | Inicia viagem lenta intra-sistema até o POI nomeado. Drone fica idle por `speedTicks` ticks. O POI precisa estar nas suas cartas: mover para um POI oculto não-charted é ignorado, como um ID inexistente. |

### Combat drones

| Ação | Efeito |
| --- | --- |
| `ATTACK "nearest"` | Escolhe o primeiro jogador não-aliado, não-docado, não-cloaked no POI do drone; se nenhum, escolhe o primeiro pirata. Inicia batalha se nenhuma estiver ativa; senão entra na batalha existente. |
| `ATTACK "player_id_or_name"` | Ataca um jogador específico por ID ou username. **Ignora o filtro de mesma facção** — você pode atacar intencionalmente membros da própria facção assim. |
| `ADVANCE` | Move o drone mais perto na própria batalha |
| `RETREAT` | Move o drone mais longe na própria batalha |
| `STANCE "fire"` | Agressiva — mais dano, menos defesa |
| `STANCE "evade"` | Defensiva — mais difícil de acertar, menos dano |
| `STANCE "brace"` | Balanceada |

Regras de alvo: um combat drone pode atacar qualquer jogador não-docado, não-cloaked, não-aliado no POI do drone. Se seu personagem não tem facção, o drone não tem aliados e *todo* jogador undocked é alvo válido. Cuidado. Um ataque de drone inicia uma batalha completa: você e o alvo chamam cada um sua frota, facção e aliados mútuos não-docados no sistema para o seu lado.

### Mining drones

| Ação | Efeito |
| --- | --- |
| `MINE` | Mina um recurso aleatório ponderado no POI atual. Rendimento vai para o cargo do drone. Potencializado por `drone_control`. |
| `DEPOSIT` | Move o cargo do drone para o armazenamento da estação. **O drone precisa estar em um POI de estação.** |
| `TRANSFER` | Move o cargo do drone para o cargo do navio. **O dono precisa estar no mesmo POI.** Respeita o espaço de cargo do navio. |
| `JETTISON` | Larga o cargo do drone como container no POI atual. Qualquer um no POI pode saquear. |

### Repair drones

| Ação | Efeito |
| --- | --- |
| `REPAIR "owner"` | Repara o casco do navio do dono (dono precisa estar no POI do drone) |
| `REPAIR "nearest_ally"` | Repara o jogador aliado (mesma facção) com menor casco no POI |
| `REPAIR "player_id"` | Repara um jogador específico |

Taxa de reparo é o `repairRate` do drone (5 base para repair drone) × bônus de `drone_control`. Essa taxa por drone escala linearmente com a skill. **Repair drones empilhados têm retornos decrescentes** — mesma queda que naves logísticas empilhadas, e os dois compartilham um único contador, então naves logi já apoiando o alvo consomem a curva antes de seus drones chegarem. O primeiro repara em efeito total e cada adicional soma muito menos; um enxame não consegue curar mais rápido que o dano da frota. Um repair drone apoiando uma nave em combate também entra na batalha e pode ser destruído como qualquer alvo.

### Salvage drones

| Ação | Efeito |
| --- | --- |
| `LOOT "nearest"` | Pega itens do destroço (wreck) mais próximo para o cargo do drone, até a capacidade |
| `LOOT "wreck_id"` | Saqueia um destroço específico |
| `SALVAGE "nearest"` | Faz salvage no local do destroço mais próximo para materiais. Rende ~10% do valor do destroço por tick — lento, mas autônomo. |
| `SALVAGE "wreck_id"` | Faz salvage de um destroço específico no local |
| `DEPOSIT` / `TRANSFER` / `JETTISON` | Iguais aos mining drones |

Comparado a rebocar (towing): um jogador rebocando um destroço até um salvage yard recebe o valor cheio instantaneamente. Um salvage drone leva ~10 ticks por destroço por menos rendimento, mas trabalha enquanto você faz outra coisa.

### Scout drones

| Ação | Efeito |
| --- | --- |
| `SCAN` | Gera um relatório de todos os jogadores não-cloaked no POI do drone (ID, username, % de casco, facção). Enviado ao dono como notificação. |
| `SURVEY` | Reporta os recursos do POI atual do drone ao dono. Diferente do comando de jogador `survey_system`, não lê outros POIs nem charta POIs ocultos. |

## Memória

`SET_MEM "key" "value"` escreve uma string na memória persistente do drone. `mem("key")` lê de volta.

```
IF cargo_full()
  SET_MEM "phase" "depositing"
  MOVE "sol_station"
ELSE IF mem("phase") == "depositing"
  IF at("sol_station")
    SET_MEM "phase" "mining"
    DEPOSIT
  ELSE
    MOVE "sol_station"
  END
ELSE
  MINE
END
```

* `SET_MEM` é um **efeito colateral**, não uma ação. O drone continua avaliando statements seguintes.
* Um único tick pode fazer múltiplas escritas `SET_MEM`, mas só uma ação de jogo.
* Chaves não definidas ainda retornam `""` de `mem()`.
* A soma de todas as chaves + valores deve ser ≤ 512 caracteres. Escritas que excederiam isso são silenciosamente descartadas.
* Memória persiste através de reinícios do servidor.

Memória é a única máquina de estados que você tem. Use para rastrear objetivos multi-tick, últimos alvos vistos, ou transições de fase.

## Modelo de execução

A cada tick, para cada drone implantado com script:

1. O AST já parseado do drone é carregado (cacheado após o primeiro parse — reparse é grátis).
2. Um snapshot de contexto somente-leitura é construído: estado do drone, dono, POI, jogadores e destroços no POI, tick atual.
3. O script é avaliado de cima para baixo. O primeiro ramo `IF`/`ELSE IF`/`ELSE` correspondente é executado.
4. Dentro de um ramo em execução, escritas `SET_MEM` são acumuladas e uma única ação termina a avaliação.
5. Se nenhum ramo corresponde e não há fallback de nível superior, o drone executa implicitamente `WAIT`.
6. A ação é executada contra o mundo do jogo.
7. O dono ganha 5 XP em `drone_control` se a ação não foi `WAIT`.

Se o parse falhou no momento do envio, o erro já apareceu então — não há falha de parse em tempo de execução. Erros de runtime se limitam a excesso do limite de passos e alguns casos de incompatibilidade de tipo.

## Erros e feedback

### Erros de parse-time (visíveis)

`upload_drone_script` aceita o script (retornando `Script uploaded successfully.`) ou rejeita com um erro de parse no formato `L<line>:C<column>: <message>`. O drone nunca executa um script que não passou no parse. Itere enviando, corrigindo o erro reportado, reenviando.

Erros de parse comuns:

* `expected '(' after "hull_pct"` — chamadas de função sempre precisam de parênteses
* `expected "END", got end-of-script` — `IF` não fechado
* `action "ATTACK" is not available for mining drones` — ação errada para o tipo de drone
* `ally_hull_below(N) requires a numeric argument` — passou uma string
* `script exceeds 2000 character limit` — reduza

Para limpar um script, envie uma string vazia. O drone fará `WAIT` todo tick até você dar um novo script.

### Feedback de runtime (limitado)

Uma vez que o script passa no parse, o feedback de runtime é enviado **apenas** ao dono do drone via mensagens de notificação específicas. Ações que falham são silenciosas. Não há um log de "meu script está se comportando mal" exposto ao jogador.

Você recebe notificação quando um drone:

* mina com sucesso (`mining_yield`: recurso, quantidade, restante)
* termina um SCAN (`drone_scan`: lista de jogadores no POI)
* termina um SURVEY (`drone_survey`: nome do POI e recursos)
* leva dano em batalha (`drone_update`: atacante, dano, tipo)
* é destruído (`drone_destroyed`: id do drone, matador, tipo)

Você NÃO recebe notificação quando um drone:

* tenta `MOVE "nonexistent_poi"` (não faz nada silenciosamente)
* tenta `MINE` em um POI sem recursos (não faz nada silenciosamente)
* tenta `DEPOSIT` sem estar em uma estação (não faz nada silenciosamente)
* tenta `ATTACK` sem alvo elegível no POI (não faz nada silenciosamente)
* excede o limite de 200 passos de avaliação (logado no servidor, drone fica idle)
* excede o limite de 512 caracteres de memória em um `SET_MEM` (logado no servidor, escrita ignorada)

Se um drone "não faz nada", `get_drone {"drone_id": "..."}` é a ferramenta de debug. Verifique `status`, `poi_id`, `traveling`, `cargo_used` e `memory`. Compare com o que seu script espera dados esses valores. Memória é especialmente útil como log de debug — escreva `SET_MEM "last_branch" "mining"` etc. para deixar rastros.

---

# Programas de exemplo (testados)

Adapte IDs de POI e estação para o seu sistema natal.

## Mining Drone — Loop de minerar e depositar

```
IF traveling()
  WAIT
ELSE IF cargo_full()
  IF at("sol_station")
    DEPOSIT
  ELSE
    MOVE "sol_station"
  END
ELSE
  IF at("sol_belt")
    MINE
  ELSE
    MOVE "sol_belt"
  END
END
```

O drone faz vaivém entre o belt e a estação para sempre. Se o belt secar, `MINE` falha silenciosamente naquele tick — considere adicionar um check `resource_available()` e um POI de fallback.

## Mining Drone — Multi-belt com memória

```
IF traveling()
  WAIT
ELSE IF cargo_full()
  IF at("sol_station")
    SET_MEM "target" ""
    DEPOSIT
  ELSE
    MOVE "sol_station"
  END
ELSE IF mem("target") == ""
  IF resource_available()
    SET_MEM "target" "sol_belt"
    MINE
  ELSE
    SET_MEM "target" "sol_belt_2"
    MOVE "sol_belt_2"
  END
ELSE IF at("sol_belt_2")
  IF resource_available()
    MINE
  ELSE
    MOVE "sol_station"
  END
ELSE
  MOVE "sol_belt"
END
```

## Combat Drone — Patrulha com retirada por casco

```
IF in_battle()
  IF hull_pct() < 30
    RETREAT
  ELSE
    STANCE "fire"
  END
ELSE IF enemy_nearby()
  ATTACK "nearest"
ELSE IF pirate_nearby()
  ATTACK "nearest"
ELSE
  WAIT
END
```

Esse drone luta contra qualquer hostil que apareça. Defina a posição com `MOVE` primeiro se quiser que ele acampe em um POI específico.

## Combat Drone — Acampar o cinturão de asteroides

```
IF traveling()
  WAIT
ELSE IF in_battle()
  IF hull_pct() < 25
    RETREAT
  ELSE
    STANCE "fire"
  END
ELSE IF enemy_nearby()
  ATTACK "nearest"
ELSE IF at("sol_belt")
  WAIT
ELSE
  MOVE "sol_belt"
END
```

## Repair Drone — Cuidar do dono

```
IF owner_hull_pct() < 70
  REPAIR "owner"
ELSE
  WAIT
END
```

Simples. O drone repara você sempre que estiver abaixo de 70% e você estiver no mesmo POI.

## Repair Drone — Médico de campo da facção

```
IF owner_hull_pct() < 50
  REPAIR "owner"
ELSE IF ally_hull_below(60)
  REPAIR "nearest_ally"
ELSE IF owner_hull_pct() < 100
  REPAIR "owner"
ELSE
  WAIT
END
```

Prioriza o dono quando ele está ferido, senão cura membros da facção.

## Salvage Drone — Limpeza de campo de destroços

```
IF traveling()
  WAIT
ELSE IF cargo_full()
  IF at("nebula_station")
    DEPOSIT
  ELSE
    MOVE "nebula_station"
  END
ELSE IF at("nebula_wrecks")
  IF tick() % 2 == 0
    LOOT "nearest"
  ELSE
    SALVAGE "nearest"
  END
ELSE
  MOVE "nebula_wrecks"
END
```

Alterna loot e salvage no local. Quando o destroço tem cargo, `LOOT` pega rápido; `SALVAGE` vai raspando o casco para materiais.

## Scout Drone — Patrulha periódica

```
IF traveling()
  WAIT
ELSE IF tick() % 10 == 0
  SCAN
ELSE IF mem("phase") == "surveyed"
  WAIT
ELSE
  SET_MEM "phase" "surveyed"
  SURVEY
END
```

Faz survey uma vez na primeira chegada, depois scan do POI a cada 10 ticks para detectar movimento de jogadores.

## Par de Combat Drones — Papéis diferentes, mesmo gatilho

Memória é por-drone — não há estado compartilhado entre drones. Ainda é possível construir um par coordenado dando a dois drones scripts diferentes que respondem ao mesmo campo de batalha. Drone A vai agressivo enquanto Drone B kita:

```
// Drone A — bruiser
IF in_battle()
  STANCE "fire"
ELSE IF enemy_nearby()
  ATTACK "nearest"
ELSE
  WAIT
END
```

```
// Drone B — kiter
IF in_battle()
  IF hull_pct() < 60
    RETREAT
  ELSE
    STANCE "evade"
  END
ELSE IF enemy_nearby()
  ATTACK "nearest"
ELSE
  WAIT
END
```

Ambos engajam em `enemy_nearby()`, mas adotam stances diferentes e o Drone B recua mais cedo. Dois drones, uma batalha, dois papéis.

---

# Navios Carrier

Baías de drone vão em **slots de utilidade**, e a maioria dos navios de tier baixo tem apenas um ou dois slots de utilidade — suficiente para uma Light Drone Bay, não para uma frota real. Carriers são cascos construídos em torno de grande número de slots de utilidade (3–8 cada), permitindo empilhar vários módulos de baía para capacidade e bandwidth sérios.

Treze cascos carrier dedicados à venda, distribuídos pelos empires:

| Empire | Tier | Navio | Slots de utilidade | Baías de drone instaladas por padrão |
| --- | --- | --- | --- | --- |
| Crimson | T2 | Cudgel | 3 | 2× Light Drone Bay |
| Nebula | T2 | Franchise | 4 | 2× Light Drone Bay |
| Outer Rim | T2 | Swarm Boss | 4 | 2× Light Drone Bay |
| Solarian | T2 | Postulate | 4 | 2× Light Drone Bay |
| Voidborn | T3 | Gestalt | 5 | Nenhuma |
| Crimson | T4 | Executioner | 4 | Advanced + Combat Drone Bay |
| Outer Rim | T4 | Excessive Force | 6 | Advanced + Combat Drone Bay |
| Solarian | T4 | Pantheon | 6 | Advanced + Combat Drone Bay |
| Voidborn | T4 | Superposition | 6 | Advanced + Combat Drone Bay |
| Crimson | T5 | Subjugator | 6 | Nenhuma |
| Outer Rim | T5 | Controlled Chaos | 8 | Nenhuma |
| Nebula | T5 | Exchange | 8 | Nenhuma |
| Voidborn | T5 | Overmind | 8 | Nenhuma |

Os carriers T2 e T4 já vêm com baías de drone instaladas, permitindo carregar e lançar drones no dia 1. O Gestalt e os carriers T5 vêm **sem baías de drone** — a lista `defaultModules` deles tem equipamento não-drone. Compre módulos de baía separadamente e use `install_mod` nos slots de utilidade.

Build típico de meio-jogo: Gestalt (T3, 5 slots de utilidade) + 2× Combat Drone Bay = 6 capacidade / 100 bandwidth. Endgame: Exchange (T5, 8 slots de utilidade) + 2× Advanced Drone Bay = 10 capacidade / 160 bandwidth, deixando slots para utilidades não-drone. Carriers trocam slots de arma por slots de utilidade — não são brawlers solo, são plataformas para o que você implanta.

---

# Skill Drone Control

`drone_control` está na categoria Drones e treina implantando drones e deixando seus scripts executarem. **Cada ação de drone que não seja `WAIT` dá 5 XP** à skill `drone_control` do dono.

| Nível | Efeito |
| --- | --- |
| Por nível | +1% dano de drone, +1% rendimento de mineração, +1% taxa de reparo |
| Máximo | 100 |

No nível 20: drones causam 20% mais dano, mineram 20% mais, e reparam 20% mais rápido. No nível 100 cada bônus é +100%. XP de skill é generoso — uma frota de mining drones trabalhando um belt por algumas horas já leva ao nível 5+ trivialmente.

A skill NÃO aumenta capacidade de baía nem bandwidth. Isso vem de hardware.

---

# Referência de comandos

```
load_drone        {"item_id": "combat_drone"}
unload_drone      {"drone_id": "abc123"}
deploy_drone      {"drone_id": "abc123"}
recall_drone      {"drone_id": "abc123"} | {"all": true}
upload_drone_script {"drone_id": "abc123", "script": "IF ... END"}
get_drones                                    // lista todos os drones (na baía + implantados)
get_drone         {"drone_id": "abc123"}      // detalhe completo incluindo script + memória
```

`load_drone`, `unload_drone`, `deploy_drone` e `recall_drone` são mutações (uma por tick).
`upload_drone_script`, `get_drones` e `get_drone` são queries (gratuitas, instantâneas).

---

# Notas táticas

**Drones não são esponjas de dano.** Combat drones têm 50 de hull. Um navio T2 de jogador pode matar um em poucas salvas. Não espere que um único combat drone vença um 1v1 contra um jogador. Três combat drones em onda coordenada é muito mais difícil de lidar.

**Drones não se reabastecem e não se reparam sozinhos.** Um combat drone que sobrevive a uma batalha continua danificado. Recolha-o à baía; redesplegar NÃO restaura o hull. Use um repair drone em conjunto, ou descarte e substitua drones danificados.

**Mining drones vencem mineração de jogador em rendimento sustentado, perdem em taxa.** Um jogador num belt com uma mining laser T3 extrai mais rápido que um único mining drone. Mas o drone trabalha enquanto você dorme. Três drones em um belt superam a produção de um jogador cansado na hora 6.

**Salvage drones perdem para rebocar (towing) em valor, ganham em autonomia.** Sempre reboque destroços valiosos você mesmo. Mande drones em destroços de baixo valor que você ignoraria.

**Scout drones são o melhor investimento de inteligência do jogo.** Um scout drone estacionado num POI de chokepoint fazendo scan a cada 10 ticks transforma atividade invisível em feed de notificações. Barato, baixo bandwidth, difícil de perder.

**`enemy_nearby()` é restrito por facção. Cuidado.** Se seu personagem não tem facção, seus combat drones consideram todo jogador undocked como inimigo. Lutar contra aliados aleatórios por esquecer de entrar numa facção é um jeito confiável de acabar em guerra com todos.

**Teste scripts em drones baratos primeiro.** Uma frota de 5 combat drones custa ~9.500 créditos em `baseValue`. Um script com bug que engaja sem lógica de retirada pode perder a frota toda em 5–10 minutos contra um único atacante competente — os drones morrem em série, sem redeploy automático. Construa a lógica do script em um drone primeiro; clone depois que funcionar.

**Use `SET_MEM` como rastro (breadcrumbs).** Runtime é silencioso para a maioria das falhas (ver "Erros e feedback"). Espalhar escritas `SET_MEM "phase" "mining"` no script faz `get_drone` mostrar qual ramo o drone está realmente executando.

**Memória é por-drone.** Dois drones não podem compartilhar estado. Coordene escrevendo scripts diferentes que respondem a gatilhos sobrepostos.

---

# Resumo

**Seu trabalho:** carregar → script → implantar → lucrar. Drones são extensões autônomas de você. Mineram, lutam, reparam, saqueiam e exploram enquanto você faz outras coisas.

**Melhor renda:** Frota de mining drones num belt rico enquanto você comercia. Salvage drone num campo de destroços enquanto você faz missões.

**Melhor segurança:** Combat drone acampando um chokepoint perto da sua base. Piratas que aparecem para te atacar acabam despedaçados por um drone que você esqueceu que tinha implantado três dias atrás.

**Não se preocupe com:** Otimizar scripts no primeiro dia. Comece com um loop de mineração de 5 linhas. Chegue a `drone_control` 5. Depois escreva algo mais elaborado.

**Próximo passo:** Compre um `mining_drone` e uma `light_drone_bay`, instale a baía, rode este script:

```
IF traveling()
  WAIT
ELSE IF cargo_full()
  IF at("YOUR_HOME_STATION")
    DEPOSIT
  ELSE
    MOVE "YOUR_HOME_STATION"
  END
ELSE
  IF at("YOUR_NEAREST_BELT")
    MINE
  ELSE
    MOVE "YOUR_NEAREST_BELT"
  END
END
```

Substitua os dois IDs de POI pelos valores de `get_system`. Implante. Vá fazer outra coisa. Volte com o armazenamento abastecido.
