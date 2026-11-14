# 0011 — Crafting

## O quê

Existe uma skill `crafting` (spec `0006`, contrato `Skill`) que, enquanto estiver ativa pro
papel `artisan` de uma conta (`ironvex`, quando migrar), enfileira jobs de crafting numa
instalação (`spacemolt_facility`) a partir de materiais já presentes no storage dessa
instalação, acompanha o progresso via notificação (`crafting_update`, nunca por polling
repetitivo), e entrega o resultado — sem decidir sozinha de onde vieram os materiais nem pra
onde vai o bem craftado (ver fora do escopo).

## Por quê

- Fecha o terceiro papel da visão econômica de longo prazo do projeto (minerador → artesão
  → comerciante). Sem esta skill, o papel `artisan` em `roles/catalog.ts` continua com
  `skills: []` (placeholder) e `ironvex` não tem nada real pra fazer se/quando migrar.
- Crafting é o único passo da cadeia que multiplica valor por transformação (minério cru →
  bem refinado, 2–5x o valor segundo a pesquisa) — sem isso, a economia das três contas fica
  limitada a "minerar e vender cru", que é bem menos lucrativo.

## Requisitos funcionais

1. **Enfileira um job a partir de materiais já no storage da instalação** (nunca do cargo
   da nave, exceto o caso especial de Field Workshop undocked — fora do escopo inicial,
   ver abaixo): `craft(recipe_id, quantity, ...)`. Materiais insuficientes falham
   imediatamente (sem enfileirar) — a skill detecta isso antes de tentar, via `dry_run`.
2. **Checa a skill nativa do personagem (Crafting/Refining) antes de tentar uma receita
   skill-gated**: se a receita exige um nível que a conta não tem, a skill reporta isso como
   resultado claro em vez de tentar e falhar sem explicação — nível mínimo exato por receita
   é descoberto via `catalog type=recipes`, não assumido fixo no código.
3. **Nunca reemite `craft` pra "ver se já terminou"**: acompanha o job existente via
   notificação (`crafting_update`, categoria `crafting`) ou, no mínimo, consulta a fila
   (`action: "queue"`) sem tentar enfileirar de novo — reemitir o mesmo pedido duplicaria o
   job (double-spend), erro documentado explicitamente.
4. **`dry_run: true` antes de comprometer**: a skill cota custo/tempo/venue antes de
   enfileirar de verdade, decidindo se vale a pena com a informação real, não uma estimativa
   própria.
5. **Entrega o resultado no storage da instalação** (comportamento padrão do jogo) — a
   skill não precisa mover o bem craftado pra lugar nenhum; "pra onde vai depois" é fora do
   escopo (ver abaixo).
6. **Erro sempre estruturado** (constituição, regra 6): storage insuficiente, skill de
   personagem insuficiente, aluguel de facility atrasado, erro não reconhecido — tudo isso
   vira `ExecutorResult` claro, nunca exceção.

## Fora do escopo desta spec

- **Como os materiais chegam no storage da instalação**: hoje isso depende de
  `0013-inter-account-coordination` (transferência explícita minerador → artesão, ainda sem
  spec) ou de compra via mercado (`0008-skill-trading`) feita manualmente/por fora — esta
  skill **assume que o material já está lá** quando ela roda; não implementa aquisição.
  Quando `0013` existir, ela é quem decide *como* o material chega; esta skill só consome o
  que encontrar.
- **Vender o bem craftado**: decidir se/quando/onde vender é `0008-skill-trading`; esta
  skill só produz e deixa no storage.
- **Field Workshop undocked (cargo↔cargo)**: caso especial documentado que não usa o
  storage da estação; fora do escopo inicial, revisitar se a conta vier a operar esse tipo
  de instalação.
- **Reconciliar a divergência documentada entre `docs_skills.md` e
  `docs_guides_crafting.md`** sobre o fator de velocidade do Station Workshop (×1–3 vs.
  ×1–5) — tratado como "não documentado de forma confiável"; a skill não depende de saber o
  fator exato pra funcionar (só espera a notificação de conclusão), então isso não bloqueia
  a implementação.
- **Gerenciar aluguel de facility própria/de facção** (pagar atrasados, decidir alugar uma
  nova) — fora do escopo; a skill detecta o bloqueio documentado ("fila congela até pagar")
  e reporta como erro claro, não tenta resolver pagando por conta própria.

## Critério de sucesso

- `ironvex` (papel `artisan`, quando migrado) com material suficiente já presente no storage
  de uma instalação consegue enfileirar um job de crafting válido, aguardar a conclusão via
  notificação (não polling em loop apertado), e confirmar o bem craftado no storage.
- Forçar material insuficiente ou skill de personagem insuficiente pra uma receita: a skill
  detecta via `dry_run`/`catalog` antes de tentar enfileirar, reportando um erro claro em vez
  de uma falha confusa.
- Tentar reemitir o mesmo pedido enquanto um job já está na fila: a skill não duplica o job.
