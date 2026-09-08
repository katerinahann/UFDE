export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query.id;
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id))
    return res.status(404).end();
  if (!process.env.ADMIN_BACKEND_URL) return res.status(503).end();
  try {
    const url = new URL(process.env.ADMIN_BACKEND_URL);
    if (url.protocol !== 'https:') throw Error();
    url.pathname = url.pathname.replace(/\/admin\/?$/, '') + '/media/' + id;
    url.search = '';
    for (const key of ['size','format']) if (typeof req.query[key] === 'string') url.searchParams.set(key,req.query[key]);
    const upstream = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    for (const name of [
      'content-type',
      'content-disposition',
      'x-content-type-options',
      'content-security-policy',
    ]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    return res
      .status(upstream.status)
      .send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    return res.status(502).end();
  }
}
