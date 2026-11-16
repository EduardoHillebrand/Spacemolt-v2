// Tipos internos da skill de mineração (spec 0007) — nunca importados por outra skill
// (constituição, regra 5: cada skill é módulo isolado).

export type MiningActivity =
  | { kind: "mine" }
  | { kind: "travelToPoi"; poiId: string }
  // Uma parada completa: vende o que houver de carga, repara/confirma seguro (spec 0010),
  // e undoca — tudo numa só atividade (nunca um "sell" separado de um "maintain" separado)
  // pra nunca ficar num estado intermediário "docked, já vendeu, esqueceu de sair" que o
  // planner reconsideraria do zero no próximo ciclo (spec 0007, requisito 5).
  | { kind: "stationStop" }
  | { kind: "wait"; reason: string }
  | { kind: "fail"; code: string; message: string };
