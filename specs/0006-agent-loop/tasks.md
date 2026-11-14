# 0006 — Agent Loop — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: esta feature integra `0001` (conexão), `0002` (papéis), `0003`
> (memória), `0004` (base de conhecimento) e `0005` (devlog). Se alguma ainda não estiver
> implementada quando chegar a vez desta, implementar o mínimo necessário dela aqui mesmo,
> sem duplicar o que já está especificado nessas specs.

1. [x] **`app/loop/skill_interface.ts`**: `Plan`, `ExecutorResult`, `Skill`, `SkillContext`.

2. [x] **`app/core/decider.ts`**: `ask(question)` via `/api/chat` do Ollama
   (`{message: {content}}`, confirmado antes de implementar).

3. [x] **`app/loop/skill_registry.ts`**: `resolve(skillNames)` — mapa fixo, vazio hoje.
   Ganhou `registerForTest`/`unregisterForTest` pra viabilizar as validações manuais sem
   precisar de uma skill real.

4. [x] **`app/loop/run_account_loop.ts`**: o loop completo. **Duas correções feitas na
   implementação** (detalhadas no `plan.md`): (a) extraído um `advance()` puro e testável,
   com `try/catch` em volta de `planner`/`executor` — uma exceção real de uma skill (bug,
   não erro de jogo) agora é tratada como `{status:"error"}`, não derruba o loop; (b)
   adicionado um `await setImmediate()` por iteração sem backoff, pra nunca travar o event
   loop numa fila de microtasks se um executor resolver quase instantaneamente.

5. [x] **`app/main.ts`**: entrypoint trivial.

6. [x] **Teste automatizado** (`run_account_loop.test.ts`): 8 testes sobre `advance()` —
   nunca 2 planos simultâneos, `invalidated` volta pro planner, `error` estruturado E
   exceção real incrementam backoff sem derrubar, backoff cresce com erros consecutivos.

7. [x] **Validação manual — papel sem skill implementada**: `ironvex` temporariamente em
   `artisan` (skills vazias). Loop não crashou (confirmado 2x) e emitiu
   `no_skills_for_role` via devlog em ~6s (confirmado numa checagem isolada com janela de
   espera maior — a primeira tentativa combinada com os itens 8-10 esperou só 6s, no limite
   exato do tempo real de login+1º ciclo, e não viu o evento a tempo; não era bug).
   → critério de sucesso 1 confirmado.

8. [x] **Validação manual — ciclo completo com skill fake** (`scripts/validate-agent-loop.ts`,
   conta real `ironvex`, skill `mining` fake registrada via `registerForTest`): planner
   chamado, `plan_created` no devlog, executor chamado repetidamente mantendo o mesmo plano.
   → critério de sucesso 1 (variante com skill fake) confirmado.

9. [x] **Validação manual — replanejamento**: executor fake devolveu `invalidated`,
   `plan_invalidated` apareceu no devlog e o planner foi chamado de novo depois.
   → critério de sucesso 2 confirmado.

10. [x] **Validação manual — erro não derruba**: executor fake devolveu `error`
    deliberadamente, `skill_error` apareceu no devlog, e o executor continuou sendo chamado
    depois (loop seguiu vivo). → critério de sucesso 3 confirmado.

> **Achado à parte, não um bug**: rodando essas validações repetidamente contra o jogo real
> ao longo da sessão, uma tentativa de conexão da `ironvex` falhou com
> `ConnectionClosedError: WebSocket connection failed before open` — provavelmente limite de
> conexões por IP do servidor (`4003`, ver pesquisa da `0001`) por reconectar essa conta
> muitas vezes hoje. Login voltou a funcionar normalmente poucos segundos depois. Não é
> defeito do código; vale espaçar reconexões de teste na mesma conta no futuro.

## Nota sobre granularidade

Itens 7–10 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta. Itens 8–10 usam uma skill fake porque nenhuma skill real
(`0007+`) está especificada ainda — vale repetir a validação com uma skill de verdade depois.
