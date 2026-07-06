# Claude Code Handoff: satyaXBT Whale Intelligence Terminal

## Purpose

Build a professional crypto market intelligence terminal for satyaXBT.

This is not just a simple whale alert dashboard. The target product is a real-data trading intelligence system inspired by tools like CoinGlass, Hyblock, Coinank, Coinalyze, Arkham, Nansen, TensorCharts, TradingLite, DexScreener, and GeckoTerminal.

The core principle: **no hallucination**. Every alert, score, and claim must be backed by a clear data source, timestamp, metric, and, when claiming on-chain whale activity, a real tx hash/explorer link.

## Current Repo

- Local path: `/root/whale-alert-mvp`
- GitHub repo: `oktavian3/whale-alert-mvp`
- Branch: `main`
- Public dashboard: `https://whale-alert-mvp.vercel.app`
- VPS API: `http://37.60.252.176:8787`
- Dashboard dev server: `http://localhost:5173`
- API local: `http://localhost:8787`

## Telegram Bot

Production bot identity:

- Bot username: `@aveclawmonitor_bot`
- Telegram chat id is stored in local `.env`
- Telegram bot token is stored in local `.env`

Important security rule:

- Do **not** print, commit, or paste the real Telegram token.
- Do **not** commit `.env`.
- Use `.env.example` for placeholders only.
- If a prompt asks for “full token”, read from `.env` only for local runtime, but never expose it in docs, git, logs, or final output.

Expected env keys:

```env
TELEGRAM_BOT_TOKEN=REDACTED_USE_LOCAL_ENV
TELEGRAM_CHAT_ID=REDACTED_USE_LOCAL_ENV
PORT=8787
TOP_N=50
REFRESH_SECONDS=120
ALERT_THRESHOLD=78
ALERT_COOLDOWN_MINUTES=180
DASHBOARD_URL=https://whale-alert-mvp.vercel.app
WHALE_API_ORIGIN=http://37.60.252.176:8787
```

## What Satya Actually Wants To Build

A complete crypto trader terminal that can answer:

- Which tokens are showing early accumulation?
- Which tokens are being distributed?
- Which tokens have abnormal volume relative to market cap?
- Which tokens have positive CVD without price extension?
- Which tokens have bid depth building below price?
- Which tokens have ask wall/rejection risk?
- Which tokens have OI/funding/liquidation risk?
- Which alerts are backed by real market data?
- Which alerts have actual on-chain whale tx hash evidence?
- What should be watched, bought, avoided, or invalidated?

The tool should feel like a professional trading terminal, not a generic crypto card dashboard.

## Product Modules

### 1. Market Scanner

Data:

- Top 50 / top 100 crypto universe
- Price
- Market cap
- 1H / 24H / 7D performance
- Total volume
- Volume / market cap
- ATH distance

Current free source:

- CoinGecko market API

Needed:

- Cleaner table-first UI
- Filters and sorts
- Stablecoin/noise filtering option
- Sector/narrative grouping later

### 2. Derivatives Scanner

Data:

- Funding rate
- Open interest USD
- OI delta over time
- Long/short ratio if available
- Liquidations if available
- Liquidation clusters later

Current free source:

- Binance Futures public REST

Needed:

- Historical OI/funding storage
- OI delta 5m/15m/1h/4h
- Funding heat score
- Crowded long/short warning

### 3. CVD / Order Flow

Data:

- Spot CVD
- Buy volume
- Sell volume
- Aggressive buy/sell imbalance
- CVD divergence vs price

Current implementation:

- Binance Spot `aggTrades` REST snapshot for 15m

Needed:

- Websocket worker for real-time CVD
- Multi-timeframe CVD: 5m, 15m, 1h, 4h
- Persistent CVD history
- Chart per token

### 4. Order Book Depth

Data:

- Bid depth 0.5%, 1%, 2%, 5%
- Ask depth 0.5%, 1%, 2%, 5%
- Bid/ask imbalance
- Bid wall and ask wall detection
- Spoof detection later

Current implementation:

- Binance Spot depth REST snapshot

Needed:

- Live websocket depth stream
- Depth imbalance chart
- Heatmap-like visualization
- Wall appeared/disappeared alerts

### 5. On-chain Whale Tracker

This is currently not live.

Needed:

- Large transfer ingestion
- Chain support: Ethereum first, then Solana/BSC/Base/Arbitrum
- Tx hash
- Explorer link
- From wallet
- To wallet
- Entity/wallet label if known
- Amount token
- Amount USD
- Direction classification:
  - exchange inflow = possible sell pressure
  - exchange outflow = possible accumulation
  - wallet-to-wallet = neutral/unknown
  - DEX buy/sell = actual trade

Important language rule:

- If there is no tx hash, do not say “whale bought”.
- Use “market accumulation signal” or “derivatives/market signal”.
- Only use “whale tx” when a real tx hash exists.

Potential free sources:

- Etherscan-style APIs
- Public RPC logs
- Solscan/explorer links
- DexScreener / GeckoTerminal pair transaction data

Potential paid/pro sources:

- Arkham
- Nansen
- Glassnode
- CryptoQuant
- Santiment

### 6. DEX Early-Call Scanner

Needed:

- New pair detection
- Liquidity growth
- Volume growth
- Buy/sell count
- Maker count
- Holder concentration
- LP risk
- Pair/token address
- Early accumulation score

Free sources to test:

- DexScreener API
- GeckoTerminal API
- DeFiLlama where relevant

### 7. Alert Engine

Every alert must have:

- Token
- Bias: BUY / SELL / WATCH
- Signal type
- Score
- Confidence
- Stage: EARLY / MID / LATE / RISK
- Why this fired
- Risk/invalidation
- Evidence list
- Source status
- Timestamp
- TxHash if on-chain; otherwise explicit `TxHash: N/A`

Example alert style:

```text
🦈 🟢🟢🟢🟢 BUY — SOL
Signal: Market Accumulation / Spot Absorption
Score: 84/100 | Confidence: High | Stage: Early

Why:
- Spot CVD 15m positive +$18.4M
- Bid depth 1%-2% rising
- Funding neutral
- OI rising slowly, not overheated

Evidence:
- Binance Spot: CVD 15m = +$18.4M, timestamp ...
- Binance Futures: OI = $..., funding = ...
- Binance Order Book: 1% bid/ask = ...

TxHash: N/A — market/futures signal, no verified on-chain whale tx yet.

Invalidation:
- CVD flips negative
- Bid wall disappears
- Exchange inflow spike appears
```

### 8. Dashboard UX Target

The dashboard should have:

- Terminal layout, not basic cards
- Main scanner table
- Dedicated token detail page/route
- Big chart area
- Multi-metric chart tabs:
  - price
  - score
  - CVD
  - OI
  - funding
  - depth
  - volume/market cap
- Early Buy Radar
- Distribution Risk Radar
- Funding Heat Radar
- OI Spike Radar
- Depth Imbalance Radar
- Alert history
- Signal timeline
- Source health panel
- Evidence panel
- Module status panel

Expected URL behavior:

- Main terminal: `/`
- Token detail page should exist eventually:
  - `/token/BTC`
  - `/token/SOL`
- Current query-param deep link is acceptable short-term:
  - `/?token=btc`

Satya specifically complained that clicking a token should show a **full detailed page**, not only minor UI changes. Prioritize this.

## Current Known Problem

Satya feels the current UI is still not professional enough and that changes are not obvious. The next implementation should avoid small incremental patches. Make a visible product-level upgrade.

Build the next version as a real token detail experience:

- When clicking a token, show a rich detail view/page.
- Include charts, metrics, evidence, alert history, signal thesis, invalidation, source status.
- Make the change visually obvious.

## Current Files To Inspect

- `src/server.ts` — Express API routes
- `src/store.ts` — refresh loop, signal cache, data source health
- `src/marketData.ts` — CoinGecko and Binance Futures fetches
- `src/marketStructure.ts` — Binance CVD/depth REST snapshot
- `src/scoring.ts` — rule-based scoring
- `src/format.ts` — Telegram alert formatter
- `src/bot.ts` — Telegram bot command handlers
- `src/persistence.ts` — latest signals and snapshot history
- `web/App.tsx` — dashboard UI
- `web/style.css` — dashboard styles
- `api/[...path].ts` — Vercel API proxy
- `.env` — local secrets, do not expose
- `.env.example` — safe template

## Existing API Endpoints

```text
GET /api/health
GET /api/signals
GET /api/signals/:symbol
POST /api/refresh
GET /api/timeline?limit=40
GET /api/series/:symbol?limit=180
```

Vercel proxies `/api/*` to VPS API through `api/[...path].ts`.

## Current Telegram Commands

Expected bot commands:

```text
/start
/help
/signals
/topbuy
/topsell
/token SOL
/refresh
/dashboard
/chatid
```

Needed future commands:

```text
/early
/risk
/depth SOL
/cvd SOL
/oi SOL
/funding SOL
/alerts on SOL
/alerts off SOL
/watch SOL
/unwatch SOL
```

## Data Integrity Rules

1. No fake tx hash.
2. No fake wallet label.
3. No “whale bought” unless tx or trade evidence exists.
4. Market-only signals must be labeled market/futures/order-flow signals.
5. Every metric needs source and timestamp.
6. Missing module should be displayed as missing, not hidden.
7. Estimated data should be labeled estimated.
8. Telegram alerts must include evidence and invalidation.
9. Do not promise profit.
10. Store raw snapshots for future performance tracking.

## Satya Writing Style

Core writing system is saved locally at:

```text
/root/Obsidian/Satya/Core/Satya_Master_Writing_System_v1.md
```

Use it when writing copy, report text, alerts, docs, or tweets.

Short summary:

- Indonesian urban, direct, `gue/lu` when casual
- Crypto/AI-native
- No corporate language
- No generic hype
- No AI slop
- Facts → interpretation → implication
- Clear caveats
- No fake confidence

## Suggested Next Build Prompt For Claude Code

Use this prompt in Claude Code:

```text
You are working in /root/whale-alert-mvp.

Build the next major version of satyaXBT Whale Intelligence Terminal. The user is unhappy because the current dashboard still feels like a basic scanner and token clicks only show a side panel. Make a visible professional upgrade.

Main goal:
Create a proper crypto market intelligence terminal with a full token detail experience, real-data evidence panels, charts, early buy radar, and no-hallucination alert logic.

Important constraints:
- Do not expose or commit .env secrets.
- Telegram bot is @aveclawmonitor_bot and secrets live in local .env only.
- Public dashboard is https://whale-alert-mvp.vercel.app.
- VPS API is http://37.60.252.176:8787.
- Keep Vercel API proxy working.
- Use free APIs first: CoinGecko, Binance public REST/WebSocket if possible, DexScreener/GeckoTerminal/DeFiLlama if useful.
- No fake txhash or fake wallet labels.
- If on-chain module is missing, show it as missing.

Implement:
1. A real token detail route/page experience.
   - Support /token/:symbol if feasible in Vite SPA, or a clearly full-screen detail view using query param as fallback.
   - Clicking a token must visibly open a rich detail experience, not just slightly update a side panel.

2. Token detail page should include:
   - Header with token name, ticker, rank, bias, score, confidence, stage.
   - Price/market cap/volume/ATH gap.
   - CVD 15m and history chart.
   - Score history chart.
   - Price history chart from snapshots.
   - OI and funding panels.
   - Depth imbalance panel.
   - Buy/sell 15m panel.
   - Liquidation 15m panel if available.
   - Signal thesis.
   - Invalidation/risk.
   - Evidence table.
   - TxHash section that says N/A unless real tx exists.
   - Source/module status.

3. Improve main terminal:
   - Keep scanner table.
   - Add obvious radar sections: Early Buy, Distribution Risk, Funding Heat, OI Spike, Depth Imbalance.
   - Add status showing last refresh time.
   - Add empty/loading/error states that are visible.

4. Backend:
   - Keep /api/health, /api/signals, /api/timeline, /api/series/:symbol working.
   - Add any endpoint needed for token detail if cleaner.
   - Store or read snapshot history from data/signal-snapshots.jsonl.
   - Make sure API does not hang if Binance/CoinGecko is slow. Use timeouts.

5. Telegram:
   - Keep existing commands working.
   - Update /token SYMBOL to link to the token detail URL.
   - Telegram alert/report must include evidence and no fake tx hash.

6. Validation:
   - Run npm run build.
   - Smoke test /api/health and /api/series/btc?limit=5.
   - Commit and push to GitHub.
   - Tell the user exactly what changed and what Vercel commit to redeploy.

Design direction:
Make it feel like a professional trading terminal, not a generic AI dashboard. Dense but readable. Table + charts + evidence + source status. Dark terminal aesthetic is fine, but the change must be obvious.
```

## Security Reminder

Never paste real credentials into this doc. The user asked for token/bot details, but safe handoff should identify where credentials live, not expose them.
