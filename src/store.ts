import { config } from './config.js';
import { fetchBinanceFutures, fetchTopCoins } from './marketData.js';
import { loadLatestSignals, persistSignals } from './persistence.js';
import { scoreCoin } from './scoring.js';
import type { Signal } from './types.js';

let signals: Signal[] = [];
let lastError = '';
let lastRefresh = '';
let bootstrapped = false;

export function getSignals(): Signal[] { return signals; }
export function getSignal(symbol: string): Signal | undefined {
  return signals.find((s) => s.coin.symbol.toLowerCase() === symbol.toLowerCase() || s.coin.id.toLowerCase() === symbol.toLowerCase());
}
export function getStatus() { return { count: signals.length, lastError, lastRefresh }; }

export async function bootstrapSignals() {
  if (bootstrapped) return;
  signals = await loadLatestSignals();
  bootstrapped = true;
}

export async function refreshSignals(): Promise<Signal[]> {
  try {
    const coins = await fetchTopCoins(config.topN);
    const futures = await Promise.all(coins.map((coin) => fetchBinanceFutures(coin.symbol)));
    signals = coins
      .map((coin, index) => scoreCoin(coin, futures[index]))
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
