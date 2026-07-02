import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { formatSignal } from './format.js';
import { loadSignalSnapshots } from './persistence.js';
import { getSignal, getSignals, getStatus, refreshSignals, startRefreshLoop } from './store.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, ...getStatus() }));
app.get('/api/signals', (_req, res) => res.json({ signals: getSignals(), status: getStatus() }));
app.get('/api/timeline', async (req, res) => {
  const limit = Math.max(10, Math.min(240, Number(req.query.limit ?? 80)));
  const snapshots = await loadSignalSnapshots(limit);
  const timeline = snapshots.map((snapshot) => {
    const top = snapshot.signals.slice(0, 8);
    return {
      savedAt: snapshot.savedAt,
      top: top.map((signal) => ({ symbol: signal.coin.symbol.toUpperCase(), bias: signal.bias, score: signal.score, price: signal.coin.current_price, signal: signal.signal })),
      buy: snapshot.signals.filter((signal) => signal.bias === 'BUY').length,
      sell: snapshot.signals.filter((signal) => signal.bias === 'SELL').length,
      watch: snapshot.signals.filter((signal) => signal.bias === 'WATCH').length,
      avgScore: Math.round(snapshot.signals.reduce((sum, signal) => sum + signal.score, 0) / Math.max(snapshot.signals.length, 1)),
    };
  });
  res.json({ timeline });
});
app.get('/api/signals/:symbol', (req, res) => {
  const signal = getSignal(req.params.symbol);
  if (!signal) return res.status(404).json({ error: 'Signal not found' });
  return res.json({ signal, telegramPreview: formatSignal(signal) });
});
app.post('/api/refresh', async (_req, res) => res.json({ signals: await refreshSignals(), status: getStatus() }));

startRefreshLoop();
app.listen(config.port, () => console.log(`Whale Alert API listening on :${config.port}`));
