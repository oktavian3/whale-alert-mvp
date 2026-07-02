import { config } from './config.js';
import { fetchBinanceFutures, fetchTopCoins } from './marketData.js';
import { fetchBinanceMarketStructure } from './marketStructure.js';
import { loadLatestSignals, persistSignals } from './persistence.js';
import { scoreCoin } from './scoring.js';
import type { DataSourceHealth, Signal } from './types.js';

let signals: Signal[] = [];
let lastError = '';
let lastRefresh = '';
let bootstrapped = false;
let sources: DataSourceHealth[] = [
  { name: 'CoinGecko Market', status: 'MISSING', note: 'Top coin market feed' },
  { name: 'Binance Futures', status: 'MISSING', note: 'Funding and open interest' },
  { name: 'Binance Spot Structure', status: 'MISSING', note: 'CVD and order book depth from free REST endpoints' },
  { name: 'On-chain TxHash', status: 'MISSING', note: 'Not enabled yet; no whale tx claims without tx hash' },
];

export function getSignals(): Signal[] { return signals; }
export function getSignal(symbol: string): Signal | undefined {
  return signals.find((s) => s.coin.symbol.toLowerCase() === symbol.toLowerCase() || s.coin.id.toLowerCase() === symbol.toLowerCase());
}
export function getStatus() { return { count: signals.length, lastError, lastRefresh, sources }; }

export async function bootstrapSignals() {
  if (bootstrapped) return;
  signals = await loadLatestSignals();
  bootstrapped = true;
}

export async function refreshSignals(): Promise<Signal[]> {
  try {
    const coins = await fetchTopCoins(config.topN);
    updateSource('CoinGecko Market', 'LIVE');
    const futures = await Promise.all(coins.map((coin) => fetchBinanceFutures(coin.symbol)));
    updateSource('Binance Futures', futures.some(Boolean) ? 'LIVE' : 'MISSING', futures.some(Boolean) ? undefined : 'No futures pairs returned');
    const structureLimit = Math.min(coins.length, 30);
    const marketStructure = await Promise.all(coins.slice(0, structureLimit).map((coin) => fetchBinanceMarketStructure(coin.symbol)));
    updateSource('Binance Spot Structure', marketStructure.some(Boolean) ? 'LIVE' : 'MISSING', marketStructure.some(Boolean) ? undefined : 'No spot structure data returned');
    signals = coins
      .map((coin, index) => scoreCoin(coin, futures[index], index < structureLimit ? marketStructure[index] : undefined))
      .sort((a, b) => b.score - a.score);
    await persistSignals(signals);
    lastRefresh = new Date().toISOString();
    lastError = '';
    return signals;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

export function startRefreshLoop() {
  bootstrapSignals().then(() => refreshSignals()).catch((error) => console.error('[refresh]', error));
  setInterval(() => refreshSignals().catch((error) => console.error('[refresh]', error)), config.refreshSeconds * 1000);
}

function updateSource(name: string, status: DataSourceHealth['status'], error?: string) {
  const now = new Date().toISOString();
  sources = sources.map((source) => source.name === name
    ? { ...source, status, lastOk: status === 'LIVE' ? now : source.lastOk, lastError: error }
    : source);
}
