import { createHmac } from 'node:crypto';
// Same-origin proxy; the backend URL is configured server-side.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const action = req.query.action || 'subscribe';
  if (!['subscribe', 'confirm', 'unsubscribe'].includes(action))
    return res.status(404).json({ message: 'Not found' });
  const target = process.env.NEWSLETTER_BACKEND_URL;
  if (!target)
    return res
      .status(503)
      .json({ message: 'Newsletter service is not configured' });
  try {
    const url = new URL(target.replace(/\/$/, '') + '/' + action);
    if (url.protocol !== 'https:') throw Error();
    const body = JSON.stringify(
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body,
    );
    if (!body || Buffer.byteLength(body) > 4096)
      return res.status(413).json({ message: 'Request too large' });
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.CONTACT_PROXY_SECRET) {
      const ip = String(
          req.headers['x-forwarded-for'] ||
            req.socket?.remoteAddress ||
            'unknown',
        )
          .split(',')[0]
          .trim(),
        time = String(Date.now());
      Object.assign(headers, {
        'x-ufde-ip': ip,
        'x-ufde-time': time,
        'x-ufde-signature': createHmac(
          'sha256',
          process.env.CONTACT_PROXY_SECRET,
        )
          .update(time + '\n' + ip)
          .digest('hex'),
      });
    }
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    return res.status(upstream.status).json(await upstream.json());
  } catch {
    return res
      .status(502)
      .json({ message: 'Newsletter service temporarily unavailable' });
  }
}
