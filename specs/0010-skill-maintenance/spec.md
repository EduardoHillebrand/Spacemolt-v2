# 0010 — Maintenance

> **Nota de arquitetura (2026-11-14)**: mesmo caso de `0009-skill-navigation`. A pesquisa
> feita antes desta spec (lendo `knowledge_base/distilled/docs_ships.md`,
> `docs_shipyard.md`, `docs_death.md`, `docs_guides_fuel.md`, e as seções `spacemolt_ship`/
> `spacemolt_facility` do `SKILL_MANUAL.md`) mostrou que manutenção é "majoritariamente
> passiva/leve, encaixando no mesmo padrão de parada que `mining`/`trading` já fariam" —
> checar e reparar o casco não compete por um ciclo próprio, é algo que se faz na mesma
> parada em que a nave já vai vender carga ou reabastecer. Por isso, assim como `0009`, esta
> **não é uma skill que compete no loop** — é um módulo compartilhado em `app/core/`,
> chamado de dentro do Executor de `mining` (`0007`), `trading` (`0008`) e `crafting`
> (`0011`) nos pontos naturais em que a nave já está parada numa estação. Mantém o número e
> a pasta do backlog publicado; o conteúdo abaixo já reflete a correção.

## O quê

Existe uma função única, `checkAndRepair(ctx)`, que lê a saúde do casco da nave ativa e, se
estiver abaixo de um limiar, repara — usando créditos numa estação (se a nave estiver
docada) ou repair kits do cargo (se estiver no espaço) — e uma função separada,
`checkInsurance(ctx)`, que confirma se a apólice de seguro está válida antes de uma skill
undockar a nave pra uma atividade de risco (carga valiosa, zona sem lei). Nenhuma das duas
decide *quando* rodar — isso é escolha de quem chama, nos pontos em que já faz sentido
parar.

## Por quê

- `mining`, `trading` e `crafting` (e qualquer skill futura) vão todas, eventualmente,
  precisar checar/reparar o casco e confirmar seguro — sem este módulo, cada uma
  reimplementaria a mesma checagem (constituição, regra 5).
- Morte de nave (`docs_death.md`) é cara: casco destruído pra sempre, ~70% dos módulos e
  50–80% do cargo perdidos como wreck saqueável. Reparo preventivo e seguro válido são a
  única mitigação documentada antes do fato — vale centralizar essa lógica num único lugar
  testável, não espalhar a decisão "será que devia reparar agora" por cada skill.

## Requisitos funcionais

1. `checkAndRepair(ctx)` lê o casco atual da nave (`get_ship`) e decide se repara, usando um
   limiar (ver `plan.md` — não documentado pelo jogo, decisão própria do agente, revisável).
2. **Dois caminhos de reparo, escolhidos automaticamente pelo contexto**: créditos numa
   estação com serviço de reparo (se a nave estiver docada), ou repair kit do cargo (se
   estiver no espaço) — `checkAndRepair` escolhe o caminho disponível, nunca exige que quem
   chama diga qual usar.
3. **`checkAndRepair(ctx, { target: "fleet" })` como checagem gratuita**: expõe a variante
   sem custo (`repair target=fleet`) pra consultar status de casco sem gastar nada — útil
   pra decidir, antes de agir, se vale a viagem até o reparo de verdade.
4. `checkInsurance(ctx)` confirma se há apólice de seguro válida (`view_insurance`) antes de
   uma atividade arriscada; se não houver e for possível comprar, pode comprar
   (`buy_insurance`) — decisão de fazer isso ou não fica num parâmetro explícito, não
   automática por padrão (comprar seguro custa crédito que a skill chamadora pode preferir
   gastar de outro jeito).
5. **Resultado claro em toda chamada** (constituição, regra 6): reparado com sucesso; não
   precisava reparar; impedido com motivo (sem crédito, sem repair kit, sem serviço de
   reparo disponível) — nunca lança exceção.
6. **Não decide abandonar a atividade atual por conta própria**: se o reparo falhar (ex.
   sem recursos pra reparar), `checkAndRepair` só reporta isso — decidir se a skill chamadora
   continua arriscando o casco, aborta, ou tenta de outro jeito é dela, não deste módulo.

## Fora do escopo desta spec

- **Combustível** — já é responsabilidade de `0009-navigation` (`goTo`/`ensureFuel`), não
  duplicado aqui.
- **Recuperação de wreck ou lógica de morte/respawn** — evento de combate, fora do backlog
  atual (não existe spec de combate ainda); `checkInsurance` só garante que a apólice exista
  *antes* do evento, não trata o que acontece depois.
- **Desgaste de módulo por uso** (ex. laser "gastando" com o tempo) — não documentado em
  nenhuma das fontes lidas; se existir, é descoberta pra uma validação manual futura, não
  suposição desta spec.
- **Ser uma skill registrada no `skill_registry`** (spec `0006`) — mesma razão de `0009`.
- **Decidir *quando* parar pra manutenção** — isso é do Planner de quem chama (ex.
  `mining` decide "já que vou parar pra vender, chamo `checkAndRepair` também").

## Critério de sucesso

- Com o casco abaixo do limiar escolhido e a nave docada, `checkAndRepair` repara usando
  créditos e confirma via `get_ship` que o casco subiu.
- Com o casco abaixo do limiar e a nave no espaço com repair kit no cargo, `checkAndRepair`
  repara usando o kit (sem precisar dockar).
- Forçar um cenário sem crédito e sem repair kit: `checkAndRepair` devolve um resultado
  claro de impedimento, não trava nem lança exceção.
- `checkInsurance` confirma corretamente se há apólice válida antes de uma ação simulada de
  risco (teste automatizado, sem precisar arriscar uma nave de verdade pra validar isso).
