// Planner da skill de trading (spec 0008): só olha o estado e devolve UMA atividade por
// ciclo (constituição, regra 2) — a decisão de qual rota perseguir é mecânica (comparar
// spreads conhecidos), então não precisa do Decider.
import { findNearestStationPoi } from "../../core/system_state.js";
import { readShip } from "../../core/ship_state.js";
import type { Plan, SkillContext } from "../../loop/skill_interface.js";
import type { TradingActivity } from "./activity.js";

export async function planTrading(ctx: SkillContext): Promise<Plan> {
  const ship = await readShip(ctx);
  if (ship === null) {
    return planFor({ kind: "fail", code: "get_ship_failed", message: "não foi possível ler o estado da nave" });
  }

  // Docada é sempre a atividade certa: vende o que estiver a bordo, repara/confere seguro,
  // observa o mercado local, e decide a próxima rota — tudo numa parada só (spec 0008,
  // requisito 7; mesmo padrão de "stationStop" atômico da skill de mineração, 0007).
  if (ship.docked) {
    return planFor({ kind: "stationStop" });
  }

  // Não docada fora de uma rota em andamento só acontece após uma interrupção do processo
  // (uma rota completa já é executada atomicamente dentro de `stationStop`, ver
  // executor.ts) — volta pra estação mais próxima pra recomeçar o ciclo normal.
  const stationPoiId = await findNearestStationPoi(ctx);
  if (stationPoiId === null) {
    return planFor({ kind: "wait", reason: "no_station_found" });
  }
  return planFor({ kind: "travelToPoi", poiId: stationPoiId });
}

function planFor(activity: TradingActivity): Plan {
  return { steps: [activity], invalidate_when: [] };
}
