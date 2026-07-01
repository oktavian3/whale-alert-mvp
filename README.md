# Whale Alert MVP

Top 50 crypto signal dashboard + Telegram bot command layer.

## Important token note

The Telegram bot token was placed in `.env` because you asked to run with it. Since it was shared in chat, rotate it in `@BotFather` before any public deploy.

## What works now

- Pulls top 50 coins from CoinGecko.
- Enriches available Binance USDT futures with funding and open interest notional.
- Scores each coin into `BUY`, `SELL`, or `WATCH`.
- Shows dashboard cards with score, stage, Vol/MCap, 1H/24H/7D, reasons, and warnings.
- Telegram bot commands:
  - `/start`
  - `/signals`
  - `/topbuy`
  - `/topsell`
  - `/token SOL`
  - `/refresh`

## Run locally

```bash
cd /root/whale-alert-mvp
npm install
cp .env.example .env
npm run dev
```

Open dashboard:

```text
http://SERVER_IP:5173
```

API:

```text
http://SERVER_IP:8787/api/signals
```

Run Telegram bot separately:

```bash
npm run bot
```

## Automatic alerts

Set `TELEGRAM_CHAT_ID` in `.env` to enable push alerts. If it is empty, commands still work but the bot will not auto-push.

```env
ALERT_THRESHOLD=78
ALERT_COOLDOWN_MINUTES=180
TELEGRAM_CHAT_ID=123456789
```

The bot dedupes by token + bias + signal and stores state in `data/alert-state.json`.

## Persistence

The app stores lightweight local history without a database:

```text
data/latest-signals.json
data/signal-snapshots.jsonl
data/alert-state.json
```

This is enough for MVP. Later, move this to PostgreSQL/TimescaleDB.

## Production idea

Use PM2 for always-on VPS processes:

```bash
cd /root/whale-alert-mvp
npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Useful commands:

```bash
pm2 logs whale-api
pm2 logs whale-bot
pm2 restart all
```

For the next phase, add Coinglass/Hyblock liquidation, deeper Binance/Bybit CVD collection, order book depth workers, and PostgreSQL/TimescaleDB storage for historical signal snapshots.
