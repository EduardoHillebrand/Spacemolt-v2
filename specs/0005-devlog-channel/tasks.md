# 0005 — Devlog Channel — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

1. [x] **`app/devlog/event.ts`**: `DevlogEvent` e `scrub()`, cobrindo campo sensível em
   qualquer profundidade.

2. [x] **`app/devlog/server.ts`**: servidor WebSocket (pacote `ws` — Node não tem
   implementação server-side nativa, só client-side) na porta `7788`, fan-out simétrico,
   evento malformado descartado sem propagar.

3. [x] **`app/devlog/client.ts`**: `emit()` — usa o `WebSocket` nativo do Node (client-side)
   pra conectar no `server.ts`. Nunca lança nem bloqueia.

4. [x] **`scripts/devlog-tail.ts`**: CLI com filtro `--account`.

5. [x] **Teste automatizado** (`event.test.ts`, `devlog.test.ts`): 9 testes — `scrub` em
   profundidade, `emit()` sem servidor, fan-out real (servidor+clientes de teste em porta
   separada), evento malformado descartado.

6. [x] **`ecosystem.config.cjs`** criado com entrada `devlog-server` (processo único,
   `instances: 1`). **Não validado rodando de verdade**: o PM2 não está instalado nesta
   máquina, apesar do `log/infra.md` dizer que está — discrepância registrada em
   `log/licoes-aprendidas.md`. O entrypoint (`scripts/run-devlog-server.ts`) foi testado
   rodando direto com `node`, funciona.

7. [x] **Validação manual — fan-out** (`scripts/validate-devlog.ts`): servidor real +
   `devlog-tail.ts` real como processo separado + duas contas emitindo — ambas chegaram,
   identificadas corretamente. → critério de sucesso 1 confirmado.

8. [x] **Validação manual — resiliência**: `devlog-tail.ts` morto no meio, `emit()` das
   duas contas continuou sem lançar erro. → critério de sucesso 2 confirmado.

9. [x] **Validação manual — segredo nunca passa**: evento com `password` no payload chegou
   no `devlog-tail.ts` com o campo como `[REDACTED]`, nunca em texto puro.
   → critério de sucesso 3 confirmado.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta, igual às specs anteriores.
