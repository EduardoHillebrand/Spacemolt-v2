// Cálculo de lucro de uma rota de arbitragem (spec 0008). `ask` é sempre o que se paga na
// origem, `bid` é sempre o que se recebe no destino — nunca invertidos (erro clássico
// documentado em docs_guides_arbitrage.md).
export interface KnownRoute {
  buyPoiId: string;
  sellPoiId: string;
  itemId: string;
  lastSeenAskPrice: number;
  lastSeenBidPrice: number;
}

export function estimateNetProfit(route: KnownRoute, quantity: number, saleTaxRateBps: number): number {
  const grossProfit = (route.lastSeenBidPrice - route.lastSeenAskPrice) * quantity;
  // Imposto de venda é cobrado na compra, pela taxa do império da estação de origem
  // (docs_economy.md) — não na venda.
  const tax = route.lastSeenAskPrice * quantity * (saleTaxRateBps / 10_000);
  return grossProfit - tax;
}
