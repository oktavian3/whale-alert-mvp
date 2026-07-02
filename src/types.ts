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

export interface EvidenceItem {
  source: string;
  label: string;
  value: string;
  txHash?: string;
  url?: string;
}

export interface MarketStructureMetric {
  symbol: string;
  source: string;
  updatedAt: string;
  cvdUsd15m: number;
  buyUsd15m: number;
  sellUsd15m: number;
  bidUsd1Pct: number;
  askUsd1Pct: number;
  bidUsd2Pct: number;
  askUsd2Pct: number;
  depthImbalance1Pct: number;
  liquidationUsd15m?: number;
}

export interface DataSourceHealth {
  name: string;
  status: 'LIVE' | 'DELAYED' | 'MISSING';
  lastOk?: string;
  lastError?: string;
  note?: string;
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
  evidence: EvidenceItem[];
  futures?: FuturesMetric;
  marketStructure?: MarketStructureMetric;
  updatedAt: string;
}
