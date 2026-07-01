import type { Bias, CoinMarket, FuturesMetric, Signal, Stage } from './types.js';

function n(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function confidence(score: number): Signal['confidence'] {
  if (score >= 75) return 'High';
  if (score >= 55) return 'Medium';
  return 'Low';
}

function stageFrom(coin: CoinMarket, volMcap: number, fundingRate = 0): Stage {
  const h24 = n(coin.price_change_percentage_24h_in_currency);
  const d7 = n(coin.price_change_percentage_7d_in_currency);
  if (h24 < -8 || fundingRate > 0.0008) return 'RISK';
  if (d7 > 35 || volMcap > 0.6) return 'LATE';
  if (h24 > 3 && d7 < 18) return 'EARLY';
  return 'MID';
}

export function scoreCoin(coin: CoinMarket, futures?: FuturesMetric): Signal {
  const h1 = n(coin.price_change_percentage_1h_in_currency);
  const h24 = n(coin.price_change_percentage_24h_in_currency);
  const d7 = n(coin.price_change_percentage_7d_in_currency);
  const volMcap = coin.market_cap > 0 ? coin.total_volume / coin.market_cap : 0;
  const funding = futures?.fundingRate ?? 0;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 25;

  if (volMcap > 0.1) { score += 18; reasons.push(`Vol/MCap ${(volMcap * 100).toFixed(1)}% abnormal`); }
  if (volMcap > 0.35) { score += 8; warnings.push('Volume ekstrem: cek potensi blow-off atau wash volume'); }
  if (h24 > 3 && h1 > -1) { score += 16; reasons.push(`Harga naik stabil 24H ${h24.toFixed(1)}%`); }
  if (h1 > 2 && h24 > 6) { score += 10; reasons.push(`Fresh momentum 1H ${h1.toFixed(1)}%`); }
  if (d7 < 20 && h24 > 0) { score += 8; reasons.push('Belum terlalu extended di 7D'); }
  if (coin.ath_change_percentage && coin.ath_change_percentage < -45) { score += 8; reasons.push('Jauh dari ATH - reversal potential'); }
  if (Math.abs(funding) < 0.0002 && futures) { score += 7; reasons.push('Funding netral'); }
  if (funding > 0.0006) { score -= 15; warnings.push('Funding panas: risk crowded long'); }

  let bias: Bias = 'WATCH';
  let signal = 'Watchlist Setup';
  if (h1 < -3 && volMcap > 0.12) {
    bias = 'SELL';
    signal = 'Distribusi Whale';
    score += 18;
    reasons.push(`Distribusi: volume tinggi tapi 1H turun ${h1.toFixed(1)}%`);
  } else if (score >= 58 && h24 > 0) {
    bias = 'BUY';
    signal = 'Akumulasi Whale';
    reasons.push('Akumulasi: volume besar + price action masih suportif');
  }

  if (d7 > 35) warnings.push(`7D sudah naik ${d7.toFixed(1)}% - avoid chase`);
  if (h24 < -8) warnings.push(`Sell-off 24H ${h24.toFixed(1)}%`);

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    id: `${coin.id}-${Date.now()}`,
    coin,
    bias,
    signal,
    score: finalScore,
    stage: stageFrom(coin, volMcap, funding),
    confidence: confidence(finalScore),
    volMcap,
    reasons: reasons.slice(0, 5),
    warnings: warnings.slice(0, 4),
    futures,
    updatedAt: new Date().toISOString(),
  };
}
