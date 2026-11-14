# 0008 — Trading

## O quê

Existe uma skill `trading` (spec `0006`, contrato `Skill`) que, enquanto estiver ativa pro
papel `trader` de uma conta (`Medici`), encontra oportunidades de arbitragem entre estações
do império Solarian (comprar numa, vender noutra com lucro, descontados impostos), compra e
viaja (via `0009-navigation`) e vende continuamente — crescendo o capital da conta ao longo
do tempo, sem decidir cada rota manualmente.

## Por quê

- Materializa o segundo papel real do projeto (`Medici`), completando a visão econômica de
  longo prazo junto com `0007-skill-mining` e a futura `0011-skill-crafting`.
- Arbitragem é o modelo de lucro documentado pelo próprio jogo (`docs_guides_arbitrage.md`):
  lucro = (preço de venda no destino − preço de compra na origem) × quantidade, usando o
  lado certo do livro de ofertas em cada estação (erro clássico documentado: confundir bid
  com ask) — sem uma skill dedicada, `Medici` fica parada sem converter o papel escolhido em
  ação de verdade.

## Requisitos funcionais

1. **Descoberta de preço**: a skill consulta preços (`view_market`, `estimate_purchase`) nas
   estações já visitadas, e usa `analyze_market` quando disponível pra ter uma visão mais
   confiável de spread — nunca assume preço de uma estação que a conta nunca visitou.
2. **Memória de longo prazo registra estações/rotas úteis** (spec `0003`): ao encontrar um
   spread bom, a skill grava isso como lição (`remember`) pra priorizar revisitar aquela
   rota depois, em vez de redescobrir do zero a cada ciclo.
3. **Cálculo de lucro correto**: usa sempre `ask` da estação de origem (o que se paga pra
   comprar) e `bid` da estação de destino (o que se recebe pra vender), nunca invertendo os
   dois lados — e subtrai o imposto de venda (cobrado na compra, pela taxa do império da
   estação de origem) antes de decidir se a rota vale.
4. **Fica dentro do império Solarian por padrão**: comprar fora do Solarian muda a taxa de
   imposto de venda aplicada (documentado) — a skill não cruza fronteira de império
   deliberadamente nesta versão (ver fora do escopo), simplificando o cálculo de imposto.
5. **Decide entre venda instantânea e ordem no livro**: usa `buy`/`sell` (preenchimento
   imediato) como caminho padrão; `create_buy_order`/`create_sell_order` (escrow, 1% de
   taxa de listagem, preenche mesmo offline) é uma opção quando o preenchimento imediato não
   cobre a quantidade desejada (`item_not_available`) — nunca falha silenciosamente nesse
   caso.
6. **Cargo cheio ou sem crédito suficiente são condições de invalidação**, tratadas como
   resultado claro (constituição, regra 6) — a skill não tenta comprar mais do que cabe ou
   mais do que há crédito disponível; usa `estimate_purchase` antes de comprar pra evitar
   isso proativamente.
7. **Reparo/seguro na mesma parada**: ao estar docada numa estação pra comprar ou vender, a
   skill chama `checkAndRepair`/`checkInsurance` (`0010`) antes de seguir viagem — mesmo
   padrão de `0007-skill-mining`.
8. **Erro sempre estruturado** (constituição, regra 6): `insufficient_credits`,
   `item_not_available`, `cargo_full`, `no_market`, `price_too_high`, erro de `goTo`/
   `checkAndRepair` repassado — tudo isso vira `ExecutorResult` claro, nunca exceção.

## Fora do escopo desta spec

- **Cruzar fronteira de império**: a pesquisa confirmou que isso muda o regime de imposto de
  venda aplicado e não está totalmente documentado quanto a fricção adicional (manifesto de
  carga/contrabando); fica fora do escopo até existir uma spec ou decisão explícita de
  expandir pra fora do Solarian.
- **Transferência direta entre contas** (minerador → artesão → comerciante via
  `spacemolt_transfer`): isso é `0013-inter-account-coordination`, ainda não especificada.
  `0008` compra e vende no mercado, não troca bens com `HilleBot`/`ironvex` diretamente.
- **Scouting automático exaustivo de toda estação do império**: a skill prioriza estações já
  visitadas/conhecidas via memória de longo prazo; não implementa um "varredura de todo o
  mapa" — isso cresceria o escopo sem necessidade imediata (poucas estações conhecidas hoje).
- **Gestão de posições em ordens no livro por tempo indefinido** (deixar uma
  `create_sell_order` parada por dias esperando preencher) — a skill pode criar uma ordem
  quando o preenchimento imediato falha, mas não implementa lógica de "revisar e cancelar
  ordens antigas"; isso é extensão futura.

## Critério de sucesso

- `Medici` (papel `trader`) rodando com esta skill ativa completa pelo menos um ciclo real
  de compra numa estação e venda com lucro positivo noutra, confirmado via devlog e
  créditos antes/depois.
- Forçar um cenário de cargo cheio ou crédito insuficiente: a skill detecta antes de tentar
  (via `estimate_purchase`/checagem de cargo) e não falha de forma confusa.
- Uma rota com spread bom, uma vez encontrada, é lembrada (spec `0003`) e influencia a
  próxima decisão do Planner sem precisar redescobrir do zero.
