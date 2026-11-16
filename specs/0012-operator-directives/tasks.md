# 0012 — Operator Directives — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0002-accounts-and-roles` (lista de contas via `roles.json`),
> `0006-agent-loop` (ponto de integração do `paused`/`ctx.directive`) e `0007-skill-mining`
> (único consumidor concreto de `preferences` por enquanto) já implementadas.

1. [x] **`app/directives/directive.ts`**: `Directive`, `readDirective(accountName)`
   (devolve default se o arquivo não existir ou estiver corrompido), `writeDirective
   (accountName, patch)` (merge parcial — `preferences` funde por chave de skill, resto
   substitui — + escrita atômica, mesmo padrão tmp+rename de `long_term_memory.ts`).

2. [x] **`.gitignore`**: confirmado — `accounts/` e `.env` já cobrem tudo que esta spec
   precisa, nenhuma entrada nova necessária.

3. [x] **`app/directives/server.ts`**: servidor `node:http` nativo — `GET /api/accounts`
   (público, lê `roles.json` via `account_role.ts.listAccounts`, nova função), `GET`/
   `POST /api/directive/:account` (auth básica via `DIRECTIVES_USER`/`DIRECTIVES_PASS`,
   comparação com `timingSafeEqual`), `GET /` serve `static/directives.html`. Porta
   `DIRECTIVES_PORT = 5000` (mesma porta do túnel Cloudflare pra
   `spacemolt.hillebrand.ia.br`, `log/infra.md`). Toda falha de autenticação emite
   `directive_auth_failed` via devlog (nunca a senha tentada). `accountsDir`/`rolesPath`
   injetáveis via `DirectivesServerOptions` (só pra teste, produção usa os defaults).

4. [x] **`static/directives.html`**: página única — login básico (usuário/senha guardados
   só em memória da aba, nunca persistidos), lista de contas, formulário por conta
   (recurso preferido, nota livre, toggle de pausa), sem framework de frontend.

5. [x] **`scripts/run-directives-server.ts`**: entrypoint do processo (mesmo padrão de
   `scripts/run-devlog-server.ts`), avisa no console se as variáveis de auth não estiverem
   definidas.

6. [x] **`app/loop/skill_interface.ts`**: `SkillContext` ganha `directive: { preferences:
   Record<string, unknown>; note: string }`.

7. [x] **`app/loop/run_account_loop.ts`**: relê a diretiva a cada ciclo; `paused: true`
   interrompe antes de chamar planner/executor (mesmo padrão de espera leve do caso "sem
   skill pro papel", emite `account_paused`/`account_resumed` só na transição, não a cada
   poll); monta `ctx.directive` já recortado pro namespace da skill ativa.

8. [x] **`app/skills/mining/state.ts`**: `findMinablePoi` ganha parâmetro opcional
   `preferredResource`, filtra por um campo `resource_type` ainda não confirmado (mesma
   lacuna de `0007`); `app/skills/mining/planner.ts` tenta o filtro primeiro, cai pro
   comportamento padrão sem erro se não achar.

9. [x] **Teste automatizado** (sem rede, fakes): 15 testes novos em
   `directive.test.ts`/`server.test.ts`/`planner.test.ts` (mining) — merge parcial de
   `writeDirective` correto em todos os casos (preferences por skill, resto do documento);
   escrita atômica preserva `.bak`; servidor recusa sem credencial configurada, recusa
   credencial errada, aceita credencial certa e persiste; `/api/accounts` nunca exige auth;
   mining prefere POI compatível quando o filtro bate, cai pro padrão quando não bate.

10. [ ] **Validação manual — preferência de mineração real**: setar `preferredResource:
    "iron"` pra `HilleBot` via `writeDirective` (ou direto no arquivo, se o servidor ainda
    não estiver rodando) e confirmar via devlog se a skill passa a preferir POIs
    compatíveis — **esta validação também confirma (ou corrige) os nomes de campo de
    recurso por POI ainda não confirmados em `0007`**.

11. [ ] **Validação manual — pausa**: pausar `ironvex` (ou outra conta de teste) e
    confirmar, via devlog, ausência de novos eventos de ação até despausar.

12. [x] **Validação manual — servidor sobe de verdade**: `node --env-file=.env` confirmado
    funcionando neste Windows (sem o aviso de variável ausente); `GET /api/accounts` real
    devolveu as 3 contas reais (`hillebot`/`miner`, `ironvex`/`miner`, `medici`/`trader`);
    sem auth → 401; com a credencial real do `.env` → 200. Falta só abrir a página num
    navegador de verdade (item 12b).

12b. [ ] **Validação manual — pela página de verdade, não só API**: abrir a página num
    navegador, logar, editar a diretriz de uma conta pela UI (não só via `writeDirective`
    direto), confirmar que o arquivo muda e o efeito aparece no próximo ciclo.

13. [x] **`app/devlog/subscriber.ts`**: `createDevlogSubscriber(onEvent, options?)` —
    consome todo evento do canal de devlog (spec 0005), reconecta com backoff curto (5s
    default). **Bug real encontrado e corrigido** (também existia em `app/devlog/
    client.ts` desde a spec `0005`, nunca exercitado até agora): `close()` chamado
    enquanto uma conexão ainda estava em voo não impedia o `open` de guardar o socket —
    ficava pendurado pra sempre, handle que nunca deixa o processo terminar sozinho.
    Corrigido nos dois arquivos (checagem de `closed` dentro do handler de `open`).

14. [x] **`app/directives/server.ts`**: ganha `/live` (upgrade manual de WebSocket via
    `server.on("upgrade", ...)` + `wss.handleUpgrade`, não o atalho `path` do `ws` —
    precisa recusar credencial errada **antes** do handshake completar). Autenticação via
    query string (`?user=&pass=`), única forma prática já que o `WebSocket` nativo do
    navegador não manda header `Authorization` no handshake. Repassa todo evento recebido
    do `createDevlogSubscriber` pra todo cliente `/live` conectado.

15. [x] **`static/directives.html`**: layout de duas colunas (`1fr 2fr`, uma coluna no
    celular); painel de login desaparece após o primeiro pedido autenticado que der certo,
    com indicador compacto "Conectado como X" + botão "trocar"; coluna da direita com o
    feed ao vivo (sem framework, `WebSocket` nativo, reconecta sozinho se cair).

16. [x] **Teste automatizado**: 8 testes novos em `subscriber.test.ts` (recebe evento de
    qualquer conta emissora; mensagem malformada nunca propaga; `close()` para de
    reconectar; regressão do bug do item 13) e 2 em `server.test.ts` (`/live` sem
    credencial na query nunca completa o handshake; `/live` com credencial certa recebe
    evento do devlog em tempo real). **Também corrigido**: `server.test.ts` e
    `subscriber.test.ts` escolhiam a mesma porta de devlog de teste por coincidência
    (`17791`) — como `node --test` roda arquivos em paralelo (processos separados, portas
    são globais do SO), isso causava travamento intermitente só quando os dois corriam ao
    mesmo tempo; corrigido reservando faixas de porta sem overlap por arquivo.

17. [ ] **Validação manual — feed ao vivo contra contas reais**: com `HilleBot`/`ironvex`/
    `Medici` rodando de verdade, abrir a página e confirmar que os eventos de cada uma
    aparecem no feed em tempo real, sem precisar dar refresh.

## Nota sobre granularidade

Itens 10, 11, 12b e 17 são validação manual, não teste de CI — ficam como checklist feito
uma vez antes de considerar a feature pronta, igual às specs anteriores. O item 10 é o mais
importante: é a primeira vez que o projeto depende de saber o tipo de recurso por POI
(campo ainda não confirmado contra o jogo real) — se a validação mostrar que o campo tem
outro nome, corrigir ali mesmo, documentando como as correções anteriores desta sessão.
O item 17 depende de pelo menos uma conta real estar rodando com `0006` de pé (loop
completo) — hoje nenhuma está, então pode ficar pendente como as validações de `0007`–
`0011` já estão.
