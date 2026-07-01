import type { CoinMarket, FuturesMetric } from './types.js';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const BINANCE_FAPI = 'https://fapi.binance.com/fapi/v1';

export async function fetchTopCoins(limit: number): Promise<CoinMarket[]> {
  const url = new URL(COINGECKO_URL);
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', String(limit));
  url.searchParams.set('page', '1');
  url.searchParams.set('sparkline', 'false');
  url.searchParams.set('price_change_percentage', '1h,24h,7d');

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as CoinMarket[];
}

export async function fetchBinanceFutures(symbol: string): Promise<FuturesMetric | undefined> {
  const pair = `${symbol.toUpperCase()}USDT`;
  try {
    const [premiumRes, oiRes] = await Promise.all([
      fetch(`${BINANCE_FAPI}/premiumIndex?symbol=${pair}`),
      fetch(`${BINANCE_FAPI}/openInterest?symbol=${pair}`),
    ]);
    if (!premiumRes.ok || !oiRes.ok) return undefined;
    const premium = await premiumRes.json();
    const oi = await oiRes.json();
    const markPrice = Number(premium.markPrice || 0);
    const openInterest = Number(oi.openInterest || 0);
    return {
      symbol: pair,
      fundingRate: Number(premium.lastFundingRate || 0),
      openInterestUsd: markPrice * openInterest,
      source: 'binance',
    };
  } catch {
    return undefined;
  }
}
