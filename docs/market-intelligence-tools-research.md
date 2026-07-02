# Crypto Market Intelligence Tools Research

Goal: upgrade Whale Alert MVP into a professional, evidence-backed crypto trading terminal. Every signal must show source, metric, timestamp, and tx hash/order-flow evidence when available. No synthetic tx hash, no unverifiable claims.

## Reference Tools

| Tool | Main Strength | Useful Features To Clone | Data/Evidence Notes |
| --- | --- | --- | --- |
| CoinGlass | Derivatives + market-wide dashboards | OI, funding, liquidations, long/short ratio, liquidation heatmap, ETF flows, order book/depth views | Good for futures context. If using API/provider, store exchange, symbol, timestamp, OI USD, funding, liquidation side/size. |
| Hyblock | Liquidity + liquidation levels | Liquidation levels, heatmaps, retail vs whale positioning, custom dashboards, alerts, backtesting | Useful model for liquidity-zone alerts. Evidence should include level, distance from price, estimated liquidation cluster size, exchange/source. |
| Laevitas | Options and derivatives | Options chains, IV, Greeks, term structure, block trades, funding/basis analytics | Important for BTC/ETH professional context. Evidence should include expiry, strike, call/put, IV, delta/gamma, block trade size. |
| Velo Data | Fast derivatives/order-flow dashboards | Funding, OI, perp basis, relative strength, options/gamma style dashboards | Useful for clean trader UI and cross-asset ranking. Evidence: exchange, pair, basis/funding/OI delta. |
| Coinalyze | OI/CVD/funding/liquidation charts | CVD, aggregated OI, funding, liquidations, price overlays | Useful direct blueprint for CVD + OI divergence modules. Evidence: CVD delta, OI delta, price change, timeframe. |
| Coinank | CEX market structure, order book depth | Order book depth, liquidation map, OI/funding, CVD-like views, altcoin scanners | User inspiration. Useful for bubble/depth visualizations and top alt setup scanner. |
| TensorCharts / TRDR-style terminals | Order flow and footprint | Footprint candles, order book heatmap, volume profile, delta, absorption | Useful for high-frequency/manual trading view. Evidence: bid/ask volume, delta, absorption zone. |
| TradingLite / Exocharts | Heatmaps and execution flow | Liquidity heatmap, footprint, CVD, volume profile, DOM-style tools | Clone selected concepts for order-flow detail page. |
| Arkham | Entity-level wallet intelligence | Entity labels, wallet clusters, tx alerts, exchange/entity flows, portfolio movement | Critical for no-hallucination whale tx. Evidence must include tx hash, chain, wallet/entity label, from/to, amount USD, explorer URL. |
| Nansen | Smart money/on-chain analytics | Smart Money labels, token flows, wallet balances, exchange flows, netflows, transactions, labels | Nansen docs show APIs for Smart Money netflow, flows, transactions, labels across chains. Useful for smart money accumulation score. |
| Glassnode | Macro on-chain metrics | Exchange netflow, whale balance, supply distribution, realized cap, SOPR, MVRV | Good higher-timeframe confirmation. Evidence: metric name, value, timeframe, source. |
| CryptoQuant | Exchange flows and miner/stablecoin metrics | Exchange reserve, inflow/outflow, miner flows, stablecoin supply, derivatives | Useful for BTC/ETH macro and CEX risk. Evidence: exchange reserve change, inflow spike, timeframe. |
| Santiment | On-chain + social | Whale transaction count, exchange flow, active addresses, dev activity, social dominance | Useful social + on-chain confirmation. Evidence: metric, timestamp, source. |
| Dune | Custom SQL dashboards | Custom on-chain dashboards, protocol-specific flows, wallet cohorts | Useful for bespoke token modules. Evidence should link query/dashboard and block/tx rows. |
| DeFiLlama | Protocol/TVL/stablecoin/unlock context | TVL, chain flows, stablecoins, fees/revenue, token unlocks, yields | Useful fundamentals/narrative filter. Evidence: protocol TVL delta, revenue, fees, unlock date/amount. |
| DexScreener / GeckoTerminal / Birdeye | DEX token discovery | New pairs, liquidity, DEX volume, buys/sells, holders, pool data | Critical for early calls/crime tokens. Evidence: pair address, pool liquidity, volume, makers, tx links. |
| Bubblemaps | Holder distribution visualization | Wallet cluster graph, insider concentration, supply distribution | Useful for rug/insider risk panel. Evidence: top holder %, cluster %, linked wallets. |
| TokenUnlocks / CryptoRank | Unlock/event calendar | Vesting unlocks, cliffs, emissions, supply schedule | Risk module. Evidence: unlock amount, % supply, date, source. |
| LunarCrush / Kaito-style tools | Social/mindshare | Social volume, narrative tracking, mindshare ranking, influencer mentions | Useful but must be treated as context, not trade proof. Evidence: mention count, source, timeframe. |

## Feature Groups To Build

### 1. Market Scanner
- Top 50/100/300 market universe.
- Price, 1H/24H/7D, volume, market cap, Vol/MCap, ATH gap.
- Relative volume and abnormal volume scanner.
- Evidence: CoinGecko or CMC source, timestamp, metric values.

### 2. Derivatives Scanner
- Funding rate, funding heat, funding change.
- Open interest USD, OI delta by timeframe.
- Long/short ratio if provider available.
- Liquidations by side/timeframe.
- Liquidation cluster/heatmap later.
- Evidence: exchange, symbol, funding, OI USD, liquidation side/size, timestamp.

### 3. CVD and Order Flow
- Spot/perp CVD per exchange.
- Aggressive buy/sell delta.
- Price vs CVD divergence.
- Absorption: price flat/down while positive CVD, or price flat/up while negative CVD.
- Evidence: exchange, symbol, timeframe, buy volume, sell volume, net delta.

### 4. Order Book Depth
- Bid/ask depth within 0.5%, 1%, 2%, 5%.
- Bid/ask imbalance.
- Bid wall / ask wall detection.
- Spoof warning if wall appears/disappears quickly.
- Evidence: exchange, snapshot timestamp, depth band, bid USD, ask USD, imbalance ratio.

### 5. On-chain Whale Tracker
- Large transfers by token/chain.
- Exchange inflow/outflow classification.
- Wallet/entity labels via Arkham/Nansen or internal label DB.
- Accumulation: repeated buys/withdrawals by same entity/wallet cluster.
- Distribution: deposits to CEX, large sells, LP removal.
- Evidence: tx hash, explorer URL, chain, block time, from, to, entity labels, amount token/USD.

### 6. Smart Money / Wallet Cohorts
- Nansen-style smart money netflow.
- Fund, market maker, smart trader, whale, exchange, team/vesting labels.
- Token net buy/sell by cohort.
- Evidence: label source, wallet count, netflow USD, timeframe, sample tx hashes.

### 7. DEX Early-Call Scanner
- New pair/liquidity creation.
- Liquidity growth, volume growth, buy/sell count, maker count.
- Holder concentration and deployer risk.
- LP lock/burn status if available.
- Evidence: chain, pair address, token address, pool liquidity, transactions, holder distribution.

### 8. Narrative + Event Layer
- Social volume/mindshare, trending tickers.
- Unlock calendar, listings, governance, protocol revenue/TVL.
- Evidence: URL/source, timestamp, metric/event date.

### 9. Signal Engine
- Every signal has: bias, score, confidence, stage, reasons, risks, evidence array.
- A signal cannot claim whale tx unless evidence contains tx hash or verifiable wallet event.
- Separate signal type from evidence type:
  - Market signal
  - Derivatives signal
  - On-chain signal
  - DEX signal
  - Social/narrative signal
- Use confidence gating: stronger confidence requires multiple independent evidence sources.

## Professional Alert Format

```text
🦈 🟢🟢🟢🟢 BUY — SOL
Signal: Whale Accumulation / Spot Absorption
Score: 84/100 | Confidence: High | Stage: Early

Why:
- Spot CVD +$18.4M in 45m
- Bid depth 1%-2% +41%
- OI only +3.2%, funding neutral
- No large CEX deposit detected

Evidence:
- Binance Spot: CVD 45m = +$18.4M, timestamp ...
- Binance Futures: OI = $..., delta 1h = +3.2%
- Binance Order Book: 1%-2% bid depth = $..., ask depth = $...
- On-chain: TxHash N/A if no verified whale tx

Invalidation:
- CVD flips negative
- Bid wall disappears
- CEX inflow spike appears
```

## No-Hallucination Rules

1. No tx hash unless collected from chain/provider.
2. No wallet/entity label unless source is stated: Arkham, Nansen, Etherscan label, internal verified label.
3. No "whale bought" claim from market data alone. Use "market accumulation signal" unless tx evidence exists.
4. Every metric stores source, timestamp, timeframe, symbol/chain, raw value.
5. Alerts must include confidence and missing-data warnings.
6. Dashboard should show module status: Live / Missing / Delayed / Estimated.
7. For estimated liquidation levels or heatmaps, label them as estimated.

## Upgrade Priority

### Phase 1 - Make Current MVP Professional
- API status widget: CoinGecko OK, Binance OK, last refresh.
- Evidence panel on every signal.
- Alert history page.
- Better scoring labels: Market Accumulation, Derivatives Risk, On-chain Whale, DEX Early.
- No-hallucination language enforcement in formatter.

### Phase 2 - Real-Time Market Structure
- Binance websocket trades for CVD.
- Binance/Bybit/OKX order book snapshots.
- OI delta history and funding heat history.
- Depth imbalance module.
- Telegram alerts only when score + evidence threshold passes.

### Phase 3 - On-chain Whale Evidence
- Start with EVM + Solana high-value transfers.
- Add explorer links and tx hash verification.
- Add exchange wallet lists and internal label DB.
- Add Arkham/Nansen provider later if API keys available.

### Phase 4 - DEX Early Calls
- DexScreener/GeckoTerminal/Birdeye new-pair scanner.
- Liquidity/volume/maker growth.
- Rug/holder risk checks.
- Telegram early-call channel with strict risk labels.

### Phase 5 - Pro Trader Terminal
- Liquidation heatmaps.
- Footprint/order-flow view.
- Options/funding/basis dashboard.
- Backtesting and alert performance tracking.
- Watchlist profiles and strategy presets.

## Data Providers To Consider

Free/Public first:
- CoinGecko market API.
- Binance public REST/WebSocket.
- Bybit public API.
- OKX public API.
- DexScreener API.
- GeckoTerminal API.
- DeFiLlama API.
- Etherscan/Solscan style explorers for tx URLs.

Paid/pro later:
- CoinGlass API for derivatives/liquidations.
- Hyblock for liquidation/liquidity analytics.
- Laevitas for options/derivatives.
- Nansen API for smart money, labels, flows, transactions.
- Arkham API/platform for entity labels and wallet tracking.
- Glassnode/CryptoQuant/Santiment for macro/on-chain/social metrics.
- Birdeye for Solana/DEX trading data.

## Recommended Next Build

1. Add `Data Sources` health panel in dashboard.
2. Store CVD/OI/depth snapshots locally every minute.
3. Add Binance trade websocket CVD worker.
4. Add order book depth API module.
5. Upgrade score engine to require evidence count and source diversity.
6. Add alert history and false-positive tracking.
7. Add on-chain tx ingestion after source/API choice is confirmed.
