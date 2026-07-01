import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import type { Signal } from './types.js';

interface AlertState {
  sent: Record<string, string>;
}

const baseDir = path.resolve(config.dataDir);
const snapshotsPath = path.join(baseDir, 'signal-snapshots.jsonl');
const latestPath = path.join(baseDir, 'latest-signals.json');
const alertStatePath = path.join(baseDir, 'alert-state.json');

async function ensureDir() {
  await mkdir(baseDir, { recursive: true });
}

export async function persistSignals(signals: Signal[]) {
  await ensureDir();
  const payload = JSON.stringify({ savedAt: new Date().toISOString(), signals });
  await writeFile(latestPath, `${JSON.stringify(signals, null, 2)}\n`);
  await appendFile(snapshotsPath, `${payload}\n`);
}

export async function loadLatestSignals(): Promise<Signal[]> {
  try {
    const raw = await readFile(latestPath, 'utf8');
    return JSON.parse(raw) as Signal[];
  } catch {
    return [];
  }
}

export async function loadAlertState(): Promise<AlertState> {
  try {
    return JSON.parse(await readFile(alertStatePath, 'utf8')) as AlertState;
  } catch {
    return { sent: {} };
  }
}

export async function saveAlertState(state: AlertState) {
  await ensureDir();
  await writeFile(alertStatePath, `${JSON.stringify(state, null, 2)}\n`);
}

export function alertKey(signal: Signal) {
  return `${signal.coin.id}:${signal.bias}:${signal.signal}`;
}
