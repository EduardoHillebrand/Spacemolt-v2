// Configuração do PM2. Escrita como parte da spec 0005-devlog-channel (task 6), mas NÃO
// validada rodando de verdade — o PM2 não está instalado nesta máquina no momento em que
// isso foi escrito, apesar do log/infra.md dizer que está. Ver log/licoes-aprendidas.md.
//
// Uso: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "devlog-server",
      script: "scripts/run-devlog-server.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      autorestart: true,
      // processo único e compartilhado (constituição regra 4 — exceção deliberada, não
      // guarda estado de jogo de ninguém), nunca um processo por conta.
      instances: 1,
    },
  ],
};
