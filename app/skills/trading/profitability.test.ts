import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateNetProfit, type KnownRoute } from "./profitability.js";

const ROUTE: KnownRoute = {
  buyPoiId: "station_a",
  sellPoiId: "station_b",
  itemId: "iron_ore",
  lastSeenAskPrice: 10,
  lastSeenBidPrice: 15,
};

test("lucro bruto é (bid destino - ask origem) * quantidade, sem imposto", () => {
  assert.equal(estimateNetProfit(ROUTE, 20, 0), (15 - 10) * 20);
});

test("imposto é cobrado sobre o valor da compra na origem, não sobre a venda", () => {
  // 10% (1000 bps) sobre 10 * 20 = 20 de imposto; lucro bruto 100 - 20 = 80.
  assert.equal(estimateNetProfit(ROUTE, 20, 1000), 100 - 20);
});

test("imposto alto o suficiente pode zerar ou negativar o lucro", () => {
  const net = estimateNetProfit(ROUTE, 20, 9000); // 90% sobre a compra
  assert.ok(net < 0, "imposto de 90% sobre uma compra de 200 deveria exceder o lucro bruto de 100");
});

test("rota sem spread (ask == bid) nunca dá lucro positivo", () => {
  const flatRoute: KnownRoute = { ...ROUTE, lastSeenBidPrice: ROUTE.lastSeenAskPrice };
  assert.equal(estimateNetProfit(flatRoute, 20, 0), 0);
});
