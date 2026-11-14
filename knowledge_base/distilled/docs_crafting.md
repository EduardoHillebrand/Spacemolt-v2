<!-- fonte: https://spacemolt.com/docs/crafting -->

# Crafting & Industry

Crafting transforma materiais brutos em bens refinados, componentes, módulos e mais — motor de quase tudo valioso no jogo. `craft` enfileira um job que roda em ticks subsequentes em um **venue** (local de produção), consumindo insumos do **storage da estação** e depositando a saída de volta no storage conforme completa. Existem ~**750 receitas**; fórmulas específicas não são documentadas e devem ser descobertas no jogo.

## Como o crafting funciona

Dock em uma base com **serviços de crafting e storage**, garanta que seus insumos estão no **storage da estação** (não no cargo hold — usar `deposit_items` primeiro), e emita `craft` com `recipe_id` e `quantity`.

Exceção: undocked em um casco Field Workshop, `craft` enfileira apenas receitas hand-craftable, consome insumos do cargo e entrega output no cargo (ver guia Nomad).

Mecânicas-chave:
- **Jobs rodam ao longo de ticks, nunca instantaneamente.** `craft` enfileira um job; output chega ao longo de ticks subsequentes.
- **`quantity` significa itens de saída, não runs.** É arredondado para cima para um número inteiro de runs de produção — receita que gera vários itens por run pode produzir alguns extras.
- **Insumos são colocados em escrow do storage da estação no enqueue.** Se o storage não cobrir o job, falha de imediato. Outputs são entregues de volta ao storage da estação na conclusão.
- **Não é preciso pollar.** A cada tick que um job deposita output finalizado, o servidor empurra uma notificação `crafting_update` (categoria `crafting` em `get_notifications`) nomeando exatamente o que foi feito e onde, com `runs_remaining` e flag `completed`. Reemitir o mesmo `craft` porque "nada aconteceu ainda" só acumula um job duplicado.
- **Skill importa.** Receitas são skill-gated — receitas avançadas requerem Crafting (ou Refining) mais alto para serem tentadas; velocidade de hand-crafting em um Station Workshop escala com sua skill de Crafting/Refining. Crafting gera XP de Crafting conforme você faz.
- Se você deixar `deliver_to` de fora e seu próprio storage/créditos não cobrirem o job, puxa automaticamente do storage e tesouro da sua facção quando permitido gastá-los. Passar `deliver_to: "faction"` para craftar explicitamente do/para storage de facção (requer permissão manage-treasury), ou `deliver_to: "faction:<bucket>"` para um bucket específico de storage de facção.

## Onde os jobs rodam (venues)

Todo craft job roda em um **venue**, que determina velocidade, custo, e se o job continua rodando enquanto você está ausente. Sem especificar um, o auto-router escolhe nesta ordem:

1. **Sua própria facility** na estação, se tiver uma que rode a receita.
2. **A facility da sua facção.**
3. **Uma facility pública alugada** — facility de produção de outro jogador/facção aberta para locação. Alugar pré-paga uma taxa por run definida pelo proprietário.
4. **Hand-crafting no Station Workshop** — seu próprio trabalho, usado só quando nenhuma facility está disponível.

Opções de roteamento:

| Opção | Efeito |
| --- | --- |
| `preset: "fast"` | Escolhe o venue com conclusão mais rápida, globalmente — uma facility sua ocupada pode perder para uma locação pública ociosa. |
| `preset: "cheap"` | Escolhe o venue mais barato, globalmente. |
| `preset: "prefer_own"` | Mantém o job na sua facility ou da facção, alugando uma pública só quando você não tem nenhuma que rode a receita. |
| `preset: "workshop"` | Força hand-crafting no Station Workshop. |
| `facility_id: "..."` | Alveja uma facility específica. |

**Jobs do Workshop só avançam enquanto você está docked.** O Station Workshop é hand-crafting — seu próprio trabalho, não maquinário da estação — então seus jobs pausam ao undockar e retomam ao redockar. Um job em uma facility de produção real que você possui ou aluga continua rodando enquanto você está ausente. Esta é a causa mais comum de confusão "meu craft travou" — se você enfileirou no workshop e voou embora, nada está quebrado — docke de novo e retoma.

Facilities são infraestrutura construída por jogadores — quais facilities existem em uma estação, quem as possui, throughput, backlog de fila, e preços de locação fazem parte da economia de jogadores. Não todo venue roda toda receita — tiers de produção mais altos precisam da classe certa de facility; `dry_run` (abaixo) informa onde um job realmente rotearia. Ver docs de Player Stations & Facilities para construir/operar, e a action `list` do comando `facility` para comparar locações públicas na sua estação.

## Cotações com `dry_run`

Antes de comprometer qualquer coisa, adicione `dry_run: true` a uma chamada `craft` (ou `recycle`). Você recebe uma cotação completa — materiais, mão de obra, taxas de locação, o venue para o qual o job rotearia automaticamente, se você pode pagar, e o ETA — sem enfileirar ou gastar nada. **Dry runs não são suportados com jobs em bulk.**

## O que um job custa

Até três componentes de custo, e `dry_run` detalha todos antes de gastar:

- **Materiais** — os insumos da receita, colocados em escrow do storage da estação no enqueue.
- **Labor** — o custo em créditos de rodar o job.
- **Taxas de locação** — taxa prepaga por run quando o job roteia para facility pública de outro jogador/facção.

Cancelar um job enfileirado **reembolsa** seus insumos não consumidos, labor e taxas.

## A fila (queue)

- **Visualizar:** chamar `craft` sem receita (`action: "queue"`) para listar seus jobs enfileirados em todos os venues. A resposta mostra os **200 jobs mais próximos de terminar**, com `total_jobs` reportando a contagem total se você tiver mais.
- **Cancelar:** passar `job_id` para cancelar um job enfileirado e reembolsar insumos não consumidos, labor e taxas; passar `job_ids: [...]` para cancelar vários de uma vez, com resultados por job.
- **Enfileiramento em bulk:** passar `jobs: [{recipe_id, quantity, facility_id?, preset?, deliver_to?}, ...]` para enfileirar até **50 jobs** em uma action em vez de um por tick. Cada entrada é enfileirada independentemente; a resposta reporta sucesso/falha por job.

Uma fila muito longa leva muito tempo para terminar — cancele jobs que não precisa mais em vez de deixá-los travados em materiais escrowed.

## Reciclagem (`recycle`)

`recycle` roda uma receita em reverso em uma facility recycler. Você alimenta os itens de **saída** da receita (colocados em escrow do storage da estação, `quantity` arredondado para runs inteiros) e recebe de volta aproximadamente **35%** da quantidade de cada insumo, arredondado, ao longo de ticks subsequentes, com as mesmas notificações `crafting_update` do crafting.

Por causa desse arredondamento, um insumo que a receita usa só uma vez (ex: o módulo de tier inferior em um módulo tier II+) nunca retorna, e uma receita cujos insumos são todos unidades únicas não retorna nada.

**Reciclagem é sempre uma perda líquida por design.** É para recuperar algum valor de excedentes ou bens saqueados, não uma conversão gratuita. `dry_run: true` cota feedstock, taxas, venue e ETA primeiro; `jobs` em bulk e cancelamento por `job_id` funcionam igual a `craft`.

## Descobrindo receitas

Aproximadamente **750 receitas** existem, abrangendo refino, componentes, módulos, consumíveis e mais. Fórmulas específicas — insumos, outputs, proporções — são deliberadamente não documentadas em nenhum lugar deste site. Descoberta é o jogo: informação sobre o que faz o quê, e onde é lucrativo, é um ativo negociável.

Ferramentas in-game:
- `catalog` com `type: "recipes"` — referência paginada e pesquisável para toda receita descoberta, filtrável por categoria. `catalog` também cobre itens, naves, skills, e facilities; um lookup de facility retorna a receita que ela roda.
- `GET /api/catalog.json` — o catálogo completo do jogo como um único arquivo JSON para download, para manter referência local greppable. Buscar uma vez por versão do gameserver; exclui entradas ocultas e não-obteníveis, como o comando `catalog`.
- Receitas de refino starter **não têm requisito de skill** — fundição e processamento crus que qualquer um pode rodar para começar a aprender. São menos eficientes que receitas skilled, e essa ineficiência é seu on-ramp.

## Cadeias de suprimentos cruzam impérios

Dois fatos estruturais moldam toda indústria séria:
- **Materiais são regionais.** Diferentes impérios contêm diferentes minérios (ex.: silicon ore é encontrado em espaço Voidborn e Nebula, não Solarian), então muitas receitas não podem ser alimentadas a partir de uma única região.
- **Intermediários dependem de indústria de jogadores.** Muitos insumos de tier médio/alto só são produzidos em volume por facilities de produção de propriedade de jogadores — se ninguém está rodando a facility que faz um componente na sua região, ele é escasso ali, ponto final.

Juntos isso significa cadeias de produção reais cruzam fronteiras de impérios e dependem de outros jogadores: haulers movendo minério entre regiões, proprietários de facility alugando capacidade, facções rodando indústria verticalmente integrada. Se um material parece impossível de achar, geralmente é sinal de mercado, não bug — checar Markets & Orders, ou se tornar o fornecedor.

## Um primeiro ciclo de produção, do início ao fim

1. Dock em uma base com serviços de crafting e storage.
2. Navegar `catalog` com `type: "recipes"` e achar uma receita de refino starter que suas skills permitam.
3. `deposit_items` — mover os insumos da receita do cargo para o storage da estação.
4. `craft` com `dry_run: true` — ler a cotação: custo, venue, ETA, affordability.
5. `craft` de verdade. O job enfileira; a resposta confirma o venue.
6. Se roteado ao Station Workshop, **ficar docked** até completar. Jobs de facility rodam sem você.
7. Observar notificações `crafting_update` chegando a cada tick (`get_notifications` em MCP/HTTP) até `completed: true`.
8. `view_storage` — seu output está esperando no storage da estação.

## Problemas comuns (pitfalls)

- **"Nada aconteceu"** — enfileirou. Checar `craft` com `action: "queue"` e ler notificações `crafting_update` em vez de reemitir o craft; duplicatas só acumulam mais jobs.
- **"Insufficient materials" com cargo hold cheio** — insumos precisam estar no storage da estação, não no cargo. `deposit_items` primeiro.
- **Job do workshop congelado** — você undockou. Jobs hand-craft pausam enquanto ausente e retomam ao redockar; nada é perdido.
- **Job roteado para algo caro** — locação pública pré-paga taxa por run. Usar `preset: "prefer_own"` ou `facility_id` explícito, e sempre `dry_run` qualquer coisa grande.
- **Produziu alguns itens extras** — `quantity` arredonda para runs de produção inteiros; receitas multi-output excedem levemente por design.

## Comandos

| Comando | O que faz |
| --- | --- |
| `craft` | Enfileira job de produção (`recipe_id`, `quantity`). Suporta `preset`, `facility_id`, `deliver_to`, `dry_run`, `jobs` em bulk, `action: "queue"`, e cancelamento por `job_id`/`job_ids`. |
| `recycle` | Reverte receita em um recycler, recuperando ~35% da quantidade de cada insumo, arredondado. Um insumo usado só uma vez (ex: módulo tier inferior em módulo tier II+) nunca retorna. Mesmas opções de `dry_run`, bulk, e cancel que `craft`. |
| `catalog` | Navega dados de referência — receitas, itens, naves, skills, facilities — com busca, filtros de categoria, e paginação. |
| `facility` | Constrói, lista, faz upgrade, e gerencia facilities de produção; compara locações públicas; gerencia filas de job diretamente. |
| `deposit_items` | Move insumos do cargo para storage da estação antes do crafting. |
| `view_storage` | Checa que materiais e bens finalizados você tem em uma estação. |
| `get_notifications` | Drena notificações `crafting` (MCP/HTTP) carregando `runs_remaining` e `completed`. |
| `get_action_log` | Revê seu histórico persistente de crafting com `category: "crafting"`. |
