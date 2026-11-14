// Único módulo que lê roles.json (spec 0002, requisito 3 — troca de papel é sempre uma
// ação deliberada: nenhum outro arquivo tem permissão de escrita nesse arquivo; só
// scripts/set-role.ts escreve).
import { readFileSync } from "node:fs";
import { CATALOG, isValidRole, type Role, type RoleDefinition } from "./catalog.js";

export interface RoleEntry {
  current: Role;
  intended: Role | null;
}

const DEFAULT_ROLES_PATH = "roles.json";

export function getRole(accountName: string, rolesPath: string = DEFAULT_ROLES_PATH): RoleEntry {
  const roles = readRolesFile(rolesPath);
  const entry = roles[accountName];
  if (!entry) {
    throw new Error(`Unknown account "${accountName}": not found in ${rolesPath}`);
  }
  if (!isValidRole(entry.current)) {
    throw new Error(`Account "${accountName}" has invalid current role "${entry.current}" in ${rolesPath}`);
  }
  if (entry.intended !== null && !isValidRole(entry.intended)) {
    throw new Error(`Account "${accountName}" has invalid intended role "${entry.intended}" in ${rolesPath}`);
  }
  return entry;
}

export function getRoleDefinition(role: Role): RoleDefinition {
  const def = CATALOG[role];
  if (!def) {
    throw new Error(`Unknown role "${role}": not found in CATALOG`);
  }
  return def;
}

function readRolesFile(rolesPath: string): Record<string, RoleEntry> {
  const raw = readFileSync(rolesPath, "utf-8");
  return JSON.parse(raw) as Record<string, RoleEntry>;
}
