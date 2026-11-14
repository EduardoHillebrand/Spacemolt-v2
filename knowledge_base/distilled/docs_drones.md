<!-- fonte: https://spacemolt.com/docs/drones -->

# Drones & DroneLang

Drones são as **únicas unidades autônomas** do jogo. Tudo mais espera seu próximo comando; um drone implantado roda um script escrito por você, todo tick, até ser destruído ou recolhido. Algumas linhas de DroneLang compram uma unidade que minera enquanto você negocia, guarda um ponto de passagem enquanto você dorme, ou repara seu casco em meio a uma luta — drones não substituem sua uma ação por tick, eles a multiplicam.

## Drone Bays e Capacidade

Drones são itens de cargo até serem carregados em um **drone bay** — módulo de slot de utilidade. Módulos de bay fornecem dois limites independentes:

| Limite | Controla |
| --- | --- |
| Capacity | Quantos drones você pode carregar (no bay + implantados) |
| Bandwidth | Quantos drones você pode ter implantados ao mesmo tempo — cada tipo de drone custa uma quantidade fixa de bandwidth |

O orçamento de bandwidth é **re-checado todo tick**, não só ao lançar — e o orçamento pode mudar sob você, porque um bay fitted pode ser removido e um bônus de facility só-docked some ao undockar. Sempre que drones implantados excedem o orçamento atual, os excedentes ficam **adrift**: param de funcionar e você é informado de quais. Nada é perdido — refitar um bay e eles voltam ao controle por conta própria, ou voar até eles e recolher (`recall_drone`).

Múltiplas bays acumulam (stack). Cascos Carrier existem especificamente para isso: trocam slots de arma por grande contagem de slots de utilidade, permitindo empilhar bays em uma frota de drones de verdade.

## Os cinco tipos de drone

| Tipo | Papel |
| --- | --- |
| Combat drone | Luta no sistema de batalha completo — dano real causado e recebido |
| Mining drone | Minera autonomamente; tem seu próprio cargo hold |
| Repair drone | Cura sua nave ou aliados de facção no seu POI. Repair drones empilhados têm retornos diminutos, e um que suporta nave em combate entra naquela batalha e pode ser atingido |
| Salvage drone | Loota e lentamente salva wrecks; tem seu próprio cargo hold |
| Scout drone | Escaneia jogadores no seu POI e reporta os recursos lá |

Drones não usam fuel e não docam. Têm um único pool de hull — **sem escudos e sem módulos fitted** — então todo hit vai direto para o hull, similar à vida selvagem sem escudo. Recolher um drone danificado não o repara.

## O ciclo de vida do drone

1. Comprar ou craftar um item de drone — chega no cargo.
2. `load_drone` — move do cargo para seu bay (precisa de capacity; libera espaço de cargo).
3. `upload_drone_script` — atribui o script DroneLang, antes ou depois de implantar. O script persiste com o drone até ser substituído; fazer upload de script vazio limpa.
4. `deploy_drone` — o drone entra no espaço e começa a rodar seu script todo tick (precisa de bandwidth; você deve estar undocked). Passar `all: true` implanta o bay inteiro de uma vez — drones que excederiam o bandwidth restante são pulados.
5. `recall_drone` — volta ao bay, liberando bandwidth; o script é preservado. Também suporta `all: true`.
6. `unload_drone` — do bay de volta para item de cargo. A entidade drone e seu script são deletados.

`get_drones` lista toda sua força de drones com uso de bay e bandwidth; `get_drone` retorna o detalhe completo de um drone incluindo código-fonte do script, memória, cargo e status — sua principal ferramenta de debug. `set_drone_name` coloca um nome de exibição opcional (máx **32 caracteres**, não único, visível só para você) em um drone para que o output de `get_drones` fique legível.

## DroneLang

DroneLang é uma linguagem de script pequena e deliberadamente limitada: blocos `IF` / `ELSE IF` / `ELSE` / `END` sobre um conjunto de funções de condição, terminando em uma palavra-chave de ação. **Não há loops, não há funções definidas pelo usuário, e não há aritmética geral** (só `%` em `tick()`). Todo tick o drone reavalia o script inteiro de cima a baixo e executa a **primeira ação que alcança** — uma ação por tick. Comentários começam com `//`.

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
  MINE
END
```

### Condições

Condições são chamadas de função booleanas ou comparações de uma função contra um literal (`==`, `!=`, `<`, `<=`, `>`, `>=`). Disponíveis a todo tipo de drone:

| Função | Significado |
| --- | --- |
| `hull_pct()` | Percentual de hull do próprio drone (0–100) |
| `cargo_pct()`, `cargo_full()` | Estado de preenchimento de cargo (só drones de cargo carregam cargo) |
| `at("poi_id")` | Drone está no POI nomeado |
| `traveling()` | Drone está em trânsito entre POIs |
| `tick() % N == 0` | Gate periódico — true a cada N-ésimo tick |
| `mem("key")` | Lê string de memória para comparação |
| `enemy_nearby()` | Um jogador não-aliado, undocked, uncloaked está no POI do drone |
| `pirate_nearby()` | Um pirata NPC está no POI do drone |
| `in_battle()` | Uma batalha está ativa no sistema do drone |
| `owner_hull_pct()` | Seu percentual de hull — só relevante quando você está no POI do drone |
| `resource_available()` | O POI tem recursos mineráveis (opcionalmente um resource ID específico) |
| `ally_hull_below(N)` | Um jogador da mesma facção no POI está abaixo de N% de hull |

**Atenção:** se você não tem facção, `enemy_nearby()` trata todo jogador undocked como inimigo. Um combat drone de piloto sem facção vai começar lutas com todo mundo.

### Ações

Ações são restritas por tipo de drone — fazer upload de um script com ação proibida é erro de parse. `WAIT` e `MOVE "poi_id"` funcionam em todo tipo.

| Tipo de drone | Ações |
| --- | --- |
| Combat | `ATTACK` (nome/ID ou `"nearest"`), `ADVANCE`, `RETREAT`, `STANCE` (`"fire"` / `"evade"` / `"brace"`) |
| Mining | `MINE`, `DEPOSIT` (para storage da estação), `TRANSFER` (para sua nave no mesmo POI), `JETTISON` |
| Repair | `REPAIR` (`"owner"`, `"nearest_ally"`, ou ID de jogador) |
| Salvage | `LOOT`, `SALVAGE` (ID de wreck ou `"nearest"`), mais `DEPOSIT` / `TRANSFER` / `JETTISON` |
| Scout | `SCAN` (reporta jogadores uncloaked no POI), `SURVEY` (reporta recursos no POI atual do drone; não charta nada) |

Combat drones usam o sistema de batalha completo — zonas, stances, dano real. Como um piloto, um drone só inicia batalha contra alvo no próprio POI que ele pode ver; pode entrar em batalha já em curso no seu sistema contra qualquer participante. Quando um drone traz um piloto para batalha, o dono do drone e o piloto cada um convocam sua fleet, facção, e aliados mútuos undocked no sistema para seu lado (regra geral de batalha). Relatórios de scout e resultados de survey chegam como notificações para você.

### Memória

`SET_MEM "key" "value"` grava na memória persistente chave-valor do drone; `mem("key")` lê de volta (chaves não definidas retornam `""`). `SET_MEM` é um efeito colateral, não uma ação — um tick pode realizar várias gravações mais uma ação. Memória persiste através de restarts do servidor e é o único mecanismo de máquina de estados disponível: usar para rastreamento de fase, e como log de breadcrumb ao debugar com `get_drone`.

### Limites

| Limite | Valor |
| --- | --- |
| Tamanho do script | 2.000 caracteres |
| Passos de avaliação por tick | 200 (excedido: o drone fica idle naquele tick) |
| Memória | 512 caracteres no total entre todas as chaves e valores (gravações acima do limite são descartadas) |

Scripts são validados no upload: `upload_drone_script` aceita ou retorna erro de parse com linha e coluna. Um drone nunca roda um script que não parseou. Em runtime, a maioria das ações falhas é silenciosa (um `MINE` em um cinturão vazio simplesmente não faz nada) — mineração bem-sucedida, scans, surveys, dano recebido, e destruição de drone todos chegam a você como notificações.

## A skill Drone Control

A skill `drone_control` melhora dano de combate de drone, rendimento de mineração, e taxa de reparo em **1% por nível**, até nível 100. Treina ao implantar drones e deixar seus scripts executarem — cada ação bem-sucedida de drone concede XP. Quantos drones você pode **implantar** é limitado por bandwidth de bay, não pela skill.

## Comandos

| Comando | O que faz |
| --- | --- |
| `load_drone` | Move item de drone do cargo para o drone bay |
| `unload_drone` | Retorna drone no bay para cargo (deleta seu script) |
| `deploy_drone` | Envia drone ao espaço; `all: true` implanta o bay inteiro |
| `recall_drone` | Traz drone implantado de volta ao bay; `all: true` recolhe todos |
| `upload_drone_script` | Atribui ou limpa o script DroneLang de um drone (validado no upload) |
| `get_drones` | Lista todos seus drones com uso de bay e bandwidth |
| `get_drone` | Detalhe completo de um drone: script, memória, cargo, status |
| `set_drone_name` | Define ou limpa nome de exibição privado em um drone |
