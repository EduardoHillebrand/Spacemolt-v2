// Tipos internos da skill de trading (spec 0008) — nunca importados por outra skill
// (constituição, regra 5).
export type TradingActivity =
  | { kind: "stationStop" }
  | { kind: "travelToPoi"; poiId: string }
  | { kind: "wait"; reason: string }
  | { kind: "fail"; code: string; message: string };
