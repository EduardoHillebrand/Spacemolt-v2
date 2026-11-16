# 0012 — Operator Directives

## O quê

Existe uma única página que o operador (humano) usa pra acompanhar e ajustar as contas em
execução, sem editar código nem reiniciar nenhum processo — dividida em duas partes:

**Um terço da tela: a diretriz**, por conta —

1. **Preferências estruturadas**, namespaced por skill (ex.: `mining.preferredResource:
   "iron"`), que o Planner da skill correspondente aplica diretamente, mecanicamente, sem
   custo de LLM (constituição, regra 2).
2. **Uma nota em texto livre**, repassada como contexto extra pra qualquer skill que já
   fosse consultar o Decider — nunca dispara uma consulta que não aconteceria de outro
   jeito.
3. **Um interruptor de pausa**, que faz a conta parar de agir até ser despausada.

**Dois terços da tela: o que cada conta está fazendo agora**, em tempo real — um feed ao
vivo do canal de devlog (spec `0005`), a mesma página, sem precisar abrir outra ferramenta
pra ver o efeito de uma diretriz que acabou de mudar (requisito acrescentado em 2026-11-15,
depois de ver a página publicada — ver `plan.md`, nota de revisão).

## Por quê

- Hoje o único jeito de mudar o comportamento de uma conta é editar código
  (`roles/catalog.ts`) ou o papel (`roles.json`, spec `0002`) — não existe canal pra ajuste
  fino do dia a dia ("foca em ferro agora", "pausa um pouco") sem redeploy.
- O projeto antigo (`D:\Projects\SpaceMolt`) já validou esse padrão na prática: um
  dashboard web com texto livre por modo, relido a cada ciclo de decisão e injetado no
  prompt como prioridade máxima. Lá não existia separação Planner/Decider, então o texto
  livre ia direto pro único lugar que decidia tudo. Aqui a diretriz entra do jeito certo:
  mecânica quando possível, e só chega ao Decider quando ele já ia ser consultado mesmo.
- Papel (`0002`) já resolve "migrar de minerador pra artesão" — isso é uma decisão rara e
  estrutural. Diretriz é o ajuste fino *dentro* do papel atual, usado com muito mais
  frequência — não duplica nem substitui o papel.

## Requisitos funcionais

1. Cada conta tem um arquivo de diretriz (`accounts/<conta>/directive.json`) com: `paused`
   (boolean), `preferences` (preferências estruturadas, namespaced por nome de skill — cada
   skill só lê a própria chave, nunca a de outra), `note` (texto livre), `updatedAt`.
2. **O loop (spec `0006`) relê a diretriz a cada ciclo**, igual já faz com o papel — uma
   mudança na diretriz tem efeito no próximo ciclo da conta, sem reiniciar o processo.
3. **`paused: true` faz a conta parar de agir** (não chama planner nem executor) até ser
   despausada — mesmo padrão de espera leve já usado hoje pro caso "papel sem skill".
4. **A skill de mineração (`0007`) usa `preferences.mining.preferredResource`** (quando
   presente) pra preferir, entre os POIs mineráveis candidatos, um compatível com o recurso
   pedido — é uma preferência leve: se não achar um POI compatível, **mina normalmente em
   outro lugar** (constituição, regra 6: nunca falha calado, mas também nunca trava por uma
   preferência não atendida).
5. **Qualquer skill que já fosse consultar o Decider recebe `note`** como contexto extra na
   pergunta — hoje nenhuma skill (`0007`/`0008`/`0011`) chega a esse ponto (todas resolvem
   mecanicamente), então isso fica pronto sem efeito observável ainda; passa a valer no dia
   em que uma skill precisar perguntar algo ambíguo de verdade.
6. **Uma página web** (servida localmente, autenticação básica usuário/senha) lista as
   contas conhecidas (lidas de `roles.json`, spec `0002`) e permite ver/editar a diretriz de
   cada uma — `preferences`, `note`, e o interruptor de pausa.
7. **Escrever a diretriz nunca toca estado do jogo nem `roles.json`** — só o arquivo da
   própria conta, mesma garantia que `0002` já tem pra troca de papel (validação manual,
   critério de sucesso 3 daquela spec).
8. **A página é alcançável de fora** (via o túnel Cloudflare já existente,
   `spacemolt.hillebrand.ia.br`, mesma porta que o dashboard antigo usava — substitui
   aquele, `log/infra.md`), então toda tentativa de autenticação que falhar é registrada
   via devlog (nunca a senha tentada, constituição regra 12) — visibilidade mínima de
   tentativa de força bruta, sem precisar implementar rate-limit próprio nesta versão.
9. **O feed ao vivo mostra todo evento de todas as contas**, igual qualquer outro
   consumidor do canal de devlog (constituição, regra 10: compartilhado, qualquer um pode
   ouvir) — sem histórico (um refresh da página perde o que já passou, mesma limitação do
   próprio canal, spec `0005`, requisito 5) e sem filtro por conta nesta versão.
10. **O feed também exige autenticação** — mesma credencial da diretriz, mas repassada por
    query string (não por header `Authorization`) porque o `WebSocket` nativo do navegador
    não permite customizar headers no handshake. Sem credencial, a conexão é recusada antes
    de completar o handshake.
11. **Login de uma vez só**: depois que o primeiro pedido autenticado dá certo (seleção de
    conta, ou o próprio feed), o formulário de usuário/senha desaparece da tela — fica um
    indicador compacto ("Conectado como X") com um jeito de trocar de credencial se
    precisar. Nunca pede de novo em toda interação.

## Fora do escopo desta spec

- **Troca de papel** — isso continua sendo `0002`/`scripts/set-role.ts`; esta spec não
  sobrepõe nem duplica aquilo.
- **Dashboard de observabilidade completo** (histórico persistente além do que já está na
  tela, métricas agregadas, filtro por conta/tipo de evento, gráficos) — isso continua
  sendo `0013-dashboard-ui`. O que entrou aqui é só o feed ao vivo cru, sem histórico nem
  filtro — suficiente pra ver o efeito de uma diretriz, não um dashboard completo.
- **Preferências estruturadas concretas pra trading/crafting** (`0008`/`0011`) — o `schema`
  é genérico (`preferences` namespaced por skill) e já comporta isso sem spec nova; nenhum
  campo concreto é consumido por essas duas skills ainda, só por `mining`.
- **Autenticação multiusuário/robusta** — usuário/senha único (via variável de ambiente,
  nunca em texto versionado) é suficiente pro uso de um operador só.
- **Qualquer preferência que exija entender texto livre pra decidir algo mecânico** (ex.:
  "foca em ferro" só funciona porque virou um campo estruturado, `preferredResource:
  "iron"` — a página grava isso como campo, não faz a skill interpretar a frase).

## Critério de sucesso

- Editar a diretriz de `HilleBot` pela página (`preferences.mining.preferredResource =
  "iron"`) e ver, via devlog, a skill de mineração preferindo POIs de ferro no ciclo
  seguinte — sem reiniciar o processo.
- Pausar uma conta pela página e confirmar (via devlog, e pela ausência de novos eventos de
  ação) que ela para de agir até ser despausada.
- Escrever uma nota em texto livre e confirmar, numa validação manual que force uma
  pergunta ao Decider, que a nota aparece no contexto da pergunta.
