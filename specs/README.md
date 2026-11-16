# Como funciona o `specs/`

Aqui mora a especificação do sistema. **A spec vem antes do código.**
Metodologia herdada de `D:\Projects\spacemolt-gateway\.specs\` (mesmo fluxo, já validado
em 10 features reais naquele projeto).

## O fluxo de 3 documentos (por feature)

Cada feature tem sua pasta `NNNN-nome/` com até 3 arquivos, nesta ordem:

| Arquivo | Responde | Pode falar de tecnologia? |
|---------|----------|---------------------------|
| `spec.md` | O **quê** e o **porquê** | Não. Só comportamento e regras. |
| `plan.md` | O **como** | Sim. Stack, arquitetura, arquivos. |
| `tasks.md` | Os **passos** | Lista pequena e checável. Cada item vira uma branch. |

Por que separar? Porque dá pra revisar o "o quê" sem se perder em detalhe técnico,
e dá pra trocar o "como" sem reescrever o "o quê".

## A constituição

`constitution.md` são as regras que valem pra **todas** as features (clean code,
git, planejar≠executar, isolamento por conta, memória em camadas, observabilidade,
segredos). Não é uma feature, é a base. Leia antes de tudo.

## Numeração

- Features: `0001-`, `0002-`, ... na ordem em que entram.
- A constituição não tem número (é fundação, não feature).

## Git

Commit direto na `main` ao fechar cada task — sem branch obrigatória por task (ver
constituição, regra 7). Branch só pra mudança arriscada que vale revisar isolada.
Repositório: `https://github.com/EduardoHillebrand/Spacemolt-v2.git`.

## Backlog planejado (ainda sendo levantado — ver estado abaixo)

| # | Pasta | Status | Resumo |
|---|-------|--------|--------|
| 0001 | `connection-layer` | ✅ especificado | Sessão HTTP API v2 / MCP, login das contas, retry/backoff em 429 |
| 0002 | `accounts-and-roles` | ✅ especificado | Conta = instância isolada com papel (minerador/comerciante/artesão), evolução de papéis |
| 0003 | `memory` | ✅ especificado | Estado operacional + lições aprendidas + integração com Captain's Log |
| 0004 | `knowledge-base-integration` | ✅ especificado | Como o agente consulta `knowledge_base/` via embeddings (`nomic-embed-text`) |
| 0005 | `devlog-channel` | ✅ especificado | Canal de eventos estruturados (constituição, regra 10) — toda feature emite nele desde o início, nasce antes das skills |
| 0006 | `agent-loop` | ✅ especificado | Orquestração: decide qual skill rodar pro papel da conta (`0002`), mantém o ciclo vivo, aciona replanejamento (constituição, regra 2.1) |
| 0007 | `skill-mining` | ✅ especificado | Skill real (Planner/Executor). Frota multi-nave simultânea explicitamente fora de escopo (API só pilota 1 nave ativa por vez) |
| 0008 | `skill-trading` | ✅ especificado | Skill real (Planner/Executor). Arbitragem dentro do Solarian; usa memória de longo prazo (`0003`) como catálogo de rotas conhecidas |
| 0009 | `skill-navigation` | ✅ especificado | **Não é skill registrada no loop** — módulo compartilhado em `app/core/` (`goTo`), consumido por `0007`/`0008`/`0011`. Ver nota de arquitetura no `spec.md` |
| 0010 | `skill-maintenance` | ✅ especificado | **Não é skill registrada no loop** — módulo compartilhado em `app/core/` (`checkAndRepair`/`checkInsurance`), consumido na mesma parada que `0007`/`0008`/`0011` já fariam |
| 0011 | `skill-crafting` | ✅ especificado | Skill real (Planner/Executor), papel futuro do artesão. Assume material já no storage da instalação — aquisição é escopo de `0014` |
| 0012 | `operator-directives` | ✅ especificado | Diretriz por conta (preferência estruturada + nota livre + pausa), editável por uma página web, sem editar código nem reiniciar o processo |
| 0013 | `dashboard-ui` | 📋 a especificar | Histórico/métricas/filtro além do feed cru ao vivo — o feed básico (sem histórico, sem filtro) já saiu como parte de `0012` (pedido do usuário depois de ver a página publicada). Renumerada de `0012` quando `operator-directives` entrou no backlog |
| 0014 | `inter-account-coordination` | 📋 a especificar (futuro) | Transferência explícita de bens/créditos entre contas. Renumerada de `0013` |

> Esta tabela é o estado do levantamento, não specs prontas. Cada linha só muda pra
> "✅ especificado" quando a pasta `NNNN-nome/spec.md` de fato existir e estiver completa.
>
> `0010-dashboard` virou `0013-dashboard-ui` + o canal em si saiu como `0005-devlog-channel`
> — a constituição (regra 10) exige que toda feature já emita evento desde o início, então o
> canal não podia ficar pra uma feature tardia só de UI. `0012-operator-directives` entrou
> no meio do backlog em 2026-11-15 (pedido do usuário, inspirado num mecanismo equivalente
> do projeto antigo — ver `log/decisoes.md`), empurrando `dashboard-ui` e
> `inter-account-coordination` um número cada.

## Ordem de leitura recomendada

1. `constitution.md`
2. `0001-connection-layer/` (sem conexão com o jogo, nada mais funciona)
3. `0002-accounts-and-roles/`
4. `0003-memory/`
5. `0004-knowledge-base-integration/`
6. `0005-devlog-channel/` e `0006-agent-loop/` — vêm antes das skills arquiteturalmente:
   toda feature emite evento desde o início (regra 10), e o loop é quem decide qual skill
   rodar.
7. `0009-skill-navigation/` e `0010-skill-maintenance/` antes de `0007`/`0008`/`0011` — são
   módulos compartilhados que as três skills reais consomem, não skills do loop.
8. Daí em diante pela ordem da tabela — mas a ordem de **construção** real (`tasks.md`) pode
   intercalar features, como aconteceu no projeto anterior (o devlog foi criado como 0003
   lá, mas construído antes da mineração 0002), e como aconteceu aqui também (`0009`/`0010`
   implementadas antes de `0007`/`0008`, por serem dependência de ambas).
