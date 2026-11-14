# 0002 — Accounts and Roles — Plan

## Stack

TypeScript/Node, mesmo runtime da spec `0001-connection-layer`. Nenhuma dependência nova.

## Arquitetura

```
roles.json                   # raiz do projeto, VERSIONADO no git (não é segredo)
app/
  roles/
    catalog.ts                # papéis conhecidos: miner/trader/artisan -> skills + objective
    account_role.ts           # único lugar que LÊ roles.json
scripts/
  set-role.ts                 # único lugar que ESCREVE em roles.json
```

### `roles.json` — na raiz, não em `accounts/`

Um objeto por conta conhecida:

```json
{
  "hillebot": { "current": "miner", "intended": null },
  "ironvex":  { "current": "miner", "intended": "artisan" },
  "medici":   { "current": "trader", "intended": null }
}
```

Fica na **raiz do repo**, não dentro de `accounts/` — `accounts/` é inteiramente gitignorado
(constituição, regra 12) porque guarda credenciais, mas papel não é segredo. Colocar fora
disso dá dois ganhos de propósito:

1. **Histórico de papel visível no `git log`** — toda troca de papel vira um commit, o que
   por si só cumpre bem o requisito 3 da spec (troca sempre deliberada e explícita).
2. Serve, de graça, como **registro de quais contas existem** — útil mais pra frente pra
   configurar os processos PM2 (um por conta, spec `0001`), sem precisar de outro arquivo.

### `catalog.ts` — papéis são código, não JSON solto

```ts
type Role = "miner" | "trader" | "artisan";

const CATALOG: Record<Role, { skills: SkillName[]; objective: string }> = {
  miner:   { skills: ["mining", "navigation", "maintenance"], objective: "..." },
  trader:  { skills: ["trading", "navigation"], objective: "..." },
  artisan: { skills: [], objective: "..." }, // placeholder até a skill de crafting existir
};
```

É código (não JSON) de propósito: os nomes de skill (`SkillName`) são um tipo TypeScript, não
uma string livre — um nome errado quebra o build, não falha silenciosamente em runtime.

### `account_role.ts` — única leitura

```ts
function getRole(accountName: string): { current: Role; intended: Role | null };
function getRoleDefinition(role: Role): { skills: SkillName[]; objective: string };
```

Nenhum outro módulo (Planner, Decider, Executor, qualquer skill) lê `roles.json` direto —
todos passam por aqui. Isso é o que torna o requisito 3 da spec garantido por código, não só
por convenção: **nenhum caminho de execução do agente tem permissão de escrita** nesse
arquivo.

### `scripts/set-role.ts` — único lugar com permissão de escrita

CLI standalone, roda fora do processo do agente:

```
node scripts/set-role.ts <conta> <papel> [--intended <papel>]
```

É a única peça do sistema que escreve em `roles.json`. Depois de mudar, reiniciar o
processo PM2 daquela conta pra ele reler o papel (constituição, regra 4 — "trocar de conta
é só ligar outro processo" se aplica igual aqui: trocar de papel é só reiniciar o processo
dela).

### Uso no startup do processo de uma conta

No arranque (spec `0001`, após `game_client.connect`), o processo chama
`getRole(accountName)` pra saber que skills carregar e qual `objective` entregar ao Decider
quando a decisão for ambígua.

## O que NÃO entra aqui

- Nenhuma skill de verdade — `catalog.ts` referencia skills que `artisan` ainda não tem
  (lista vazia até a spec de crafting existir).
- Nenhum processo automático de troca de papel — `set-role.ts` só roda quando alguém (o
  usuário, hoje) decide rodar.

## Riscos assumidos

- `roles.json` acessado por mais de um processo (um por conta) ao mesmo tempo, só leitura —
  sem risco de corrupção por escrita concorrente, porque só `set-role.ts` escreve, e roda
  fora dos processos do agente.
- Formato plano (um objeto, não uma pasta por conta) pode ficar bagunçado se o número de
  contas crescer muito — aceitável pro tamanho atual (3 contas); reavaliar se passar de ~10.
