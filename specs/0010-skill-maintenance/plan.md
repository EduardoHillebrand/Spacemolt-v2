# 0010 — Maintenance — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Nenhuma dependência nova.

## Arquitetura

```
app/
  core/
    maintenance.ts     # checkAndRepair(ctx, opts?), checkInsurance(ctx, opts?)
```

Mora em `app/core/`, igual a `0009`, pelo mesmo motivo (não é skill registrada).

### Tipos

```ts
export type RepairResult =
  | { status: "repaired"; method: "credits" | "repair_kit" }
  | { status: "not_needed" }
  | { status: "blocked"; code: string; message: string };

export type InsuranceResult =
  | { status: "valid" }
  | { status: "purchased" }
  | { status: "blocked"; code: string; message: string };
```

### `checkAndRepair(ctx, opts?: { target?: "self" | "fleet"; thresholdPercent?: number })`

```ts
const DEFAULT_REPAIR_THRESHOLD_PERCENT = 70; // heurística própria, ver riscos abaixo

async function checkAndRepair(ctx: SkillContext, opts = {}): Promise<RepairResult> {
  if (opts.target === "fleet") {
    return readFleetHullStatus(ctx.session); // repair target=fleet — grátis, só leitura
  }

  const ship = await ctx.session.send("spacemolt_ship", "get_ship", {});
  const threshold = opts.thresholdPercent ?? DEFAULT_REPAIR_THRESHOLD_PERCENT;
  if (hullPercent(ship) >= threshold) return { status: "not_needed" };

  const method = ship.docked ? "credits" : "repair_kit";
  const result = await ctx.session.send("spacemolt_ship", "repair", method === "repair_kit" ? { target: "self" } : {});
  return mapRepairResult(result, method); // sem crédito / sem kit / sem serviço -> blocked com code
}
```

- **Limiar de 70% é heurística própria, não documentada pelo jogo** — os docs lidos dão
  limiares pra combustível (50/25/10%) mas nenhum pra casco. Fica como constante nomeada,
  fácil de ajustar depois de alguma validação manual real medindo o quão rápido o casco cai
  em combate/mineração.
- **Escolha do método é automática pelo estado da nave** (`ship.docked`), nunca um parâmetro
  que quem chama precisa adivinhar — simplifica a chamada pras skills (`mining`/`trading`/
  `crafting` só chamam `checkAndRepair(ctx)` sem saber onde a nave está).

### `checkInsurance(ctx, opts?: { autobuy?: boolean })`

```ts
async function checkInsurance(ctx: SkillContext, opts = {}): Promise<InsuranceResult> {
  const policy = await ctx.session.send("spacemolt_ship", "view_insurance", {});
  if (policy.valid) return { status: "valid" };
  if (!opts.autobuy) return { status: "blocked", code: "no_insurance", message: "..." };

  const result = await ctx.session.send("spacemolt_ship", "buy_insurance", {});
  return mapInsuranceResult(result);
}
```

`autobuy` default `false` — comprar seguro gasta crédito que a skill chamadora pode preferir
gastar de outro jeito; deixar explícito evita que `checkInsurance` tome essa decisão
financeira por conta própria.

## O que NÃO entra aqui

- Combustível (`0009`).
- Qualquer lógica de wreck/morte/respawn.
- Registro no `skill_registry` — mesma razão de `0009`.
- Lógica de "vale a pena reparar vs. vender a nave e comprar outra" — decisão financeira de
  alto nível, fora do escopo de um módulo de baixo nível.

## Riscos assumidos

- **Limiar de reparo (70%) é um palpite, não um dado do jogo** — pode ser ajustado sem
  problema (é uma constante, não um contrato), mas até uma validação manual real medir
  degradação de casco em cenários reais, tratar como provisório.
- **Erros documentados de `repair` não foram confirmados na pesquisa** (ao contrário de
  `refuel`, que tem códigos nomeados) — `mapRepairResult` vai tratar qualquer coisa não
  reconhecida como `{status: "blocked", code: "unknown_repair_error"}` até validação manual
  revelar os códigos reais.
- **Desgaste de módulo por uso não documentado** — se existir (ex. laser de mineração
  perdendo eficiência), este módulo não cobre isso hoje; ficaria como extensão futura, não
  suposição de agora.

## Alternativas consideradas e descartadas

- **Maintenance como skill própria no loop**: mesma razão de `0009` — rodaria raramente e
  competiria por atenção do loop sem ganho real, já que o momento certo de reparar é sempre
  amarrado a uma parada que outra skill já ia fazer (vender carga, reabastecer).
- **Reparo automático sempre que abaixo do limiar, sem opção de pular**: mais simples, mas
  tiraria da skill chamadora a chance de decidir "não vale parar agora, o casco ainda
  aguenta" — preferiu-se expor o limiar como parâmetro, com um default sensato.
