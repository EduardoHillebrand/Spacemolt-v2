// Estado operacional (constituição, regra 11): efêmero e reconstruível. NADA aqui é
// persistido em disco como fonte de verdade — se corromper ou ficar desatualizado, só
// reconectar (spec 0001) e chamar de novo.
import type { GameSession, GameState } from "../game_client.types.js";

export function snapshot(session: GameSession): Readonly<GameState> {
  return session.getState();
}
