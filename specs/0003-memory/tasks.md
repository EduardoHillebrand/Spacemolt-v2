# 0003 — Memory — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

1. [ ] **Spike de validação do endpoint de embeddings do Ollama**: script isolado e
   descartável que chama `POST /api/embeddings` com `nomic-embed-text` e confirma formato
   da resposta, dimensão do vetor e tempo de resposta — antes de depender disso no resto.

2. [ ] **`app/core/embeddings.ts`**: `embed(text)`, usando o formato confirmado no spike.
   Local em `core/`, não em `memory/`, porque a spec `0004-knowledge-base-integration`
   também vai precisar dele.
   Erro claro (constituição, regra 6) se o Ollama estiver indisponível — nunca lança
   exceção não tratada pra quem chama.

3. [ ] **`app/memory/long_term_memory.ts`**: `remember`, `recall`, `list`, formato de
   `memory.json` do `plan.md`. Escrita atômica (arquivo temporário + rename) com
   `memory.json.bak` da versão anterior antes de sobrescrever.

4. [ ] **`app/memory/operational_state.ts`**: helper `snapshot(session)` + comentário
   formalizando a regra: nada aqui é persistido em disco como fonte de verdade.

5. [ ] **Helper do Captain's Log**: extrai o texto do Captain's Log do `initialState` do
   login (spec `0001`) e serve como contexto de partida só quando `list(accountName)`
   devolve vazio.

6. [ ] **Teste automatizado** (fake de `embed()`, sem rede real): `remember` grava e persiste;
   `recall` devolve ordenado por similaridade; `list` devolve tudo; simular falha no meio da
   escrita e confirmar que `memory.json.bak` continua íntegro.

7. [ ] **Validação manual — persistência**: registrar uma lição numa conta de teste, matar o
   processo, religar, confirmar que `recall` ainda encontra. → critério de sucesso 1 da
   `spec.md`.

8. [ ] **Validação manual — relevância**: registrar uma lição com um texto, consultar depois
   com palavras diferentes mas relacionadas ao mesmo contexto, confirmar que ela aparece entre
   as mais relevantes. → critério de sucesso 2 da `spec.md`.

9. [ ] **Validação manual — isolamento entre contas**: confirmar que uma lição registrada
   numa conta nunca aparece no `recall` de outra conta.

## Nota sobre granularidade

Itens 7–9 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta, igual às specs `0001` e `0002`.
