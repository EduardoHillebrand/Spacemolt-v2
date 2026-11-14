# 0001 — Connection Layer — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7) — branch só se algum item virar mais arriscado que o esperado.

1. [x] **Scaffold do projeto Node/TypeScript**: `package.json`, `tsconfig.json`, estrutura
   `app/`, instalar `@spacemolt/lib`, lint/build mínimos.
   > Nota: precisou trocar o Node da máquina pra v25.6.1 via `nvm use` (admin) — v21 tem bug
   > real no WebSocket experimental com mensagens grandes, não é só o aviso de `engines`
   > sendo conservador. Ver `log/licoes-aprendidas.md`.

2. [x] **Spike de validação da lib** (`scripts/spike-lib-login.ts`): logou na conta
   `hillebot` via `Account` da lib. Confirmado: login funciona, `get_status` (query)
   funciona, e erro de comando chega como **exceção rejeitada** (`SpacemoltError`, com
   `.code`/`.message`/`.details`) — resolve a lacuna "(d)" que a pesquisa não confirmou.
   Comportamento bate com o que o `plan.md` assumiu, nenhum ajuste necessário.

3. [x] `game_client.types.ts` — `CommandResult` e a interface `GameSession` do `plan.md`.
   > Ajuste descoberto na implementação: sucesso de **mutação** e de **query** têm formatos
   > diferentes na lib (`MutationResult` tem `.command`/`.tick`/`.delta`; `QueryResult` tem
   > `.result`/`.structuredContent`) — `CommandResult.ok:true` virou uma união discriminada
   > por `kind: "query" | "mutation"` em vez de um formato único. `plan.md` não foi reescrito
   > porque o formato de erro (a parte que ele detalhava) ficou exatamente como previsto.

4. [x] `errors.ts` — normaliza `SpacemoltError`/`HttpError`/`ConnectionClosedError`/erro
   genérico pro formato `CommandResult`; nenhuma exceção escapa.

5. [x] `game_client.ts` — `connect(accountName)`: lê credenciais, autentica via
   `account.login()`, expõe `call()` (usa o `account.send(tool, action, payload)` da lib —
   achado do spike: é o método genérico em que os comandos tipados são construídos),
   `getState()`, `initialState` e `on()`.

6. [x] `rate_limit.ts` — retry exponencial (base 1s, até 5 tentativas), respeita
   `details.retry_after` (segundos) ou `details.retryAfterMs`.

7. [x] **Teste automatizado** (`errors.test.ts`, `rate_limit.test.ts`, sem rede): 10 testes,
   todos passando — normalização de cada classe de erro da lib + retry/backoff de
   `rate_limit.ts` em várias situações (sucesso direto, erro não-rate-limit, recuperação
   após N tentativas, esgotamento, HTTP 429). `engines.node: ">=22"` documentado no
   `package.json`.

8. [ ] **Validação manual — isolamento**: conectar as 3 contas (`hillebot`, `ironvex`,
   `medici`) e confirmar que cada uma recebe seu próprio estado inicial, sem se misturar.
   → critério de sucesso 1 da `spec.md`.

9. [ ] **Validação manual — reautenticação**: forçar/aguardar expiração de sessão numa
   conta e confirmar que a próxima chamada funciona sem reiniciar o processo.
   → critério de sucesso 2 da `spec.md`.

10. [ ] **Validação manual — rate limit**: disparar chamadas em sequência rápida numa conta
    e confirmar que as respostas chegam certas, só mais lentas, sem erro não tratado.
    → critério de sucesso 3 da `spec.md`.

## Nota sobre granularidade

Itens 8–10 são validação manual contra o jogo real, não testes de CI — não têm como rodar
sem rede e sem as contas de verdade, então ficam como checklist manual mesmo, feito uma vez
antes de considerar a feature pronta.
