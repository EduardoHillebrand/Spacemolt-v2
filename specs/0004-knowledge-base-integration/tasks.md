# 0004 — Knowledge Base Integration — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: os itens 2 e 5 usam `app/core/embeddings.ts`. Se a spec `0003-memory`
> ainda não tiver sido implementada quando chegar a vez desta, implementar
> `app/core/embeddings.ts` aqui mesmo (ele é parte das duas specs, não duplicar depois).

1. [ ] **`app/knowledge/chunker.ts`**: quebra por seção markdown (`##`/`###`); seções
   grandes (ex.: tabelas longas) quebram por parágrafo, teto de ~2000 caracteres por chunk.
   Cada chunk guarda arquivo de origem + título da seção.

2. [ ] **`app/knowledge/index_builder.ts`**: `build()` — varre `knowledge_base/distilled/*.md`
   + `SKILL_MANUAL.md`, chunka, chama `embed()`, grava `knowledge_base/index.json` no
   formato do `plan.md`.

3. [ ] **`scripts/build-knowledge-index.ts`**: CLI fino que só chama `index_builder.build()`.

4. [ ] **`.gitignore`**: adicionar `knowledge_base/index.json`.

5. [ ] **`app/knowledge/query.ts`**: `search(question, topK?)` e `reload()`. Carrega o
   índice uma vez por processo.

6. [ ] **Teste automatizado** (fake de `embed()`, chunks pequenos de teste): `chunker`
   quebra corretamente nos limites certos; `search` devolve ordenado por similaridade;
   `reload()` recarrega sem reiniciar processo.

7. [ ] **Rodar o build real** contra o `knowledge_base/` completo (50 páginas + manual) —
   medir tempo, confirmar que termina sem erro.

8. [ ] **Validação manual — relevância**: perguntar algo como "quanto custa viajar X saltos
   com Y combustível" e confirmar que o chunk certo (fórmula de fuel, provavelmente de
   `docs_guides_fuel.md` ou `SKILL_MANUAL.md`) aparece no topo. → critério de sucesso 1.

9. [ ] **Validação manual — atualização sem código**: editar manualmente um arquivo em
   `knowledge_base/distilled/` (ou re-rodar o crawler), rodar o build de novo, confirmar que
   a consulta já reflete a mudança sem tocar em nenhum código. → critério de sucesso 2.

10. [ ] **Validação manual — velocidade**: medir o tempo de `search()` numa pergunta típica
    e confirmar que não é perceptivelmente mais lento que o resto do ciclo de decisão.
    → critério de sucesso 3.

## Nota sobre granularidade

Itens 8–10 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta, igual às specs anteriores.
