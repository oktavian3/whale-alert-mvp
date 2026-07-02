import type { VercelRequest, VercelResponse } from '@vercel/node';

const ORIGIN = process.env.WHALE_API_ORIGIN ?? 'http://37.60.252.176:8787';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = req.query.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath ?? '';
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else if (value !== undefined) search.append(key, value);
  }

  const target = `${ORIGIN.replace(/\/$/, '')}/api/${path}${search.size ? `?${search}` : ''}`;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: { 'content-type': 'application/json' },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json');
    res.send(text);
  } catch (error) {
    res.status(502).json({
      error: 'Upstream whale API unreachable',
      origin: ORIGIN,
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
