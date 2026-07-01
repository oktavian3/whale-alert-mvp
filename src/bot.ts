import { config } from './config.js';
import { formatSignal, formatTop } from './format.js';
import { alertKey, loadAlertState, saveAlertState } from './persistence.js';
import { getSignal, getSignals, refreshSignals, startRefreshLoop } from './store.js';

if (!config.telegramBotToken) throw new Error('TELEGRAM_BOT_TOKEN is required');

const api = `https://api.telegram.org/bot${config.telegramBotToken}`;
let offset = 0;

async function tg<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${api}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(data.description ?? `Telegram ${method} failed`);
  return data.result;
}

function dashboardMarkup(symbol?: string) {
  if (!config.dashboardUrl) return undefined;
  const url = symbol ? `${config.dashboardUrl}?token=${encodeURIComponent(symbol.toUpperCase())}` : config.dashboardUrl;
  return { inline_keyboard: [[{ text: '🚀 Open Dashboard', url }]] };
}

async function sendMessage(chatId: number | string, text: string, replyMarkup?: unknown) {
  return tg('sendMessage', { chat_id: chatId, text, disable_web_page_preview: true, reply_markup: replyMarkup });
}

type Update = {
  update_id: number;
  message?: { chat: { id: number; type: string }; text?: string; from?: { username?: string; first_name?: string } };
};

async function handleMessage(update: Update) {
  const msg = update.message;
  if (!msg?.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  console.log('[telegram] message', { chatId, text, from: msg.from?.username ?? msg.from?.first_name });

  if (text.startsWith('/start')) {
    await sendMessage(chatId, 'Whale Alert MVP ready. Ketik /help untuk list command lengkap.', dashboardMarkup());
    return;
  }
  if (text.startsWith('/help')) {
    await sendMessage(chatId, helpText(), dashboardMarkup());
    return;
  }
  if (text.startsWith('/dashboard')) {
    await sendMessage(chatId, config.dashboardUrl ? `Dashboard: ${config.dashboardUrl}` : 'Dashboard URL belum diset di DASHBOARD_URL.', dashboardMarkup());
    return;
  }
  if (text.startsWith('/chatid')) {
    await sendMessage(chatId, `Chat ID: ${chatId}`);
    return;
  }
  if (text.startsWith('/signals')) {
    await sendMessage(chatId, formatTop(getSignals(), '🦈 Top 10 Signals'), dashboardMarkup());
    return;
  }
  if (text.startsWith('/topbuy')) {
    await sendMessage(chatId, formatTop(getSignals().filter((s) => s.bias === 'BUY'), '▲ Top BUY'));
    return;
  }
  if (text.startsWith('/topsell')) {
    await sendMessage(chatId, formatTop(getSignals().filter((s) => s.bias === 'SELL'), '▼ Top SELL'));
    return;
  }
  if (text.startsWith('/token')) {
    const symbol = text.split(/\s+/)[1];
    const signal = symbol ? getSignal(symbol) : undefined;
    await sendMessage(chatId, signal ? formatSignal(signal) : `Token ${symbol ?? ''} belum ada di top ${config.topN}.`, dashboardMarkup(symbol));
    return;
  }
  if (text.startsWith('/refresh')) {
    await sendMessage(chatId, 'Refreshing top 50...');
    try {
      const signals = await refreshSignals();
      await sendMessage(chatId, formatTop(signals, 'Refreshed Signals'));
    } catch (error) {
      await sendMessage(chatId, `Refresh gagal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function helpText() {
  return [
    '🦈 aveclawmonitor_bot commands',
    '',
    '/signals - Top 10 whale signals',
    '/topbuy - Top BUY accumulation setups',
    '/topsell - Top SELL/distribution setups',
    '/token SOL - Detail signal per token',
    '/refresh - Refresh top 50 market data',
    '/dashboard - Open web dashboard',
    '/chatid - Show your Telegram chat ID',
    '/help - Show this command list',
    '',
    'Tip: pakai /token BTC, /token ETH, /token SOL buat quick lookup.',
    'NFA. Always verify dashboard context before entry.',
  ].join('\n');
}

async function pollOnce() {
  try {
    const updates = await tg<Update[]>('getUpdates', { offset, timeout: 0, allowed_updates: ['message'] });
    if (updates.length) console.log('[telegram] updates', updates.length);
    for (const update of updates) {
      offset = update.update_id + 1;
      await handleMessage(update);
    }
  } catch (error) {
    console.error('[telegram] poll error', error instanceof Error ? error.message : error);
  }
}

async function sendAutoAlerts() {
  if (!config.telegramChatId) return;
  const state = await loadAlertState();
  const now = Date.now();
  const cooldownMs = config.alertCooldownMinutes * 60 * 1000;
  const candidates = getSignals().filter((s) => s.score >= config.alertThreshold && s.bias !== 'WATCH');

  for (const signal of candidates.slice(0, 5)) {
    const key = alertKey(signal);
    const lastSent = state.sent[key] ? Date.parse(state.sent[key]) : 0;
    if (now - lastSent < cooldownMs) continue;
    await sendMessage(config.telegramChatId, formatSignal(signal));
    state.sent[key] = new Date(now).toISOString();
  }

  await saveAlertState(state);
}

startRefreshLoop();
setInterval(() => sendAutoAlerts().catch((error) => console.error('[auto-alert]', error)), 60_000);
setInterval(() => pollOnce().catch((error) => console.error('[telegram] fatal', error)), 3000);
console.log('Telegram interval polling started');
pollOnce().catch((error) => console.error('[telegram] fatal', error));
