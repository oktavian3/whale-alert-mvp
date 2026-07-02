import type { MarketStructureMetric } from './types.js';

const BINANCE_API = 'https://api.binance.com/api/v3';
const BINANCE_FAPI = 'https://fapi.binance.com/fapi/v1';

export async function fetchBinanceMarketStructure(symbol: string): Promise<MarketStructureMetric | undefined> {
  const pair = `${symbol.toUpperCase()}USDT`;
  const since = Date.now() - 15 * 60 * 1000;

  try {
    const [depthRes, tradesRes, liqRes] = await Promise.all([
      timedFetch(`${BINANCE_API}/depth?symbol=${pair}&limit=100`),
      timedFetch(`${BINANCE_API}/aggTrades?symbol=${pair}&startTime=${since}&limit=1000`),
      timedFetch(`${BINANCE_FAPI}/forceOrders?symbol=${pair}&limit=50`).catch(() => undefined),
    ]);

    if (!depthRes.ok || !tradesRes.ok) return undefined;

    const depth = await depthRes.json() as { bids: [string, string][]; asks: [string, string][] };
    const trades = await tradesRes.json() as { p:string; q:string; m:boolean; T:number }[];
    const liquidations = liqRes && liqRes.ok ? await liqRes.json() as { price:string; origQty:string; side:string; time:number }[] : [];

    const mid = getMid(depth);
    if (!mid) return undefined;

    const bidUsd1Pct = sumDepth(depth.bids, mid, 'bid', 0.01);
    const askUsd1Pct = sumDepth(depth.asks, mid, 'ask', 0.01);
    const bidUsd2Pct = sumDepth(depth.bids, mid, 'bid', 0.02);
    const askUsd2Pct = sumDepth(depth.asks, mid, 'ask', 0.02);
    const buyUsd15m = trades.filter(t => !t.m).reduce((sum, t) => sum + Number(t.p) * Number(t.q), 0);
    const sellUsd15m = trades.filter(t => t.m).reduce((sum, t) => sum + Number(t.p) * Number(t.q), 0);
    const liquidationUsd15m = liquidations
      .filter((item) => Number(item.time || 0) >= since)
      .reduce((sum, item) => sum + Number(item.price) * Number(item.origQty), 0);

    return {
      symbol: pair,
      source: 'binance-free-rest',
      updatedAt: new Date().toISOString(),
      cvdUsd15m: buyUsd15m - sellUsd15m,
      buyUsd15m,
      sellUsd15m,
      bidUsd1Pct,
      askUsd1Pct,
      bidUsd2Pct,
      askUsd2Pct,
      depthImbalance1Pct: ratio(bidUsd1Pct, askUsd1Pct),
      liquidationUsd15m,
    };
  } catch {
    return undefined;
  }
}

async function timedFetch(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function getMid(depth: { bids: [string, string][]; asks: [string, string][] }) {
  const bestBid = Number(depth.bids?.[0]?.[0] ?? 0);
  const bestAsk = Number(depth.asks?.[0]?.[0] ?? 0);
  return bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0;
}

function sumDepth(levels: [string, string][], mid: number, side: 'bid' | 'ask', band: number) {
  const min = side === 'bid' ? mid * (1 - band) : mid;
  const max = side === 'ask' ? mid * (1 + band) : mid;
  return levels.reduce((sum, [priceRaw, qtyRaw]) => {
    const price = Number(priceRaw);
    if (side === 'bid' && price < min) return sum;
    if (side === 'ask' && price > max) return sum;
    return sum + price * Number(qtyRaw);
  }, 0);
}

function ratio(bid: number, ask: number) {
  if (!bid && !ask) return 0;
  return bid / Math.max(ask, 1);
}
