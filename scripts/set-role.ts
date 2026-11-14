// Única peça do sistema com permissão de escrita em roles.json (spec 0002). Roda fora do
// processo do agente, sempre por ação manual explícita.
//
// Uso: node scripts/set-role.ts <conta> <papel> [--intended <papel>]
import { readFileSync, writeFileSync } from "node:fs";
import { CATALOG, isValidRole } from "../app/roles/catalog.js";

function main(): void {
  const [accountName, role, ...rest] = process.argv.slice(2);

  if (!accountName || !role) {
    console.error("Uso: node scripts/set-role.ts <conta> <papel> [--intended <papel>]");
    process.exitCode = 1;
    return;
  }

  if (!isValidRole(role)) {
    console.error(`Papel desconhecido "${role}". Papéis válidos: ${Object.keys(CATALOG).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  let intended: string | null = null;
  const intendedIdx = rest.indexOf("--intended");
  if (intendedIdx !== -1) {
    intended = rest[intendedIdx + 1] ?? "";
    if (!isValidRole(intended)) {
      console.error(`Papel pretendido desconhecido "${intended}". Papéis válidos: ${Object.keys(CATALOG).join(", ")}`);
      process.exitCode = 1;
      return;
    }
  }

  const rolesPath = "roles.json";
  const roles = JSON.parse(readFileSync(rolesPath, "utf-8")) as Record<string, unknown>;
  roles[accountName] = { current: role, intended };
  writeFileSync(rolesPath, `${JSON.stringify(roles, null, 2)}\n`);
  console.log(`${accountName}: current=${role} intended=${intended ?? "null"}`);
}

main();
