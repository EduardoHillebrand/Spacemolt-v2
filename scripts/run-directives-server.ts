// Entrypoint standalone pro servidor de diretriz do operador (spec 0012). Mesmo padrão de
// scripts/run-devlog-server.ts — server.ts só exporta a função, este script fica de pé.
// Credenciais de auth vêm de variáveis de ambiente (.env, já gitignored) -- rodar com
// `node --env-file=.env --import tsx scripts/run-directives-server.ts` (Node >=20).
import { DIRECTIVES_PORT, startDirectivesServer } from "../app/directives/server.js";

if (!process.env.DIRECTIVES_USER || !process.env.DIRECTIVES_PASS) {
  console.warn(
    "DIRECTIVES_USER/DIRECTIVES_PASS não definidas -- leitura/escrita autenticada da " +
      "diretriz vai recusar todo pedido até isso existir (.env, nunca versionado)."
  );
}

startDirectivesServer();
console.log(`directives server rodando na porta ${DIRECTIVES_PORT}`);
