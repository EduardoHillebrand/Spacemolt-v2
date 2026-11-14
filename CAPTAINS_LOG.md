# Captain's Log — Projeto SpaceMolt Agent

> Log de continuidade da sessão de trabalho, não do jogo. Objetivo: se esta conversa se
> perder ou a janela fechar, uma sessão nova (sua ou de outro Claude) consegue ler isto e
> retomar exatamente de onde paramos, sem precisar re-perguntar decisões já tomadas.
>
> Atualizar este arquivo a cada marco relevante, não só no fim. Entradas mais novas no topo
> de cada seção.

---

## Onde paramos agora (2026-11-14)

Estamos seguindo SDD (spec → plan → tasks → código) pra construir um agente autônomo que
joga SpaceMolt. Fluxo e regras em `specs/README.md` e `specs/constitution.md`.

**Feature em andamento: `specs/0001-connection-layer/`**
- `spec.md` — ✅ escrito e aprovado.
- `plan.md` — ✅ escrito, **aguardando confirmação do usuário** sobre uma decisão importante:
  o plano propõe trocar a stack do projeto pra **TypeScript/Node** (em vez de Python).
  Motivo: `@spacemolt/lib` (a lib que o próprio jogo recomenda pra automação multi-conta)
  já resolve reconexão, retry de rate-limit e isolamento de sessão por conta — fazer isso em
  Python significaria reescrever tudo isso, ou misturar linguagens entre a camada de conexão
  (Node) e o resto (Python), o que vai contra a simplicidade da constituição.
  Pergunta feita ao usuário, ainda sem resposta: *"Topa a troca pra Node, ou prefere que eu
  reavalie Python antes de seguir pro tasks.md?"*
- `tasks.md` — ainda não escrito. **Próximo passo**: resolver a pergunta acima, depois
  escrever `tasks.md` desta feature.

**Backlog completo** (nenhuma das outras ainda especificada) está na tabela de
`specs/README.md`: `0002-accounts-and-roles`, `0003-memory`, `0004-knowledge-base-integration`,
`0005-skill-mining`, `0006-skill-trading`, `0007-skill-navigation`, `0008-skill-maintenance`,
`0009-skill-crafting`, `0010-dashboard`, `0011-inter-account-coordination`.

---

## Decisões já tomadas (não re-discutir sem motivo novo)

- **Projeto novo** em `D:\claude\spacemolt`, não continuação de nenhum dos dois projetos
  antigos (`D:\Projects\SpaceMolt`, `D:\Projects\spacemolt-gateway`) — só reaproveitamos
  padrões/lições deles, não o código.
- **Metodologia**: SDD, com a constituição revisada em `specs/constitution.md` (12 regras).
  Pontos que vieram de discussão explícita, não só herança do projeto antigo:
  - Três papéis separados: **Planner** (decide, puro) / **Decider** (único lugar que fala
    com LLM) / **Executor** (só roda, nunca decide) — regra 2.
  - Replanejamento explícito via condições de invalidação no plano — regra 2.1.
  - Decider é recurso compartilhado e lento (Ollama local é fraco) — arquitetura já pronta
    pra 3 contas concorrentes, mesmo que hoje só uma consiga "pensar" bem por vez na
    prática — regra 3.
  - Processo por conta via PM2, não concorrência dentro de um processo — regra 4.
  - Git simples: commit direto na `main`, branch só pra mudança arriscada — regra 7.
- **Contas e papéis** (visão de longo prazo: cadeia econômica entre elas, não 3 agentes
  isolados fazendo a mesma coisa):
  - **HilleBot** — minerador permanente; meta é evoluir eficiência e montar frota
    multi-nave especializada por recurso (ore/gas/ice).
  - **ironvex** ("IronVex Nocturn") — minerador por enquanto; candidato a migrar pra
    **artesão** (crafter) no futuro.
  - **Medici** — comerciante, registrada hoje (2026-11-14), Império **Solarian** (de
    propósito igual às outras duas — mantém a economia interna num território só).
  - Todas as credenciais em `accounts/<conta>/credentials.json`, gitignored, nunca
    impressas em log/chat.
- **Memória do agente** (distinta da memória desta sessão Claude): duas camadas — estado
  operacional (efêmero, reconstruível) + lições aprendidas (cumulativo, fonte de verdade) —
  mais o Captain's Log *nativo do jogo* (replay no login, até 20 entradas de 30KB) como
  rede de segurança mínima. Provavelmente usando embeddings via `nomic-embed-text` (já
  instalado no Ollama local) pra busca nas lições.
- **Infra existente que o agente vai usar**, não recriar: Cloudflare Tunnel `hillebrand-ia`
  (`spacemolt.hillebrand.ia.br` → porta 5000, mesma porta do dashboard antigo), PM2
  gerenciando processos, N8N, Ollama local, VPN WireGuard própria (Oracle Cloud).
- **Git**: repo `D:\claude\spacemolt`, remoto `https://github.com/EduardoHillebrand/Spacemolt-v2.git`,
  branch `main`, push já feito (2 commits iniciais: knowledge base + specs scaffolding).

---

## O que já existe no disco (mapa rápido)

```
D:\claude\spacemolt\
├── CAPTAINS_LOG.md              <- este arquivo
├── .gitignore                   <- accounts/, *.credentials.json, .env, logs, caches
├── links.txt                    <- seed original de URLs da documentação
├── knowledge_base/
│   ├── INDEX.md
│   ├── SKILL_MANUAL.md          <- manual oficial do jogo p/ agentes (referência primária)
│   ├── raw/                     <- 50 páginas, markdown bruto de spacemolt.com/docs
│   └── distilled/                <- 50 páginas, notas destiladas em português
├── scripts/
│   └── crawl_spacemolt_docs.py  <- crawler reutilizável (download + distill via ollama)
├── specs/
│   ├── README.md                <- fluxo spec→plan→tasks + tabela do backlog
│   ├── constitution.md          <- 12 regras, revisada após discussão (ver acima)
│   └── 0001-connection-layer/
│       ├── spec.md              <- ✅ aprovado
│       └── plan.md              <- ✅ escrito, decisão de stack pendente de confirmação
└── accounts/                     <- NÃO versionado (gitignored)
    ├── hillebot/credentials.json
    ├── ironvex/credentials.json
    └── medici/credentials.json
```

---

## Histórico da sessão (ordem cronológica, resumido)

1. Pedido inicial: extrair toda a documentação útil de `spacemolt.com/docs` (links em
   `links.txt`) usando Ollama local, pra não gastar tokens de API.
2. Ollama (`qwen2.5:7b`) se mostrou lento demais na GPU do usuário (GTX 1660 Ti, 6GB VRAM —
   context grande não cabe, cai pra 33%/67% CPU/GPU). Usuário pediu pra cancelar e eu
   (Claude) fazer direto.
3. Download das 50 páginas feito direto (rápido); distillation feita por **5 subagentes em
   paralelo**, cada um processando 10 páginas — terminou rápido e com boa qualidade.
4. Descoberto por acidente (um subagente seguiu uma referência dentro da própria doc): o
   jogo publica `spacemolt.com/skill.md`, o **manual oficial completo pra agentes de IA**,
   gerado do registro de comandos ao vivo — muito mais valioso que as páginas raspadas.
   Salvo como `knowledge_base/SKILL_MANUAL.md`.
5. Usuário pediu pra seguir SDD e levantar requisitos antes de codar. Durante o
   levantamento, apontou dois projetos antigos (`D:\Projects\SpaceMolt` e
   `D:\Projects\spacemolt-gateway`) pra investigar antes de desenhar algo novo.
6. Fork investigou os dois projetos a fundo (sem ler credenciais) — achou que
   `spacemolt-gateway` já usava SDD com sucesso (153 testes, constituição própria, 3 specs
   escritas e nunca implementadas) e que o agente mais antigo tinha padrões úteis (skills
   plugin, dashboard) e gambiarras a evitar (hot-swap de conta via restart de processo,
   senha hardcoded).
7. Usuário decidiu: projeto novo (não continuar o antigo), mas reaproveitando padrões.
   Login testado e confirmado nas contas `HilleBot` e `ironvex` (ambas ainda ativas).
8. Usuário detalhou a visão de papéis por conta (minerador/artesão/comerciante, ver acima).
   Conta `Medici` registrada (comerciante, Solarian).
9. Constituição adaptada do projeto antigo, depois **revisada a pedido do usuário** — ele
   não queria herdar regras só por terem "dado certo antes" sem questionar. Discussão
   resultou nas regras 2/2.1/2.2 (três papéis), 3 (Decider como recurso compartilhado) e 4
   (processo por conta) reescritas, e a 7 (git) simplificada depois que o usuário informou
   o repo já criado no GitHub.
10. Repositório git inicializado, remoto conectado, 2 commits, push feito.
11. `specs/0001-connection-layer/spec.md` escrito e aprovado sem mudanças.
12. Pesquisa (agente `web-fetch`) sobre `@spacemolt/lib` e o protocolo WebSocket v2 antes de
    escrever o `plan.md` — confirmou que a lib cobre boa parte dos requisitos da spec.
13. `plan.md` escrito propondo TypeScript/Node pro projeto todo — **ponto onde paramos**,
    aguardando confirmação do usuário.

---

## Coisas pra não esquecer / lições já aprendidas

- GPU do usuário (GTX 1660 Ti, 6GB) não aguenta bem Ollama com contexto grande — prefira
  Claude direto (ou subagentes em paralelo) a insistir em tunar o Ollama local quando a
  velocidade importar.
- `@spacemolt/lib` é pequena (5 estrelas, ~347 commits) — isolar atrás de `game_client.ts`
  quando for implementada, nunca importar a lib em mais de um arquivo.
- Rate limit (429/`rate_limited`) é real e recorrente no jogo — os dois projetos antigos e a
  pesquisa de hoje confirmam isso de formas diferentes.
- Nunca imprimir senha/credencial em saída de terminal, mesmo em teste — feito com cuidado
  hoje ao testar login e ao registrar a conta `Medici`.
- `spacemolt.hillebrand.ia.br` já aponta pra porta 5000 — provavelmente pensado pro
  dashboard (ver spec futura `0010-dashboard`).
