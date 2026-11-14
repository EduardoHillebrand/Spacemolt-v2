# 0006 — Agent Loop

## O quê

Existe um loop que, pra cada conta, roda continuamente enquanto o processo dela estiver de
pé: descobre o papel da conta (spec `0002`), escolhe qual skill deveria agir agora, aciona o
ciclo Planner → (Decider, se ambíguo) → Executor dessa skill, detecta quando um plano precisa
ser invalidado e replaneja (constituição, regra 2.1) — mantendo isso girando indefinidamente.

## Por quê

- Sem isso, cada skill teria que reimplementar "o que fazer quando não há plano ativo",
  "quando trocar de skill", "como ficar vivo pra sempre" — exatamente a duplicação que a
  constituição (regra 5) proíbe.
- É o que materializa, na prática, o papel escolhido na spec `0002`: sem um loop que de fato
  olha o papel e escolhe a skill, o papel seria só um dado sem efeito nenhum.
- É o ponto de encontro de tudo que já foi especificado (conexão `0001`, papel `0002`,
  memória `0003`, base de conhecimento `0004`, devlog `0005`) — sem ele, essas peças
  continuam soltas, nunca ligadas numa coisa que realmente joga.

## Requisitos funcionais

1. Ao iniciar, o processo de uma conta conhece seu papel atual (spec `0002`) e, a partir
   dele, quais skills estão disponíveis pra escolher.
2. **Nunca mais de um plano ativo por conta** ao mesmo tempo — nenhuma skill compete com
   outra pra agir na mesma conta simultaneamente.
3. **Quando não há plano ativo** (início, ou o anterior terminou/foi invalidado), o loop
   decide qual skill deve agir agora, dado o papel da conta. O mecanismo de escolher existe
   desde já, mesmo que hoje a escolha seja trivial (um papel = uma skill clara).
4. **Replanejamento nunca deixa o Executor sem próximo passo**: quando uma condição de
   invalidação dispara (constituição, regra 2.1), o loop garante que o controle volta pro
   Planner da skill ativa (ou pra escolha de skill de novo, se fizer sentido trocar).
5. **Erro de skill nunca para o loop**: um erro reportado (constituição, regra 6) é tratado,
   registrado (via devlog, spec `0005`), e o loop decide o que fazer a seguir (tentar de
   novo, trocar de skill, esperar) — nunca derruba o processo da conta.
6. **Memória e base de conhecimento sempre acessíveis**: o loop dá ao Planner/Decider de
   cada ciclo acesso à memória de longo prazo (spec `0003`) e à base de conhecimento (spec
   `0004`) sem esforço extra de quem implementa uma skill nova — usar ou não cada uma é
   decisão da skill, não uma obrigação do loop.
7. **Troca de papel reflete no próximo arranque**: trocar o papel de uma conta (spec `0002`,
   via reinício do processo) faz o loop escolher skills diferentes a partir daí, sem lógica
   especial além de reler o papel no início.

## Fora do escopo desta spec

- A lógica de cada skill em si (specs `0007+`) — o loop só sabe invocá-las por uma interface
  comum, não decide o plano de nenhuma delas.
- Escolher a "melhor" skill quando o papel permite mais de uma ativa ao mesmo tempo — hoje,
  com um papel = uma skill clara, isso é trivial; decidir entre várias competindo é questão
  pra quando essa situação existir de fato.
- Coordenação entre contas — spec `0013`.
- Qualquer UI ou observação externa do que o loop está fazendo — isso é consumido via
  devlog (`0005`), não definido aqui.

## Critério de sucesso

- Ligar o processo de uma conta com papel "minerador" e ver, via devlog, o loop escolhendo a
  skill de mineração e mantendo um plano ativo continuamente — sem intervenção manual pra
  "começar de novo" depois que cada plano termina.
- Forçar uma condição de invalidação no meio de um plano (num teste) e confirmar que o loop
  volta pro Planner e continua, em vez de travar ou crashar.
- Simular um erro dentro de uma skill (ex.: comando que falha) e confirmar que o processo da
  conta continua rodando, com o erro visível no devlog.
