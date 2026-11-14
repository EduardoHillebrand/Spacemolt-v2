# 0004 — Knowledge Base Integration — Plan

## Stack

TypeScript/Node, mesmo runtime das demais specs. Reusa `app/core/embeddings.ts` (definido na
spec `0003-memory`, movido pra `core/` justamente por ser compartilhado entre as duas).

## Arquitetura

```
app/
  core/
    embeddings.ts            # já existe (spec 0003) — reaproveitado aqui
  knowledge/
    chunker.ts                # quebra um arquivo markdown em pedaços menores
    index_builder.ts           # lê knowledge_base/**, chunka, embeda, grava o índice
    query.ts                   # carrega o índice, busca por similaridade
scripts/
  build-knowledge-index.ts     # CLI fino: só chama index_builder.build()
knowledge_base/
  index.json                   # GERADO, não versionado — chunks + embeddings
```

### `chunker.ts` — por que quebrar em pedaços

Os arquivos de `knowledge_base/` são grandes demais pra embedar inteiros (perderia
granularidade — uma fórmula específica ficaria "diluída" num vetor que representa a página
toda). Estratégia simples: quebra por seção de markdown (`##`/`###`); seções muito grandes
(ex.: tabelas longas) quebram por parágrafo dentro da seção, com um teto de ~2000 caracteres
por chunk. Cada chunk guarda, junto do texto: arquivo de origem e título da seção — pra poder
devolver a citação exata de onde veio.

> **Correção feita rodando o build real**: quebrar só entre parágrafos não basta — uma
> seção pode ter um único "parágrafo" (sem linha em branco no meio, ex. uma lista longa de
> uma linha só) maior que o teto por si só. Isso aconteceu de fato no `SKILL_MANUAL.md`
> (um chunk de 7666 caracteres) e quebrou o limite de contexto do `nomic-embed-text`
> (`"the input length exceeds the context length"`). Corrigido com um corte na força bruta
> por tamanho (`splitOversizedParagraph`) quando um parágrafo isolado excede o teto.

### `index_builder.ts` — construção do índice

```ts
function build(): Promise<void>;
```

Varre `knowledge_base/distilled/*.md` + `knowledge_base/SKILL_MANUAL.md`, chunka cada um
(`chunker.ts`), chama `embed()` (`app/core/embeddings.ts`) pra cada chunk — com retry (3
tentativas, backoff) porque ~1000 chamadas sequenciais ao Ollama local esbarram em erro
transiente de vez em quando — e grava tudo em `knowledge_base/index.json`:

```json
{
  "chunks": [
    {
      "id": "docs_guides_fuel.md#quick-reference",
      "source": "knowledge_base/distilled/docs_guides_fuel.md",
      "section": "Referência Rápida",
      "text": "...",
      "embedding": [0.0123, "..."]
    }
  ],
  "built_at": "2026-11-14T12:00:00.000Z"
}
```

**Idempotente**: pode rodar de novo a qualquer momento e substitui o índice anterior por
completo — é assim que o requisito 3 (atualizável sem mudar código) se cumpre: atualiza
`knowledge_base/`, roda o build de novo, pronto.

### `query.ts` — busca

```ts
function search(question: string, topK?: number): Promise<KnowledgeChunk[]>;
```

Carrega `index.json` em memória **uma vez** por processo (não recarrega a cada chamada —
evitaria custo repetido de I/O sem ganho, já que o índice só muda quando alguém roda o build
de novo). Expõe também `reload()`, pra recarregar explicitamente sem reiniciar o processo,
caso o índice tenha sido reconstruído enquanto o processo já estava de pé — sem
monitoramento automático de arquivo (over-engineering pro que a spec pede).

Calcula o embedding da pergunta (`embed()`) e devolve os `topK` chunks mais próximos por
similaridade de cosseno — mesma técnica da spec `0003`, implementação separada porque a
fonte de dados (chunks estáticos vs. lições que crescem) e o escopo (compartilhado vs. por
conta) são diferentes.

### `scripts/build-knowledge-index.ts`

CLI (`node scripts/build-knowledge-index.ts`) que só chama `index_builder.build()`. Roda
manualmente depois de atualizar `knowledge_base/` (ex.: depois do crawler Python existente
rodar de novo) — não é automático nem agendado (fora do escopo desta spec).

## `knowledge_base/index.json` não é versionado

Entra no `.gitignore` — é artefato derivado e reproduzível a qualquer momento rodando o
build. Versionar inflaria o repo e mudaria por completo a cada vez que o crawler rodasse,
sem nenhum ganho (ninguém revisa um arquivo de embeddings num PR).

## O que NÃO entra aqui

- O crawler Python (`scripts/crawl_spacemolt_docs.py`) — continua como está, fora do runtime
  do agente.
- Decidir quando o Planner/Decider chama `search()` — specs futuras.
- Reconstrução automática/agendada do índice.

## Riscos assumidos

- Build do índice é sequencial (uma chamada de embedding por chunk) — pode levar alguns
  minutos pras ~50 páginas + o manual. Aceitável porque é manual e raro (só depois de
  atualizar a doc), nunca faz parte do ciclo de decisão em tempo real. Paralelizar é
  otimização futura, não requisito agora.

## Alternativas consideradas e descartadas

- **Reconstruir o índice a cada consulta**: desperdício — a documentação não muda a cada
  ciclo de decisão, e seria lento demais (viola o requisito 5, velocidade).
- **Fazer isso dentro do crawler Python**: misturaria a camada de pesquisa (Python, fora do
  runtime do agente) com o runtime de decisão (Node) — mesmo raciocínio da spec `0001` sobre
  não misturar linguagens sem motivo forte.
