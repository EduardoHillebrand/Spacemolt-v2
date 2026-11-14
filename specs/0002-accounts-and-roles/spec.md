# 0002 — Accounts and Roles

## O quê

Cada conta de jogo (`HilleBot`, `ironvex`, `Medici`, e as que vierem depois) tem um **papel**
que determina seu objetivo e quais skills ficam ativas para ela. O papel é dado de
configuração — nunca código duplicado por papel — e pode ser trocado em runtime, sem recriar
a conta nem perder o progresso dela no jogo.

## Por quê

- Sem isso, "papel" é só uma ideia na cabeça do usuário — toda conta rodaria a mesma lógica
  genérica, e a visão de cadeia econômica (minerador → artesão → comerciante) nunca se
  materializa de fato.
- O papel é o que decide quais skills carregar pra cada conta (um minerador não precisa de
  skill de crafting ativa) e qual objetivo orienta o Decider quando a escolha for ambígua
  — sem isso formalizado, cada skill futura reinventaria "será que essa conta devia fazer
  isso?" por conta própria.
- Trocar de papel sem recriar a conta importa porque progresso, créditos, reputação e naves
  ficam todos presos à conta no jogo — perder isso pra "virar artesão" seria desperdício.

## Requisitos funcionais

1. **Papel persistido por conta**: cada conta tem um papel atual, guardado de um jeito que
   sobrevive a reinícios do processo.
2. **Papéis conhecidos desde já**: minerador, comerciante, artesão — mesmo que a skill do
   artesão ainda não exista (o papel existe como conceito antes da skill ser implementada).
3. **Troca de papel é sempre uma ação deliberada e explícita** (comando ou edição de
   configuração) — nunca uma decisão que o Decider toma por conta própria sem confirmação.
   Motivo: são contas reais com progresso real; um engano aqui é caro.
4. **Cada papel define**: (a) quais skills ficam ativas para a conta, e (b) um objetivo em
   texto que orienta o Decider nas decisões ambíguas daquela conta — equivalente ao que o
   projeto antigo chamava de `MODE_PROMPT`, mas como dado de configuração, não código.
5. **Papel pretendido (opcional)**: além do papel atual, uma conta pode registrar um papel
   pretendido pra migração futura (ex.: `ironvex`: atual = minerador, pretendido = artesão),
   só pra deixar a intenção rastreável — sem acionar nada automaticamente.
6. **Troca de papel nunca afeta o estado operacional da conta** (nave, créditos, cargo,
   reputação) — é só uma troca de "o que fazer com a conta a partir de agora", não uma
   reinicialização dela.
7. **Adicionar conta nova não exige código**: só credenciais (`accounts/<conta>/credentials.json`,
   constituição regra 12) + um papel inicial de configuração.

## Fora do escopo desta spec

- Implementação das skills em si (mineração, trading, crafting) — specs `0005+`, uma por
  skill.
- Coordenação real entre contas (transferência de bens/créditos) — spec `0011`.
- Decisão automática de **quando** trocar de papel — se isso vier a existir, é uma feature
  de alto nível do Planner/Decider, não desta spec. Aqui só garantimos que a troca, quando
  acontecer (decidida por fora), é possível e segura.
- Visualização de papéis num dashboard — spec `0010`.

## Critério de sucesso

- Dá pra consultar o papel atual (e o pretendido, se houver) de cada uma das 3 contas
  existentes.
- Dá pra trocar o papel de uma conta (ex.: `ironvex` de minerador pra artesão) sem perder
  nada do estado dela no jogo, só reiniciando o processo dela — nada manual além disso.
- Adicionar uma 4ª conta exige só credenciais + papel inicial — nenhuma linha de código.
