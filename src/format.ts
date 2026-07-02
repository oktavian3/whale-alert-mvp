import type { Signal } from './types.js';

const arrow = { BUY: '▲', SELL: '▼', WATCH: '◆' } as const;

export function formatSignal(signal: Signal): string {
  const c = signal.coin;
  const strength = strengthDots(signal.score);
  const txHashes = (signal.evidence ?? []).filter((e) => e.txHash);
  const lines = [
    `🦈 ${strength} ${arrow[signal.bias]} ${signal.bias} — ${c.name} (${c.symbol.toUpperCase()})`,
    `Signal: ${signal.signal}`,
    `Score: ${signal.score}/100 | ${signal.confidence} | Stage: ${signal.stage}`,
    `Price: $${c.current_price?.toLocaleString('en-US')}`,
    `1H ${pct(c.price_change_percentage_1h_in_currency)} | 24H ${pct(c.price_change_percentage_24h_in_currency)} | 7D ${pct(c.price_change_percentage_7d_in_currency)}`,
    `Vol/MCap: ${(signal.volMcap * 100).toFixed(1)}%`,
  ];
  if (signal.futures?.fundingRate !== undefined) lines.push(`Funding: ${(signal.futures.fundingRate * 100).toFixed(4)}% | OI: ${usd(signal.futures.openInterestUsd)}`);
  if (signal.reasons.length) lines.push(`\nWhy:\n- ${signal.reasons.join('\n- ')}`);
  if (signal.warnings.length) lines.push(`\nRisk:\n- ${signal.warnings.join('\n- ')}`);
  lines.push(`\nEvidence:\n${formatEvidence(signal)}`);
  lines.push(txHashes.length ? `\nTxHash:\n${txHashes.map((e) => `- ${e.txHash}`).join('\n')}` : '\nTxHash: N/A — market/futures signal, belum ada on-chain whale tx terverifikasi.');
  lines.push('\nNFA. Cek detail dashboard sebelum entry.');
  return lines.join('\n');
}

export function formatTop(signals: Signal[], title = 'Top Signals'): string {
  return [`${title}`, ...signals.slice(0, 10).map((s, i) => `${i + 1}. ${strengthDots(s.score)} ${s.coin.symbol.toUpperCase()} ${s.bias} ${s.score}/100 - ${s.signal}`)].join('\n');
}

function formatEvidence(signal: Signal) {
  const evidence = signal.evidence ?? [];
  if (!evidence.length) return '- No evidence payload attached';
  return evidence.slice(0, 6).map((e) => `- ${e.source}: ${e.label} = ${e.value}`).join('\n');
}

function strengthDots(score: number) {
  const count = score >= 85 ? 5 : score >= 75 ? 4 : score >= 65 ? 3 : score >= 55 ? 2 : 1;
  return '🟢'.repeat(count);
}

function pct(value: number | null | undefined) { return `${Number(value ?? 0).toFixed(2)}%`; }
function usd(value?: number) {
  if (!value) return '-';
  if (value > 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value > 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}
