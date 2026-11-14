# 0003 — Memory — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

1. [x] **Spike de validação do endpoint de embeddings do Ollama**: `/api/embeddings` com
   `nomic-embed-text` devolve `{ embedding: number[768] }`. ~550ms pra um chunk de 1400
   caracteres.

2. [x] **`app/core/embeddings.ts`**: `embed(text)`, erro claro se o Ollama estiver
   indisponível.

3. [x] **`app/memory/long_term_memory.ts`**: `remember`, `recall`, `list`. Escrita atômica
   (tmp + rename) com `.bak` da versão anterior. `embedFn`/`accountsDir` injetáveis pra
   teste.

4. [x] **`app/memory/operational_state.ts`**: `snapshot(session)`.

5. [x] **Helper do Captain's Log** (`app/memory/captains_log.ts`). **Correção**: não vem no
   `initialState` — pedido explicitamente via `captains_log_list`. Ver nota no `plan.md`.

6. [x] **Teste automatizado** (`long_term_memory.test.ts`, fake de `embed()`): 5 testes —
   `remember`/`list`, `recall` por similaridade, falha de embed não deixa estado parcial,
   `.bak` íntegro após segunda escrita.

7. [x] **Validação manual — persistência** (`scripts/validate-memory.ts`): registrada lição,
   relida do disco (equivalente a reiniciar processo) — `recall` encontrou.
   → critério de sucesso 1 confirmado.

8. [x] **Validação manual — relevância**: pergunta com palavras diferentes do texto
   original encontrou a lição certa no topo. → critério de sucesso 2 confirmado.

9. [x] **Validação manual — isolamento entre contas**: lição da conta B não apareceu no
   `recall` da conta A. Bônus: `getStartupContext` testado contra a conta real `hillebot`
   e encontrou uma entrada de Captain's Log escrita pelo agente antigo meses atrás.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta, igual às specs `0001` e `0002`.
