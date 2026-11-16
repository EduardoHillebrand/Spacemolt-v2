// Observações de mercado por estação, guardadas na memória de longo prazo (spec 0003,
// constituição regra 11) — não uma rota já pronta, porque nenhuma chamada do jogo entrega
// as duas pontas de uma rota de uma vez (docs_guides_arbitrage.md: "esse mapa é seu pra
// construir"). Combinando observações de estações diferentes pro mesmo item é que se forma
// uma `KnownRoute` candidata.
import type { SkillContext } from "../../loop/skill_interface.js";
import type { KnownRoute } from "./profitability.js";

export interface PriceObservation {
  poiId: string;
  itemId: string;
  /** O que custa comprar ali. */
  askPrice: number;
  /** O que se recebe vendendo ali. */
  bidPrice: number;
}

export async function rememberObservation(ctx: SkillContext, obs: PriceObservation): Promise<void> {
  // `text` fica em prose (pro embedding semântico); `context` guarda o dado estruturado
  // como JSON — `long_term_memory.ts` (spec 0003) já aceita qualquer string em `context`,
  // sem precisar de nenhuma mudança lá.
  await ctx.memory.remember(
    `Observação de mercado: ${obs.itemId} em ${obs.poiId} — compra (ask) ~${obs.askPrice}, venda (bid) ~${obs.bidPrice}.`,
    JSON.stringify(obs)
  );
}

export async function recallObservations(ctx: SkillContext, topK = 20): Promise<PriceObservation[]> {
  const entries = await ctx.memory.recall("observação de preço de mercado comprar vender estação item", topK);
  return entries.map((entry) => parseObservation(entry.context)).filter((obs): obs is PriceObservation => obs !== null);
}

function parseObservation(context: string | undefined): PriceObservation | null {
  if (!context) return null;
  try {
    const parsed = JSON.parse(context) as Partial<PriceObservation>;
    if (
      typeof parsed.poiId === "string" &&
      typeof parsed.itemId === "string" &&
      typeof parsed.askPrice === "number" &&
      typeof parsed.bidPrice === "number"
    ) {
      return parsed as PriceObservation;
    }
    return null;
  } catch {
    return null; // entrada de memória de outra skill/contexto, não uma observação de mercado — ignora, nunca lança
  }
}

/**
 * Entre todas as observações conhecidas, acha o melhor par (comprar barato numa estação,
 * vender caro noutra, mesmo item, estações diferentes) e devolve como rota candidata.
 * `null` se não houver par lucrativo nenhum ainda.
 */
export function bestRouteFromObservations(observations: PriceObservation[]): KnownRoute | null {
  const byItem = new Map<string, PriceObservation[]>();
  for (const obs of observations) {
    const list = byItem.get(obs.itemId) ?? [];
    list.push(obs);
    byItem.set(obs.itemId, list);
  }

  let best: KnownRoute | null = null;
  let bestSpread = 0;

  for (const [itemId, obsForItem] of byItem) {
    for (const buyObs of obsForItem) {
      for (const sellObs of obsForItem) {
        if (buyObs.poiId === sellObs.poiId) continue;
        const spread = sellObs.bidPrice - buyObs.askPrice;
        if (spread > bestSpread) {
          bestSpread = spread;
          best = {
            buyPoiId: buyObs.poiId,
            sellPoiId: sellObs.poiId,
            itemId,
            lastSeenAskPrice: buyObs.askPrice,
            lastSeenBidPrice: sellObs.bidPrice,
          };
        }
      }
    }
  }

  return best;
}
