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

3. [ ] `game_client.types.ts` — `CommandResult` e a interface `GameSession` do `plan.md`.

4. [ ] `errors.ts` — normaliza qualquer erro (jogo, lib, rede) pro formato `CommandResult`;
   nenhuma exceção escapa pra quem chama (constituição, regra 6).

5. [ ] `game_client.ts` — `connect(accountName)`: lê `accounts/<accountName>/credentials.json`,
   autentica via lib (`account.login(username, password)`), expõe `call()`, `on()` e
   `initialState`. Único arquivo que importa `@spacemolt/lib` e `fs` pra credenciais.

6. [ ] `rate_limit.ts` — embrulha `GameSession.call` com retry exponencial (base 1s, até 5
   tentativas, respeita `details.retry_after` quando vier no erro).

7. [ ] **Teste automatizado com fake da lib** (sem rede): confirma que `game_client.ts`
   normaliza erro corretamente e que `rate_limit.ts` retenta como esperado.

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
