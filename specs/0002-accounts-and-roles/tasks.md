# 0002 — Accounts and Roles — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

1. [ ] **`roles.json` na raiz** com as 3 contas conhecidas hoje:
   ```json
   {
     "hillebot": { "current": "miner", "intended": null },
     "ironvex":  { "current": "miner", "intended": "artisan" },
     "medici":   { "current": "trader", "intended": null }
   }
   ```

2. [ ] **`app/roles/catalog.ts`**: tipo `Role` (`"miner" | "trader" | "artisan"`), tipo
   `SkillName`, e o `CATALOG` com `skills` + `objective` por papel. `artisan` começa com
   `skills: []` (placeholder até a spec de crafting existir).

3. [ ] **`app/roles/account_role.ts`**: `getRole(accountName)` e `getRoleDefinition(role)`.
   Erro claro (constituição, regra 6) se a conta não existir em `roles.json` ou se o papel
   não existir no `CATALOG` — nunca `undefined` silencioso.

4. [ ] **`scripts/set-role.ts`**: CLI (`node scripts/set-role.ts <conta> <papel> [--intended <papel>]`)
   que valida o papel contra o `CATALOG` e escreve em `roles.json`. Única peça do sistema
   com permissão de escrita nesse arquivo.

5. [ ] **Teste automatizado** (sem rede, `roles.json` de teste): `getRole`/`getRoleDefinition`
   com conta/papel válidos e inválidos; `set-role.ts` rejeita papel desconhecido.

6. [ ] **Ponto de integração no startup do processo de uma conta** (spec `0001`): logo após
   `game_client.connect`, chamar `getRole` + `getRoleDefinition` pra saber que skills
   carregar e qual `objective` entregar ao Decider.
   > Depende de `0001-connection-layer` estar implementada — se ainda não estiver, este item
   > fica marcado como bloqueado, não como feito.

7. [ ] **Validação manual — troca de papel não toca estado do jogo**: rodar `set-role.ts`
   numa conta de teste, confirmar que só `roles.json` muda (ver `git diff`) e que nenhuma
   credencial ou estado do jogo é tocado. → critério de sucesso 2 da `spec.md`.

8. [ ] **Validação manual — conta nova sem código**: adicionar uma entrada de teste em
   `roles.json` (sem credenciais reais) e confirmar que `account_role.ts` lê normalmente sem
   precisar tocar em `catalog.ts` nem em qualquer outro arquivo. → critério de sucesso 3 da
   `spec.md`.

## Nota sobre granularidade

Itens 7–8 são validação manual, não teste de CI — ficam como checklist feito uma vez antes
de considerar a feature pronta, igual à `0001-connection-layer`.
