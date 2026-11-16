# 0012 — Operator Directives — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: `0002-accounts-and-roles` (lista de contas via `roles.json`),
> `0006-agent-loop` (ponto de integração do `paused`/`ctx.directive`) e `0007-skill-mining`
> (único consumidor concreto de `preferences` por enquanto) já implementadas.

1. [ ] **`app/directives/directive.ts`**: `Directive`, `readDirective(accountName)`
   (devolve default se o arquivo não existir), `writeDirective(accountName, patch)`
   (merge parcial + escrita atômica, mesmo padrão tmp+rename de `long_term_memory.ts`).

2. [ ] **`.gitignore`**: já cobre `accounts/` (onde `directive.json` vai morar) e `.env` —
   confirmar que nenhuma entrada nova é necessária.

3. [ ] **`app/directives/server.ts`**: servidor `node:http` nativo — `GET /api/accounts`
   (público, lê `roles.json`), `GET`/`POST /api/directive/:account` (auth básica via
   `DIRECTIVES_USER`/`DIRECTIVES_PASS`), `GET /` serve `static/directives.html`. Porta
   `DIRECTIVES_PORT = 7790`.

4. [ ] **`static/directives.html`**: página única — lista de contas, formulário por conta
   (recurso preferido, nota livre, toggle de pausa), sem framework de frontend.

5. [ ] **`scripts/run-directives-server.ts`**: entrypoint do processo (mesmo padrão de
   `scripts/run-devlog-server.ts`).

6. [ ] **`app/loop/skill_interface.ts`**: `SkillContext` ganha `directive: { preferences:
   Record<string, unknown>; note: string }`.

7. [ ] **`app/loop/run_account_loop.ts`**: relê a diretiva a cada ciclo; `paused: true`
   interrompe antes de chamar planner/executor (mesmo padrão de espera leve do caso "sem
   skill pro papel"); monta `ctx.directive` já recortado pro namespace da skill ativa.

8. [ ] **`app/skills/mining/state.ts`**: `findMinablePoi` ganha parâmetro opcional de
   filtro por recurso; `app/skills/mining/planner.ts` tenta o filtro primeiro, cai pro
   comportamento padrão sem erro se não achar (preferência leve, nunca bloqueante).

9. [ ] **Teste automatizado** (sem rede, fakes): `readDirective`/`writeDirective` fazem
   merge parcial corretamente e nunca corrompem o arquivo numa escrita que falha no meio;
   `run_account_loop` não chama planner/executor quando `paused: true` (reusa o padrão de
   teste de `advance()`/loop já existente); mining prefere um POI compatível quando o
   filtro bate, e cai pro padrão sem erro quando não bate ou o campo não existe na resposta.

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
