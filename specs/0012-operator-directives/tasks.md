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

12. [ ] **Validação manual — página web**: rodar `scripts/run-directives-server.ts`,
    abrir a página, editar a diretriz de uma conta pela UI (não só via `writeDirective`
    direto), confirmar que o arquivo muda e o efeito aparece no próximo ciclo. Confirma
    também se `node --env-file=.env` funciona como esperado neste ambiente (Windows).

## Nota sobre granularidade

Itens 10–12 são validação manual, não teste de CI — ficam como checklist feito uma vez
antes de considerar a feature pronta, igual às specs anteriores. O item 10 é o mais
importante dos três: é a primeira vez que o projeto depende de saber o tipo de recurso por
POI (campo ainda não confirmado contra o jogo real) — se a validação mostrar que o campo
tem outro nome, corrigir ali mesmo, documentando como as correções anteriores desta sessão.
