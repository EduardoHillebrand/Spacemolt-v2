# 0006 — Agent Loop — Tasks

Cada item é um passo pequeno e checável. Commit direto na `main` ao fechar cada um
(constituição, regra 7).

> **Dependência**: esta feature integra `0001` (conexão), `0002` (papéis), `0003`
> (memória), `0004` (base de conhecimento) e `0005` (devlog). Se alguma ainda não estiver
> implementada quando chegar a vez desta, implementar o mínimo necessário dela aqui mesmo,
> sem duplicar o que já está especificado nessas specs.

1. [ ] **`app/loop/skill_interface.ts`**: tipos `Plan`, `ExecutorResult`, `Skill`,
   `SkillContext` do `plan.md`.

2. [ ] **`app/core/decider.ts`**: `ask(question)` via Ollama local. Erro claro
   (constituição, regra 6) se o Ollama estiver indisponível.

3. [ ] **`app/loop/skill_registry.ts`**: `resolve(skillNames)` — mapa fixo (vazio no
   início), lida com lista de skills vazia sem lançar erro.

4. [ ] **`app/loop/run_account_loop.ts`**: o loop completo — `chooseSkill` trivial,
   `buildContext`, tratamento de `running`/`done`/`invalidated`/`error` com backoff em erro
   repetido.

5. [ ] **`app/main.ts`**: entrypoint do processo, lê o nome da conta (argv ou
   `ACCOUNT_NAME`), chama `runAccountLoop`.

6. [ ] **Teste automatizado** com uma skill fake (planner/executor controláveis pelo teste):
   confirma que nunca há 2 planos simultâneos; `invalidated` volta pro planner; `error`
   incrementa o backoff e não derruba o loop; `done` escolhe skill de novo.

7. [ ] **Validação manual — papel sem skill implementada**: configurar `roles.json` com um
   papel cujas skills estejam vazias no catálogo (ex.: `artisan` hoje) e confirmar que o
   loop emite aviso via devlog e não crasha, só espera.

8. [ ] **Validação manual — ciclo completo com skill fake de teste** (já que `0007+` ainda
   não existem): ligar o processo de uma conta com uma skill fake registrada, ver via devlog
   o loop escolhendo ela e mantendo plano ativo continuamente. → critério de sucesso 1 da
   `spec.md` (adaptado — repetir com skill real quando `0007-skill-mining` existir).

9. [ ] **Validação manual — replanejamento**: forçar, na skill fake, uma condição de
   invalidação no meio de um plano, confirmar que o loop volta pro planner e continua.
   → critério de sucesso 2.

10. [ ] **Validação manual — erro não derruba**: fazer a skill fake devolver `error`
    deliberadamente, confirmar que o processo da conta continua rodando e o erro aparece no
    devlog. → critério de sucesso 3.

## Nota sobre granularidade

Itens 7–10 são validação manual, não teste de CI — checklist feito uma vez antes de
considerar a feature pronta. Itens 8–10 usam uma skill fake porque nenhuma skill real
(`0007+`) está especificada ainda — vale repetir a validação com uma skill de verdade depois.
