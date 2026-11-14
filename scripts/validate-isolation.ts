// Validação manual (tasks.md, item 8): conecta as 3 contas via game_client.connect() e
// confirma que cada uma recebe seu próprio estado inicial, sem se misturar.
import { connect } from "../app/game_client.js";

const accounts = ["hillebot", "ironvex", "medici"];

const sessions = await Promise.all(accounts.map((name) => connect(name)));

for (const session of sessions) {
  const s = session.initialState;
  console.log(
    `${session.accountName.padEnd(10)} -> player.username=${(s.player as any)?.username}` +
      ` credits=${(s.player as any)?.credits} ship=${(s.ship as any)?.class_id}`
  );
}

const usernames = sessions.map((s) => (s.initialState.player as any)?.username);
const allDifferent = new Set(usernames).size === usernames.length;
console.log("\nusernames distintos entre as sessoes:", allDifferent ? "SIM (isolado, OK)" : "NAO (ERRO!)");
process.exit(0);
