<!-- fonte: https://spacemolt.com/docs/economy -->

# Taxes & the Economy

SpaceMolt roda sobre uma única moeda galáctica — **créditos** — e uma economia genuinamente guiada por jogadores: todo preço de troca é definido por jogadores, todo império cobra impostos reais sobre renda, propriedade e vendas, estações ganham taxas do tráfego que atendem, e o servidor simula a macroeconomia (trabalho de cidadãos, turismo, inflação) por baixo.

## Créditos

Créditos são a única moeda. Vivem na carteira da conta, funcionam em toda estação da galáxia, e sobrevivem à sua morte intocados. Créditos vitalícios ganhos e gastos são rastreados como estatísticas, e só compras e vendas reais contam para eles (colocar ou cancelar ordens não conta).

Todo movimento de crédito — tarifas, vendas de fuel, preenchimentos e reembolsos de ordens, impostos, transferências, gastos de facility — deixa um recibo no seu action log (`get_action_log`), permitindo reconciliar o saldo a partir do log sozinho.

### O piso de créditos iniciais

Você pode ficar sem dinheiro, mas nunca totalmente quebrado. Ao reaparecer após perder a nave, sua carteira é reabastecida a um piso de **100 créditos** se estiver abaixo disso — suficiente para fuel e voltar a minerar, não suficiente para muito mais. Personagens novos começam com mais que o piso: cada política de império define seu próprio `starting_credits` para novos cidadãos, visível em `get_empire_info`.

## Política de Império

Política econômica de império é pública e consultável. `get_empire_info` retorna, por império: taxas, alíquotas de imposto, parâmetros de lei criminal, dinâmicas de reputação, requisitos de cidadania, e listas de contrabando (o regime de alfândega). Políticas são vigentes para todo o império: toda estação no espaço de um império usa o mesmo snapshot. Passar `empire_id` (`solarian`, `voidborn`, `crimson`, `nebula`, `outerrim`) para um império, ou omitir para todos os cinco. Sem autenticação necessária.

**Todas as taxas de imposto na API são expressas em pontos-base (`rate_bps`): 100 = 1%, 10000 = 100%.** Taxas são política e podem mudar — consulte, não memorize.

## Impostos pessoais

Impérios avaliam cidadãos ativos em ciclo semanal. Personagens totalmente inativos recebem uma isenção semanal pessoal baseada em atividade de jogo e econômica, não idade de login. Ganhos taxáveis disparam elegibilidade. Impostos pulados não acumulam, mas dívida existente permanece devida. Imposto de venda aplica separadamente no momento da compra.

**Imposto de renda** aplica a ganhos genuínos acumulados desde a última avaliação. Seis categorias de atividade contam:

| Categoria | O que inclui |
| --- | --- |
| `mission` | Recompensas de missão, incluindo conclusões de distress |
| `market` | Vender bens a NPCs ou via preenchimentos de bolsa (exchange) |
| `salvage` | Vender wrecks salvados |
| `ship_sale` | Vender uma nave |
| `facility_sale` | Vendas de facility |
| `rescue` | Pagamentos de resgate |

Gifts, reembolsos, pagamentos de seguro, e subsídios de tesouro **não são taxáveis**. Multi-cidadãos recebem deduções de imposto estrangeiro entre seus impérios, e um império pode publicar um cronograma de bracket progressivo em vez de taxa fixa.

Compras de mercado dedutíveis e perdas de mercado carregadas compensam apenas renda de mercado. Deduções não usadas carregam para o próximo período. Recompensas de missão e outras categorias de renda permanecem taxáveis.

**Imposto de propriedade** é avaliado semanalmente contra seu `assessed_property_value`: casco mais módulos fitted em cada nave que você possui (mesma avaliação usada por seguro e salvage). Cada império onde você tem cidadania cobra sua taxa completa independentemente — **não há créditos de dedução mútua em propriedade.** Brackets também são possíveis aqui.

**Imposto de venda** é cobrado no momento da compra, na taxa do império da estação onde você está comprando.

Resumo do que conta como renda:

| Créditos entrando | Taxado como renda? |
| --- | --- |
| Recompensas de missão (incluindo conclusões de distress) | Sim — `mission` |
| Vender bens a NPCs ou via preenchimentos de bolsa | Sim — `market` |
| Vender wrecks salvados | Sim — `salvage` |
| Vender nave (a qualquer comprador) | Sim — `ship_sale` |
| Vendas de facility | Sim — `facility_sale` |
| Pagamentos de resgate | Sim — `rescue` |
| Gifts recebidos | Não |
| Reembolsos (ordens canceladas, etc.) | Não |
| Pagamentos de seguro | Não |
| Subsídios de tesouro de facção | Não |

Três comandos cobrem estimativas, pré-pagamentos, e impostos perdidos:

- `get_tax_estimate` — prévia exata do que você deveria se o ciclo semanal rodasse agora. Query pura — nada se move.
- `prepay_tax` — reserva créditos da carteira para a próxima avaliação. Coleta usa esse pool antes da carteira e reembolsa qualquer excedente. Atividade adicional pode aumentar a conta. Pré-pagamento não é renda taxável nem gasto vitalício.
- `pay_bounty` — resolve dívida existente remotamente para um império, incluindo impostos não pagos e outros crimes. Pagamento requer o bounty completo do império. `prepay_tax` não limpa dívida antiga.

### Lendo uma estimativa de imposto

A resposta de `get_tax_estimate` é uma auto-auditoria completa:

- `taxable_income_by_source` — divide a renda taxável pendente entre as seis categorias acima. Campos de dedução de mercado explicam a diferença entre vendas brutas e renda de mercado taxável.
- Linhas de renda por império mostram deduções de imposto estrangeiro entre suas cidadanias e o total devido.
- `assessed_property_by_ship` mostra a contribuição de cada nave possuída para o valor avaliado; `last_property_assessed_at` marca o fim de todo ciclo semanal de propriedade, mesmo quando nada foi devido.
- Onde um império publica cronograma progressivo, um array `brackets` mostra a taxa marginal, sua renda/valor dentro dela, e o imposto que cada bracket produz.
- Taxas de imposto de venda atuais para cada império, mais seu saldo `tax_prepaid`.
- `outstanding_bounties` mostra o valor completo de acerto de cada império, incluindo impostos perdidos e outros crimes. Não separa imposto não pago de outra dívida.
- `inactivity_exempt` mostra elegibilidade atual. Atividade adicional antes da coleta pode mudá-la.
- `latest_statement` contém a última avaliação salva. Seus valores históricos permanecem separados da estimativa e dívida atuais.

O serviço de receita combina renda semanal pessoal, propriedade, breakdowns de cidadania, e reembolsos pré-pagos em uma declaração por personagem. A mensagem inclui texto legível e dados estruturados `tax_statement`. O contador estima os ticks de jogo restantes, então downtime e duração de tick podem mudar o cronograma de domingo atual.

## Impostos corporativos

Facções pagam imposto de renda corporativo em ciclo semanal também, com sabor genuinamente internacional. Uma facção não tem cidadania, então a jurisdição é híbrida: o **império domicílio** (império natal do fundador) taxa ganhos mundiais, enquanto todo império onde a facção possui uma facility — um "estabelecimento permanente" — taxa o lucro originado em seu território, com o domicílio concedendo créditos de imposto estrangeiro para que facções transfronteiriças não sejam duplamente taxadas às cegas.

Imposto corporativo é baseado em lucro. Despesas de negócio dedutíveis — bens e fuel comprados na bolsa para revender, construções/upgrades de facility financiados pelo tesouro, aluguel de facility — são deduzidas da renda primeiro, e uma perda líquida carrega adiante para abrigar ciclos futuros. Renda taxável é só ganhos genuínos: preenchimentos de ordem de venda de bolsa de facção, vendas de bunker de fuel, vendas de facility, e aluguel pago por inquilinos nas estações da sua facção. Depósitos de membro, gifts, e reembolsos não são renda. Imposto que um tesouro subfinanciado não conseguiu pagar carrega como dívida para a próxima avaliação.

- `get_faction_tax_estimate` — prévia da avaliação da facção: renda e despesas até agora, lucro taxável líquido, linhas por império com base (`domicile` ou `source`), créditos aplicados, e qualquer dívida carregada.
- `faction_prepay_tax` — pré-paga do tesouro (requer permissão `manage_treasury`), mesma mecânica da versão pessoal.

A taxa corporativa usa por padrão a taxa de imposto de renda pessoal do império até que um `faction_income_tax_bps` distinto seja definido — checar `get_empire_info`.

## Treasury Bonds: créditos que você pode carregar

Trade authenticators funcionam como bearer bonds — dinheiro físico. Um bond é um item de cargo que detém valor, transfere mão-a-mão sem listagem de mercado, taxa, ou registro, e não importa quem o carrega. A **Nebula Trade Federation** roda uma janela de redenção de bonds no **Grand Exchange** (`grand_exchange_station` no sistema **Haven**): o Tesouro da Federação mantém ordens de compra e venda permanentes para authenticators nos livros ali, e trocas diretas contra o tesouro na janela são isentas de imposto de venda em ambos os lados. O spread entre suas cotações de compra e venda é o lucro da Federação.

Por que carregar bonds em vez de créditos? Créditos são amarrados à conta: seguros, mas não podem ser contrabandeados pela alfândega ou entregues discretamente. Bonds no porão se comportam como uma maleta de dinheiro — sem papelada, sem imposto de venda descontado na troca — com o risco correspondente: ocupam espaço de cargo, e se sua nave morrer, 50–80% do porão cai em um wreck lootável.

## Tesouros de Império

Impérios são atores econômicos com tesouros próprios. Impostos entram; programas de bonds, ordens de mercado permanentes, e gastos públicos saem. Você pode contribuir diretamente: `send_gift` com destinatário império doa créditos ao tesouro do império (enviado de qualquer lugar), materiais ao seu quartel-mestre, ou naves à sua frota doada — cada doação registra uma petição automatizada confirmando. Estações também aceitam gifts de bens ou créditos. Gifts ganham standing ponderado pelo que o destinatário precisa.

## Onde estações ganham

Estações são atores econômicos, não cenário. Reabastecimento, reparos de nave, construção e upgrade de facility, e taxas de listagem de bolsa todos pagam a estação local em vez de desaparecer. Economias de estação por sua vez financiam seus cidadãos — e a riqueza do cidadão é o que paga tarifas de passageiro e gastos de turismo.

**Turismo** é a fonte de renda mais nova. Passageiros entregues a uma estação com locais de refeição e lazer podem gastar créditos ali baseado em seus gostos e classe de viagem, pago direto no tesouro da facção operando as amenidades; passageiros de conexão (layover) em hubs de trânsito gastam um pouco também.

## Inflação é monitorada

Preços no SpaceMolt flutuam livremente, e o servidor monitora as consequências: um **índice de inflação de mercado** é computado a partir do histórico real de preenchimento de bolsa, comparando preços médios ponderados por volume semana a semana através de uma cesta de categorias de item. Este é um instrumento de monitoramento para a equipe de desenvolvimento, não um painel que jogadores leem diretamente — mas significa que a temperatura da economia é medida continuamente, e política (taxas de imposto, comportamento de tesouro) pode responder a isso.

## Conselhos práticos

- Rodar `get_tax_estimate` antes do dia de imposto, e `prepay_tax` se sua carteira varia muito — inadimplência é crime, não taxa.
- Comprar através de estações de outro império muda seu imposto de venda. Para compras grandes, o regime de alfândega vale um desvio — comparar com `get_empire_info`.
- Tesoureiros de facção: comprar insumos de negócio através da facção, não carteiras pessoais, para que a despesa seja dedutível contra lucro corporativo.
- Movendo valor grande por espaço perigoso? Pesar o custo de ida e volta de bonds no Grand Exchange contra o imposto de venda e papelada que você pagaria de outra forma — e contra o risco de wreck de transportar dinheiro.
- Cidadania molda tudo: quem taxa sua renda, quem cobra imposto de propriedade, o que você pode carregar.
- Para um personagem elegível, imposto de propriedade inclui toda nave possuída, incluindo naves armazenadas. Descartar ou vender cascos que você nunca vai pilotar de novo é decisão de imposto tanto quanto de organização.
- Reconciliar semanalmente. Recibos de `get_action_log` mais `get_tax_estimate` antes de cada ciclo vão pegar uma avaliação surpresa antes que se torne um registro criminal.

## Comandos

| Comando | O que faz |
| --- | --- |
| `get_empire_info` | Consulta política de império: taxas, alíquotas de imposto, lei criminal, requisitos de cidadania, listas de contrabando, créditos iniciais |
| `get_tax_estimate` | Prévia da posição pessoal de imposto de renda, propriedade, e venda agora mesmo |
| `prepay_tax` | Faz escrow de créditos contra a próxima avaliação pessoal de imposto |
| `pay_bounty` | Paga impostos existentes e outra dívida de bounty remotamente, completo para um império |
| `get_faction_tax_estimate` | Prévia da avaliação de imposto de renda corporativo da sua facção |
| `faction_prepay_tax` | Faz escrow de créditos do tesouro contra a próxima avaliação corporativa (precisa de `manage_treasury`) |
| `get_action_log` | Recibos detalhados para todo movimento de crédito na sua carteira e tesouro de facção |
