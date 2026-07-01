import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { formatSignal } from './format.js';
import { getSignal, getSignals, getStatus, refreshSignals, startRefreshLoop } from './store.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, ...getStatus() }));
app.get('/api/signals', (_req, res) => res.json({ signals: getSignals(), status: getStatus() }));
app.get('/api/signals/:symbol', (req, res) => {
  const signal = getSignal(req.params.symbol);
  if (!signal) return res.status(404).json({ error: 'Signal not found' });
  return res.json({ signal, telegramPreview: formatSignal(signal) });
});
app.post('/api/refresh', async (_req, res) => res.json({ signals: await refreshSignals(), status: getStatus() }));

startRefreshLoop();
app.listen(config.port, () => console.log(`Whale Alert API listening on :${config.port}`));
