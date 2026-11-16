// Planner da skill de mineração (spec 0007): função que só olha o estado e devolve UMA
// atividade por ciclo (constituição, regra 2) — nunca executa nada, nunca chama a LLM
// (0007 não precisa do Decider: a escolha é sempre mecânica, cargo cheio ou não, node
// trabalhável ou não).
import type { Plan } from "../../loop/skill_interface.js";
import type { SkillContext } from "../../loop/skill_interface.js";
import type { MiningActivity } from "./activity.js";
import { findMinablePoi, findNearestStationPoi, hasWorkableNode, isCargoFull, readPoi, readShip } from "./state.js";

export async function planMining(ctx: SkillContext): Promise<Plan> {
  const ship = await readShip(ctx);
  if (ship === null) {
    return planFor({ kind: "fail", code: "get_ship_failed", message: "não foi possível ler o estado da nave" });
  }

  // Docada é sempre tratada primeiro, cargo cheio ou não: cobre tanto a volta por cargo
  // cheio quanto o início do processo (a nave começa docada) — `stationStop` undoca no
  // fim, então o próximo ciclo nunca vê `docked: true` de novo sem ter passado por lá.
  if (ship.docked) {
    return planFor({ kind: "stationStop" });
  }

  if (isCargoFull(ship)) {
    const stationPoiId = await findNearestStationPoi(ctx);
    if (stationPoiId === null) {
      return planFor({ kind: "wait", reason: "no_station_found" });
    }
    return planFor({ kind: "travelToPoi", poiId: stationPoiId });
  }

  const poi = await readPoi(ctx);
  if (poi !== null && hasWorkableNode(poi)) {
    return planFor({ kind: "mine" });
  }

  const nextPoiId = await findMinablePoi(ctx);
  if (nextPoiId === null) {
    return planFor({ kind: "wait", reason: "no_minable_poi_found" });
  }
  return planFor({ kind: "travelToPoi", poiId: nextPoiId });
}

function planFor(activity: MiningActivity): Plan {
  return { steps: [activity], invalidate_when: [] };
}
