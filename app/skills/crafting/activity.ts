// Tipos internos da skill de crafting (spec 0011) — nunca importados por outra skill
// (constituição, regra 5).
export type CraftingActivity =
  | { kind: "waitForJob" }
  | { kind: "enqueue"; recipeId: string }
  | { kind: "wait"; reason: string }
  | { kind: "fail"; code: string; message: string };
