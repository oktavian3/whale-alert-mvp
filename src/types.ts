export type Bias = 'BUY' | 'SELL' | 'WATCH';
export type Stage = 'EARLY' | 'MID' | 'LATE' | 'RISK';

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
}

export interface FuturesMetric {
  symbol: string;
  fundingRate?: number;
  openInterestUsd?: number;
  openInterestChangePct?: number;
  source?: string;
}

export interface Signal {
  id: string;
  coin: CoinMarket;
  bias: Bias;
  signal: string;
  score: number;
  stage: Stage;
  confidence: 'Low' | 'Medium' | 'High';
  volMcap: number;
  reasons: string[];
  warnings: string[];
  futures?: FuturesMetric;
  updatedAt: string;
}
