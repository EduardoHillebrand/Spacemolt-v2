# 0004 — Knowledge Base Integration

## O quê

O Planner/Decider consegue consultar a documentação de referência do jogo
(`knowledge_base/distilled/` + `SKILL_MANUAL.md`) de forma relevante ao contexto da decisão
atual, sem precisar carregar todo o conteúdo de uma vez.

## Por quê

- `knowledge_base/` tem ~50 páginas distiladas mais o manual oficial (~1548 linhas) — grande
  demais pra entregar tudo de uma vez pro Decider, que já é um recurso lento e compartilhado
  (constituição, regra 3).
- Decisões corretas dependem de detalhes exatos (fórmulas, nomes de comando, condições) que
  já foram extraídos com cuidado — sem acesso a isso no momento certo, o Decider operaria com
  informação incompleta ou genérica.
- Essa é referência **estática** do jogo (regras que não mudam com o jogar), bem diferente
  da memória de longo prazo (spec `0003`, o que o próprio agente aprendeu jogando) — as duas
  nunca devem se confundir, mesmo que a técnica de busca seja parecida.

## Requisitos funcionais

1. Dada uma pergunta/situação em texto livre, o sistema devolve os **trechos mais
   relevantes** da documentação — nunca a página inteira, nunca "não encontrado" quando a
   informação existe só com outras palavras.
2. **Busca por relevância semântica**, não por palavra exata — a forma de perguntar
   ("quanto custa viajar") pode não usar as palavras exatas do texto original ("fuel cost of
   travel").
3. **Atualizável sem mudar código**: se `knowledge_base/` for re-raspada (o jogo muda com
   frequência — lição já registrada em `log/licoes-aprendidas.md`), a próxima consulta já
   reflete o conteúdo novo, sem precisar editar nenhuma lógica de busca.
4. **Somente leitura e nunca aprende por conta própria** a partir do que o agente joga —
   qualquer atualização vem só de rodar o crawler de novo ou de edição manual dos arquivos.
   Nunca se mistura com a memória de longo prazo (spec `0003`).
5. **Rápido o suficiente** pra não travar o ciclo de decisão — não pode ser um gargalo pior
   que o próprio Decider.
6. **Compartilhado entre todas as contas** — é a mesma documentação do jogo pra todo mundo,
   ao contrário da memória de longo prazo (que é isolada por conta).

## Fora do escopo desta spec

- O crawler em si (`scripts/crawl_spacemolt_docs.py`) já existe e continua como está — esta
  spec só cobre o mecanismo de consulta ao resultado dele.
- Decidir quando o Planner/Decider deve consultar isso — specs futuras do Planner/Decider.
- Re-raspagem automática/agendada da documentação — pode vir depois, não é requisito agora.
- Memória de longo prazo (lições aprendidas jogando) — spec `0003`, armazenamento e
  mecanismo diferentes.

## Critério de sucesso

- Perguntar algo como "quanto custa viajar X saltos com Y combustível" devolve o trecho de
  `SKILL_MANUAL.md` ou `knowledge_base/distilled/docs_guides_fuel.md` com a fórmula — não a
  página inteira, não um "não encontrado".
- Re-rodar o crawler e a próxima consulta já reflete o conteúdo novo, sem mudar código.
- A consulta responde rápido — não perceptivelmente mais lenta que o resto do ciclo de
  decisão.
