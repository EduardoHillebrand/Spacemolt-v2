# 0003 — Memory

## O quê

Para cada conta, o sistema mantém duas camadas de memória, que nunca se confundem nem são
tratadas pelo mesmo mecanismo: **estado operacional** (reconstruível a qualquer momento
consultando o jogo) e **memória de longo prazo** (fatos acumulados que valem a pena lembrar
entre sessões, nunca descartados automaticamente).

## Por quê

- Sem separar as duas, qualquer coisa que grave estado acaba misturando "o que é verdade
  agora" com "o que vale lembrar pra sempre" — e no dia em que o cache corromper ou ficar
  desatualizado, não dá pra saber se é seguro descartar sem perder uma lição valiosa.
- Quem for decidir (Planner, specs futuras) precisa das duas: o estado pra saber "onde estou
  agora", a memória de longo prazo pra saber "o que eu já aprendi sobre esse lugar/situação".
- Sem memória de longo prazo persistente, cada reinício do processo (troca de papel, spec
  `0002`, ou um crash qualquer) faria o agente "esquecer" tudo que valeria a pena lembrar, e
  repetir os mesmos erros indefinidamente.

## Requisitos funcionais

1. **Estado operacional é sempre recuperável** a partir do próprio jogo (via `GameSession`,
   spec `0001`) — não existe nele "fonte de verdade" que não possa ser reconstruída; se
   corromper ou ficar desatualizado, descartar e buscar de novo é sempre seguro.
2. **Memória de longo prazo é cumulativa**: uma vez registrada uma entrada, ela persiste
   entre reinícios do processo e **nunca é apagada automaticamente** — só por curadoria
   explícita (ação deliberada, não um processo de limpeza automático).
3. **Registro de nova lição**: deve ser possível associar um texto livre (o que foi
   aprendido) a metadados mínimos (quando, e opcionalmente onde/contexto). Quem decide
   registrar (Planner, humano, etc.) é escopo de outra spec — aqui só garantimos que o
   mecanismo de registro existe e funciona.
4. **Consulta por relevância, não por palavra exata**: deve ser possível perguntar "o que eu
   sei sobre essa situação/lugar" e receber as entradas relevantes, mesmo que o texto da
   pergunta não seja idêntico ao texto usado quando a lição foi registrada.
5. **Isolamento por conta**: cada conta tem sua própria memória de longo prazo, nunca
   misturada com a de outra (consistente com processo por conta, constituição regra 4) — a
   menos que uma spec futura decida explicitamente compartilhar algo (não é o caso aqui).
6. **Captain's Log nativo do jogo como rede de segurança**: lido no início de uma sessão e
   tratado como mais uma fonte de contexto — não substitui a memória de longo prazo, mas dá
   algum contexto numa conta que ainda não tem nenhuma entrada registrada aqui (ex.: primeira
   vez rodando o agente numa conta que já existia no jogo).
7. **Perda de memória de longo prazo é grave**, não "normal": ao contrário do estado
   operacional (que pode ser descartado e reconstruído sem perda real), perder o
   armazenamento de memória de longo prazo é perda de histórico real — o sistema não deve
   tratar os dois tipos de perda da mesma forma.

## Fora do escopo desta spec

- Quem decide o que vale a pena lembrar e quando consultar — isso é Planner/Decider, specs
  futuras.
- O mecanismo exato de busca por relevância (embeddings, índice, etc.) — isso é `plan.md`.
- Persistência do estado operacional em si além do que a spec `0001` já define (o cache vem
  do `GameSession`) — aqui só formalizamos a regra de que ele é descartável.
- Memória compartilhada entre contas, ligada à cadeia econômica — spec `0011`.

## Critério de sucesso

- Matar o processo de uma conta e religar: a memória de longo prazo dela está intacta,
  mesmas lições de antes.
- Registrar uma lição nova e, numa consulta sobre o mesmo contexto (com palavras diferentes
  das usadas no registro), ela aparece.
- Apagar o cache de estado operacional e reconstruí-lo do jogo não perde nenhuma lição de
  longo prazo — são armazenamentos e mecanismos diferentes.
- Numa conta que já tem Captain's Log no jogo mas nenhuma entrada de memória de longo prazo
  registrada ainda, o sistema começa com algum contexto (via Captain's Log) em vez de partir
  de zero absoluto.
