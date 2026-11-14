# 0002 — Accounts and Roles — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

1. [x] **`roles.json` na raiz** com as 3 contas conhecidas hoje:
   ```json
   {
     "hillebot": { "current": "miner", "intended": null },
     "ironvex":  { "current": "miner", "intended": "artisan" },
     "medici":   { "current": "trader", "intended": null }
   }
   ```

2. [x] **`app/roles/catalog.ts`**: tipo `Role` (`"miner" | "trader" | "artisan"`), tipo
   `SkillName`, e o `CATALOG` com `skills` + `objective` por papel. `artisan` começa com
   `skills: []` (placeholder até a spec de crafting existir).

3. [x] **`app/roles/account_role.ts`**: `getRole(accountName)` e `getRoleDefinition(role)`.
   Erro claro (constituição, regra 6) se a conta não existir em `roles.json` ou se o papel
   não existir no `CATALOG` — nunca `undefined` silencioso. Caminho do arquivo injetável
   (`rolesPath`), pra dar pra testar sem tocar no `roles.json` real.

4. [x] **`scripts/set-role.ts`**: CLI (`node scripts/set-role.ts <conta> <papel> [--intended <papel>]`)
   que valida o papel contra o `CATALOG` (via `isValidRole`) e escreve em `roles.json`.

5. [x] **Teste automatizado** (`catalog.test.ts`, `account_role.test.ts`, sem rede): 8
   testes, todos passando.

6. [x] **Ponto de integração no startup do processo de uma conta**: feito em
   `app/loop/run_account_loop.ts` (spec `0006-agent-loop`) — `loadActiveSkills()` chama
   `getRole`/`getRoleDefinition` logo após `connect()`.

7. [x] **Validação manual — troca de papel não toca estado do jogo**: rodado
   `set-role.ts ironvex artisan` e revertido — só `roles.json` mudou (confirmado por
   inspeção direta; o script não tem acesso a `accounts/` nem ao jogo no código).
   → critério de sucesso 2 confirmado.

8. [x] **Validação manual — conta nova sem código**: adicionada entrada `testaccount` em
   `roles.json`, `getRole`/`getRoleDefinition` leram normalmente sem tocar em `catalog.ts`
   nem em outro arquivo. Entrada removida depois. → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 7–8 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual à `0001-connection-layer`.

## Revisão pendente (2026-11-14, descoberta ao especificar `0007`–`0011`)

A pesquisa feita antes de escrever `0009-skill-navigation` e `0010-skill-maintenance`
mostrou que navegação e manutenção não são skills que competem no loop (spec `0006`) — são
módulos compartilhados em `app/core/`, chamados de dentro de `mining`/`trading`/`crafting`.
Isso significa que `CATALOG` em `catalog.ts` está desatualizado:

- `SkillName` deveria perder `"navigation"` e `"maintenance"` como variantes válidas (não há
  objeto `Skill` registrável com esses nomes).
- `miner.skills`: `["mining", "navigation", "maintenance"]` → `["mining"]`.
- `trader.skills`: `["trading", "navigation"]` → `["trading"]`.
- `artisan.skills`: `[]` → `["crafting"]` (quando `0011` for implementada).

9. [ ] **Aplicar a revisão acima em `catalog.ts`** — marcado como task de `0007` (ver
   `specs/0007-skill-mining/tasks.md`, item 1), não desta spec, porque é `0007` quem
   primeiro precisa que `catalog.ts` reflita a skill `mining` isolada. Este item fica aqui
   só como registro da decisão; o checkbox real de implementação vive em `0007`.
