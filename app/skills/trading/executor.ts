// Executor da skill de trading (spec 0008): só executa, mecanicamente, o que o planner
// decidiu (constituição, regra 2). `stationStop` concentra toda a sequência de uma parada
// (vender, manter, observar mercado, decidir e executar a próxima rota) numa função
// atômica — mesmo padrão já usado em `0007-skill-mining` (ver log/licoes-aprendidas.md: um
// `Plan` carrega uma atividade por ciclo, nunca uma lista de passos que o loop não sabe
// percorrer).
import { sellAllCargo } from "../../core/cargo.js";
import { checkAndRepair, checkInsurance } from "../../core/maintenance.js";
import { goTo } from "../../core/navigation.js";
import type { CommandResult, NavigationResult } from "../../game_client.types.js";
import type { ExecutorResult, Plan, SkillContext } from "../../loop/skill_interface.js";
import type { TradingActivity } from "./activity.js";
import { bestRouteFromObservations, rememberObservation, recallObservations, type PriceObservation } from "./market_memory.js";
import { estimateNetProfit, type KnownRoute } from "./profitability.js";

// Tamanho de lote fixo pro primeiro ciclo (spec 0008, "lista inicial... pode ser pequena",
// mesma postura deliberada de escopo reduzido do `plan.md`) — ajustável sem precisar de
// spec nova; não tenta calcular o ótimo baseado em cargo/crédito disponível ainda.
const DEFAULT_TRADE_QUANTITY = 20;
// Qualquer lucro líquido positivo já vale perseguir no escopo inicial.
const MIN_NET_PROFIT_THRESHOLD = 1;

export async function executeTradingStep(plan: Plan, ctx: SkillContext): Promise<ExecutorResult> {
  const activity = plan.steps[0] as TradingActivity;

  switch (activity.kind) {
    case "stationStop":
      return runStationStop(ctx);
    case "travelToPoi":
      return toExecutorResult(await goTo({ kind: "poi", poiId: activity.poiId }, ctx));
    case "wait":
      return { status: "done" }; // estado válido (constituição, regra 6) — reavalia do zero no próximo ciclo
    case "fail":
      return { status: "error", code: activity.code, message: activity.message };
  }
}

async function runStationStop(ctx: SkillContext): Promise<ExecutorResult> {
  const sellResult = await sellAllCargo(ctx);
  if (!sellResult.ok) return { status: "error", code: sellResult.code, message: sellResult.message };

  await checkAndRepair(ctx);
  await checkInsurance(ctx); // autobuy desligado por padrão (0010)

  const freshObservations = await observeLocalMarket(ctx);
  const route = await pickProfitableRoute(ctx, freshObservations);

  if (route === null) {
    // Scouting feito, nenhuma rota lucrativa agora — undoca e deixa o próximo ciclo
    // reavaliar (a observação de hoje já ficou na memória pra comparações futuras).
    const undockResult = await ctx.session.call("spacemolt", "undock", {});
    if (!undockResult.ok) return { status: "error", code: undockResult.code, message: undockResult.message };
    return { status: "done" };
  }

  return executeRoute(route, ctx);
}

async function observeLocalMarket(ctx: SkillContext): Promise<PriceObservation[]> {
  const poiId = await currentPoiId(ctx);
  if (poiId === null) return [];

  const marketResult = await ctx.session.call("spacemolt_market", "view_market", {});
  if (!marketResult.ok || marketResult.kind !== "query") return [];

  // Nome exato do campo não confirmado — melhor esforço a partir de "resumo de melhor
  // preço por item" (pesquisa da spec 0008); validação manual confirma de verdade.
  const summary = marketResult.result as { items?: Array<{ item_id: string; best_ask?: number; best_bid?: number }> };
  const observations: PriceObservation[] = [];

  for (const item of summary.items ?? []) {
    if (item.best_ask === undefined || item.best_bid === undefined) continue;
    const obs: PriceObservation = { poiId, itemId: item.item_id, askPrice: item.best_ask, bidPrice: item.best_bid };
    observations.push(obs);
    await rememberObservation(ctx, obs);
  }
  return observations;
}

async function currentPoiId(ctx: SkillContext): Promise<string | null> {
  const result = await ctx.session.call("spacemolt", "get_poi", {});
  if (!result.ok || result.kind !== "query") return null;
  const poi = result.result as { id?: string };
  return poi.id ?? null;
}

async function pickProfitableRoute(ctx: SkillContext, freshObservations: PriceObservation[]): Promise<KnownRoute | null> {
  const historical = await recallObservations(ctx);
  const route = bestRouteFromObservations([...historical, ...freshObservations]);
  if (route === null) return null;

  const saleTaxRateBps = await readSaleTaxRateBps(ctx);
  const netProfit = estimateNetProfit(route, DEFAULT_TRADE_QUANTITY, saleTaxRateBps);
  return netProfit > MIN_NET_PROFIT_THRESHOLD ? route : null;
}

async function readSaleTaxRateBps(ctx: SkillContext): Promise<number> {
  const result = await ctx.session.call("spacemolt", "get_empire_info", {});
  if (!result.ok || result.kind !== "query") return 0;
  // Nome exato do campo não confirmado (specs/0008-skill-trading/tasks.md) — tenta as
  // variantes mais prováveis, nunca lança; 0 (sem imposto) é o fallback mais conservador
  // pra não subestimar lucro por erro de leitura.
  const info = result.result as { rate_bps?: number; sale_tax_rate_bps?: number };
  return info.rate_bps ?? info.sale_tax_rate_bps ?? 0;
}

async function executeRoute(route: KnownRoute, ctx: SkillContext): Promise<ExecutorResult> {
  const toBuyStation = await goTo({ kind: "poi", poiId: route.buyPoiId }, ctx);
  if (toBuyStation.status !== "arrived") return invalidatedFromNav(toBuyStation);

  const estimate = await ctx.session.call("spacemolt_market", "estimate_purchase", {
    item_id: route.itemId,
    quantity: DEFAULT_TRADE_QUANTITY,
  });
  if (!estimate.ok) return invalidatedFromGameError(estimate);

  const buyResult = await ctx.session.call("spacemolt", "buy", {
    id: route.itemId,
    quantity: DEFAULT_TRADE_QUANTITY,
    deliver_to: "storage",
  });
  if (!buyResult.ok) return invalidatedFromGameError(buyResult);

  const toSellStation = await goTo({ kind: "poi", poiId: route.sellPoiId }, ctx);
  if (toSellStation.status !== "arrived") return invalidatedFromNav(toSellStation);

  const sellResult = await ctx.session.call("spacemolt", "sell", { id: route.itemId, quantity: DEFAULT_TRADE_QUANTITY });
  if (!sellResult.ok) return { status: "error", code: sellResult.code, message: sellResult.message };

  // Só grava como observação confirmada depois de vender com sucesso de verdade — um
  // `estimate`/`buy` que deu certo não garante que o `bid` do destino ainda vale o mesmo
  // na hora de vender (spec 0008, requisito 6: preço memorizado nunca é garantido).
  await rememberObservation(ctx, { poiId: route.sellPoiId, itemId: route.itemId, askPrice: route.lastSeenAskPrice, bidPrice: route.lastSeenBidPrice });

  return { status: "done" };
}

function invalidatedFromNav(nav: Extract<NavigationResult, { status: "blocked" }>): ExecutorResult {
  return { status: "invalidated", reason: `${nav.code}: ${nav.message}` };
}

function invalidatedFromGameError(result: Extract<CommandResult, { ok: false }>): ExecutorResult {
  return { status: "invalidated", reason: `${result.code}: ${result.message}` };
}

function toExecutorResult(nav: NavigationResult): ExecutorResult {
  if (nav.status === "arrived") return { status: "done" };
  return invalidatedFromNav(nav);
}
