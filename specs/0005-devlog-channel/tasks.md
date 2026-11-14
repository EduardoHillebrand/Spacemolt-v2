# 0005 — Devlog Channel — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

1. [ ] **`app/devlog/event.ts`**: tipo `DevlogEvent` e `scrub()`, cobrindo campo sensível em
   qualquer profundidade (objeto aninhado, array de objetos).

2. [ ] **`app/devlog/server.ts`**: servidor WebSocket na porta `7788`, fan-out simétrico
   entre clientes conectados, validação mínima do envelope (descarta evento malformado sem
   propagar).

3. [ ] **`app/devlog/client.ts`**: `emit()` — preenche `account`/`timestamp`
   automaticamente, aplica `scrub()`, reconecta em segundo plano com backoff de até 30s,
   nunca bloqueia nem lança exceção pra quem chama (nem quando o servidor nunca existiu).

4. [ ] **`scripts/devlog-tail.ts`**: CLI que conecta no `server.ts` e imprime eventos
   recebidos, com filtro opcional `--account <nome>`.

5. [ ] **Teste automatizado**: `scrub()` redige campo sensível em profundidade; `emit()` não
   lança nem bloqueia mesmo com o servidor fora (mock de conexão falha); `server.ts`
   descarta evento malformado sem repassar.

6. [ ] **Entrada no PM2** pro `server.ts` — processo próprio, sempre ligado, separado dos
   processos por conta.

7. [ ] **Validação manual — fan-out**: subir `server.ts` + dois emissores simulando duas
   contas diferentes, abrir `devlog-tail.ts` e confirmar que os eventos de ambas chegam,
   cada um identificado pela conta de origem. → critério de sucesso 1 da `spec.md`.

8. [ ] **Validação manual — resiliência**: desligar o `devlog-tail.ts` (ninguém ouvindo) e
   confirmar que os emissores continuam rodando sem erro nem lentidão perceptível.
   → critério de sucesso 2.

9. [ ] **Validação manual — segredo nunca passa**: emitir deliberadamente um evento com um
   campo tipo `password` no payload e confirmar, no `devlog-tail.ts`, que chega redigido.
   → critério de sucesso 3.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta, igual às specs anteriores.
