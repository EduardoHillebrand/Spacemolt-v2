# 0001 — Connection Layer

## O quê

O sistema precisa autenticar e trocar comandos com o servidor do jogo SpaceMolt, de forma
confiável, para cada uma das contas registradas (`HilleBot`, `ironvex`, `Medici`, e as que
vierem depois), operando sem supervisão humana contínua.

## Por quê

- Nada mais no projeto funciona sem isso — é a fundação, primeira da lista no backlog.
- É usado pelo Executor (constituição, regra 2) pra realmente agir no jogo, um por processo-
  por-conta (regra 4).
- O jogo tem sessões que expiram e limite de taxa real (HTTP 429) — os dois projetos
  anteriores precisaram lidar com isso explicitamente. Sem tratar isso aqui, de forma
  robusta e numa única camada, qualquer coisa construída em cima vai falhar silenciosamente
  ou simplesmente parar de funcionar depois de um tempo rodando.

## Requisitos funcionais

1. **Autenticação por conta** usando usuário/senha lidos de `accounts/<conta>/credentials.json`
   — nunca de outro lugar, nunca impressos em log/debug (constituição, regra 12).
2. **Reautenticação automática**: quando a sessão expira ou é invalidada pelo servidor, o
   sistema cria uma nova sessão e continua, sem intervenção humana e sem precisar reiniciar
   o processo.
3. **Qualquer comando documentado** no `knowledge_base/SKILL_MANUAL.md` pode ser emitido em
   nome de uma conta autenticada, devolvendo tanto o texto (`result`) quanto os dados
   estruturados (`structuredContent`) da resposta do jogo.
4. **Erro nunca derruba o processo**: um comando inválido, uma ação impossível no estado
   atual, ou uma rejeição do servidor chegam a quem chamou como um resultado estruturado e
   claro dizendo o que aconteceu — nunca como uma exceção não tratada (constituição, regra 6).
5. **Rate limiting é absorvido aqui**: quando o servidor responde 429, quem chamou um comando
   não precisa saber que isso aconteceu — só pode perceber que a resposta demorou mais. A
   camada tenta de novo com espera progressiva até um limite razoável antes de desistir e
   reportar erro.
6. **Sessão isolada por conta**: a sessão de uma conta nunca é compartilhada ou confundida
   com a de outra, mesmo que as duas estejam ativas ao mesmo tempo (consistente com
   "processo por conta", constituição regra 4).
7. **Estado inicial do login não se perde**: ao autenticar com sucesso, os dados que o jogo
   devolve nesse momento (nave atual, posição, créditos, carga, etc.) ficam disponíveis pra
   quem for inicializar o estado operacional — esta camada não precisa guardar isso a longo
   prazo, só não pode descartar a informação no caminho.

## Fora do escopo desta spec

- Decidir o que fazer com os dados recebidos (isso é Planner/Decider — specs futuras).
- Persistir estado entre reinícios do processo (spec `0003-memory`).
- Qual skill chama qual comando, e quando (specs `0005+`, uma por skill).
- O canal de observabilidade em si (spec `0010-dashboard`) — esta camada só precisa emitir
  os eventos; o canal que os recebe é outra feature.

## Critério de sucesso

- As 3 contas existentes conseguem autenticar e cada uma recebe de volta seu próprio estado
  inicial (nave, posição, créditos) sem se misturar com as outras.
- Forçar a expiração de uma sessão no meio do uso não exige reiniciar o processo — a próxima
  chamada reautentica sozinha e segue em frente.
- Disparar chamadas mais rápido do que o servidor aceita produz respostas corretas, só mais
  lentas — nunca um erro não tratado nem comandos perdidos silenciosamente.
