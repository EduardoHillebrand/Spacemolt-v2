# 0004 — Knowledge Base Integration — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: os itens 2 e 5 usam `app/core/embeddings.ts`. Se a spec `0003-memory`
> ainda não tiver sido implementada quando chegar a vez desta, implementar
> `app/core/embeddings.ts` aqui mesmo (ele é parte das duas specs, não duplicar depois).

1. [x] **`app/knowledge/chunker.ts`**: quebra por seção markdown, depois por parágrafo.
   **Achado crítico no build real**: um parágrafo único (sem linha em branco, ex. lista
   longa de uma linha) podia sozinho passar do teto e quebrar o limite de contexto do
   modelo de embedding — corrigido com corte na força bruta por tamanho quando isso
   acontece (`splitOversizedParagraph`). Ver nota no `plan.md`.

2. [x] **`app/knowledge/index_builder.ts`**: `build()`. Também ganhou retry (3 tentativas,
   backoff) em falha de embedding — ~1000 chamadas sequenciais ao Ollama local esbarram em
   erro transiente de vez em quando.

3. [x] **`scripts/build-knowledge-index.ts`**: CLI com barra de progresso simples.

4. [x] **`.gitignore`**: `knowledge_base/index.json` adicionado.

5. [x] **`app/knowledge/query.ts`**: `search(question, topK?)` e `reload()`. `cosineSimilarity`
   compartilhada com a `0003` via `app/core/similarity.ts` (constituição, regra 5).

6. [x] **Teste automatizado** (`chunker.test.ts`, `index_builder.test.ts`): 9 testes, todos
   passando — inclui o caso do parágrafo gigante e o retry de embedding.

7. [x] **Build real rodado** contra os 50 arquivos distilados + `SKILL_MANUAL.md`: **1042
   chunks, 147s** (~2.5min). Só terminou sem erro depois da correção do item 1.

8. [x] **Validação manual — relevância**: "quanto custa viajar X saltos com Y combustível"
   trouxe `docs_guides_fuel.md > Checklist pré-voo` no top 3, em 213ms. → critério 1
   confirmado.

9. [x] **Validação manual — atualização sem código**: adicionado um marcador de teste em
   `docs.md`, rebuild rodado, marcador apareceu na posição #3 de 1043 chunks numa busca
   relacionada — sem tocar em nenhum código. Marcador removido depois, índice reconstruído
   de novo. → critério 2 confirmado.

10. [x] **Validação manual — velocidade**: 3 buscas típicas, média de **59ms** cada —
    nada perceptível no ciclo de decisão. → critério 3 confirmado.

## Nota sobre granularidade

Itens 8–10 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta, igual às specs anteriores.
