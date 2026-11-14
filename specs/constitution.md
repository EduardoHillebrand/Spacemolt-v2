# Constituição do projeto

Regras que valem para **toda** feature. Se uma spec contradisser isto, a constituição ganha.

Primeira versão adaptada de `D:\Projects\spacemolt-gateway\.specs\constitution.md` (mesma
metodologia, 153 testes passando lá). Revisada em 2026-11-14 depois de discussão explícita
sobre o que merecia virar regra por mérito próprio e o que era só hábito do projeto anterior
— ver histórico da conversa, não repetir isso sem questionar de novo quando fizer sentido.

---

## 1. Spec primeiro

Nenhuma linha de código antes da spec da feature existir e estar clara.
A ordem é sempre: `spec.md` → `plan.md` → `tasks.md` → código.

---

## 2. Três papéis, nunca dois: Planner, Decider, Executor

A "parte que decide" e a "parte que executa" nunca se misturam no mesmo código. Três papéis
separados, cada um com um motivo pra existir:

- **Planner**: função pura. Olha o estado e devolve um **plano** (lista de passos) +
  as **condições de invalidação** desse plano (ex.: "replanejar se o cargo encher antes
  do esperado", "replanejar se aparecer hostil na rota"). Resolve sozinho quando a escolha
  é mecânica (regra determinística); quando a escolha é genuinamente ambígua, delega pro
  Decider — mas é o Planner quem decide **se** precisa perguntar, nunca o Executor.
- **Decider**: a única peça do sistema que fala com uma LLM. Recebe uma pergunta concreta
  do Planner (não o estado todo do jogo) e devolve uma resposta. Não sabe executar nada,
  não toca no jogo — só responde a pergunta difícil. Troca de modelo/backend (Ollama local
  hoje, Claude depois, outro modelo no futuro) nunca exige mudar Planner ou Executor.
- **Executor**: só roda passos de um plano, mecanicamente, chamando o jogo de verdade.
  Quando detecta que uma condição de invalidação disparou, **para e devolve o controle
  pro Planner** — nunca decide por conta própria o que fazer a seguir.

Por que separar em três e não em dois? Testabilidade: o Planner testa sem o jogo (estado de
mentira, confere o plano), o Decider testa sem o jogo também (pergunta de mentira, confere a
resposta), e o Executor testa com um jogo de mentira (fake que só registra chamadas). Juntar
qualquer par dessas três coisas tira a possibilidade de testar uma sem a outra.

### 2.1 Replanejamento é a regra, não a exceção

Todo plano carrega suas condições de invalidação desde que é criado. O Executor só sabe
checar essas condições (barato, mecânico) — a decisão de "o que fazer quando invalida" é
sempre um novo ciclo Planner (→ Decider se ambíguo) → novo plano. O Executor nunca improvisa.

### 2.2 O Decider nunca aparece fora do Planner

Nenhuma skill, Executor ou código de infraestrutura chama a LLM diretamente. Só o Planner
consulta o Decider, e só quando decide que precisa.

---

## 3. O Decider é um recurso compartilhado e lento — desenhe pra isso

O modelo local (Ollama) disponível hoje é fraco e não aguenta 3 contas "pensando" ao mesmo
tempo sem ficar muito lento (confirmado nesta sessão: qwen2.5:7b em GPU de 6GB já é lento
pra **uma** chamada com contexto grande). Mesmo assim, o sistema deve ficar **pronto pra
rodar as 3 contas simultaneamente** desde o primeiro dia:

- As chamadas Planner → Decider são **assíncronas e não-bloqueantes**: enquanto uma conta
  espera resposta do Decider, as outras continuam seu Executor normalmente.
- O Decider pode enfileirar/serializar pedidos de contas diferentes sem problema — isso é
  esperado e aceitável, não é bug a corrigir. O que não pode é uma conta travada esperando
  o Decider impedir outra conta de progredir.
- Como o Planner já resolve a maioria dos ciclos sem precisar do Decider (regra 2), a
  contenção na prática deve ser rara — a maioria dos ciclos nem chega a perguntar pra LLM.
- O backend do Decider é pluggable: local (Ollama) por padrão; nada impede trocar por uma
  chamada à API da Claude pra decisões raras e de alto valor, sem tocar em Planner/Executor.

---

## 4. Processo por conta — isolamento real, não microserviço

Cada conta (`HilleBot`, `ironvex`, `Medici`, as que vierem depois) roda como **processo
próprio**, gerenciado pelo PM2 (que já está na infra do usuário). Não é arquitetura de
microserviço (não tem rede entre eles, não tem API própria) — é só "um processo do SO por
conta", o jeito mais simples de isolar de verdade sem inventar concorrência dentro de um
processo só.

Consequência prática: nenhum estado global mutável compartilhado entre contas. Todo cache,
arquivo ou variável de processo é particionado por conta desde o primeiro dia — mesmo que
na prática, por limite de hardware do Decider (regra 3), só uma ou duas contas fiquem ativas
por vez no início.

Não repetir o padrão do projeto anterior (`D:\Projects\SpaceMolt`) de troca de conta via
reinício de processo (`RestartRequested` + `.bat`). Com processo por conta desde o início,
isso nem precisa existir: "trocar de conta" é só ligar outro processo.

---

## 5. Skill é módulo isolado

Cada skill do jogo é uma pasta isolada em `app/skills/`. Uma skill nunca importa código
interno de outra skill. Se duas precisam da mesma coisa, ela sobe pra `app/core/`.
`game_client.py` é o único lugar que fala com a API real do SpaceMolt — nenhuma skill, nem
Planner, nem Decider, chama o jogo direto; todos recebem o `game_client` por injeção.

---

## 6. Erro fala, não falha calado

Se uma skill não pode rodar (falta laser de mineração, cargo já cheio, não está num ponto
minerável, a API devolveu 429), ela devolve um **resultado claro dizendo o que falta** —
nunca quebra silenciosa nem inventa. O Planner lê isso e decide o que fazer.

---

## 7. Git simples: commit direto, branch só quando vale isolar

Sem branch obrigatória por task — isso é granularidade de mais pra como esse projeto é
construído (Claude/subagentes em rajadas maiores, não passo a passo manual). Em vez disso:

- Commit na `main` ao fechar cada task de um `tasks.md`, mensagem direta dizendo o que
  mudou.
- Branch só quando a mudança é arriscada o suficiente pra valer revisar isolada antes de
  integrar (ex.: uma reescrita grande, algo que toca em várias skills ao mesmo tempo).
- Repositório: `https://github.com/EduardoHillebrand/Spacemolt-v2.git`.

---

## 8. Idioma

- Código (funções, variáveis, branches, commits): **inglês**.
- Specs, docs, comentários de explicação: **português**.

---

## 9. Coordenação entre contas é sempre explícita

Quando a cadeia econômica entre contas existir (minerador → artesão → comerciante), a
transferência de bens/créditos entre elas passa por uma interface explícita (ex.: um
"pedido" que uma conta publica e outra lê) — nunca uma conta lendo/escrevendo direto no
estado interno de outra, e nunca via memória compartilhada de processo (cada conta já é um
processo separado, regra 4).

---

## 10. Observabilidade não é um extra, nasce com a feature

Toda ação relevante de qualquer conta (decisão tomada, comando executado, erro, mudança de
estado) emite um evento estruturado num canal central (padrão devlog) desde a primeira
versão da feature que a introduz. Como cada conta é um processo separado (regra 4), o canal
é compartilhado: N processos publicam, o dashboard é só mais um consumidor.

---

## 11. Memória tem duas camadas, e elas não se confundem

- **Estado operacional**: posição, carga, combustível, estratégia atual. É **efêmero e
  reconstruível** — pode ser recalculado consultando o jogo; se corromper, descarta e
  busca de novo. Não é fonte de verdade, é cache. Particionado por conta (regra 4).
- **Memória de longo prazo (lições aprendidas)**: fatos acumulados que valem a pena
  lembrar entre sessões (ex.: "rota X costuma ter pirata", "esse NPC paga mal"). É
  **cumulativa e é a fonte de verdade** — nunca é descartada/recalculada, só cresce
  (ou é explicitamente curada).

O Captain's Log nativo do jogo (replay da entrada mais recente no login, máx. 20 entradas de
30KB) é um terceiro canal, garantido pelo próprio servidor — serve de rede de segurança
mínima, não substitui a memória de longo prazo do agente.

---

## 12. Segredos nunca em texto plano fora de `accounts/`

Credenciais de jogo vivem só em `accounts/<conta>/credentials.json`, sempre ignorado pelo
git (`.gitignore` na raiz do projeto). Nenhuma ferramenta, log ou saída de debug imprime
senha/token — nem em desenvolvimento.
