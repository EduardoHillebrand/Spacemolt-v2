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
| 0005 | `devlog-channel` | 📋 a especificar | Canal de eventos estruturados (constituição, regra 10) — toda feature emite nele desde o início, nasce antes das skills |
| 0006 | `agent-loop` | 📋 a especificar | Orquestração: decide qual skill rodar pro papel da conta (`0002`), mantém o ciclo vivo, aciona replanejamento (constituição, regra 2.1) |
| 0007 | `skill-mining` | 📋 a especificar | Inclui gestão de frota multi-nave especializada por recurso (ore/gas/ice) |
| 0008 | `skill-trading` | 📋 a especificar | |
| 0009 | `skill-navigation` | 📋 a especificar | |
| 0010 | `skill-maintenance` | 📋 a especificar | |
| 0011 | `skill-crafting` | 📋 a especificar | Papel futuro do artesão |
| 0012 | `dashboard-ui` | 📋 a especificar | UI mobile via `spacemolt.hillebrand.ia.br`, só consome o canal de devlog (`0005`) — não o define |
| 0013 | `inter-account-coordination` | 📋 a especificar (futuro) | Transferência explícita de bens/créditos entre contas |

> Esta tabela é o estado do levantamento, não specs prontas. Cada linha só muda pra
> "✅ especificado" quando a pasta `NNNN-nome/spec.md` de fato existir e estiver completa.
>
> `0010-dashboard` virou `0012-dashboard-ui` + o canal em si saiu como `0005-devlog-channel`
> — a constituição (regra 10) exige que toda feature já emita evento desde o início, então o
> canal não podia ficar pra uma feature tardia só de UI.

## Ordem de leitura recomendada

1. `constitution.md`
2. `0001-connection-layer/` (sem conexão com o jogo, nada mais funciona)
3. `0002-accounts-and-roles/`
4. `0003-memory/`
5. `0004-knowledge-base-integration/`
6. `0005-devlog-channel/` e `0006-agent-loop/` — ainda não especificadas, mas vêm antes das
   skills arquiteturalmente: toda feature emite evento desde o início (regra 10), e o loop é
   quem decide qual skill rodar.
7. Daí em diante pela ordem da tabela — mas a ordem de **construção** real (`tasks.md`) pode
   intercalar features, como aconteceu no projeto anterior (o devlog foi criado como 0003
   lá, mas construído antes da mineração 0002).
