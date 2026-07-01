import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8787),
  topN: Number(process.env.TOP_N ?? 50),
  refreshSeconds: Number(process.env.REFRESH_SECONDS ?? 300),
  alertThreshold: Number(process.env.ALERT_THRESHOLD ?? 78),
  alertCooldownMinutes: Number(process.env.ALERT_COOLDOWN_MINUTES ?? 180),
  dataDir: process.env.DATA_DIR ?? 'data',
  dashboardUrl: process.env.DASHBOARD_URL ?? process.env.WEB_APP_URL ?? '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
};
