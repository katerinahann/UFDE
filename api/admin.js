// Same-origin administration proxy for the static Vercel build.
// Never accepts an upstream URL from a request or forwards Authorization headers.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const base = process.env.ADMIN_BACKEND_URL;
  if (!base)
    return res
      .status(503)
      .json({ message: 'Administration backend is not configured' });
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method))
    return res.status(405).json({ message: 'Method not allowed' });
  try {
    const target = new URL(base);
    if (target.protocol !== 'https:' || target.username || target.password)
      throw Error();
    const route = typeof req.query.route === 'string' ? req.query.route : '';
    if (
      !/^(auth\/(login|logout|me)|cms\/[a-z-]+(?:\/[a-zA-Z0-9-]+)?|media\/(upload|[a-zA-Z0-9-]+\/file))$/.test(
        route,
      )
    )
      return res.status(404).json({ message: 'Not found' });
    target.pathname = target.pathname.replace(/\/$/, '') + '/' + route;
    target.search = '';
    for (const name of ['page', 'version', 'search', 'slug', 'size', 'format'])
      if (typeof req.query[name] === 'string')
        target.searchParams.set(name, req.query[name]);
    const headers = {};
    for (const name of ['content-type', 'cookie', 'origin', 'x-csrf-token'])
      if (typeof req.headers[name] === 'string')
        headers[name] = req.headers[name];
    let body;
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.headers['content-type']?.startsWith('multipart/form-data')) {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 4 * 1024 * 1024 + 65536)
            return res.status(413).json({ message: 'Upload exceeds 4 MB' });
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      } else {
        body =
          typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body ?? {});
        if (Buffer.byteLength(body) > 131072)
          return res.status(413).json({ message: 'Request too large' });
      }
    }
    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    for (const name of [
      'content-type',
      'content-disposition',
      'x-content-type-options',
      'content-security-policy',
    ]) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch {
    return res
      .status(502)
      .json({ message: 'Administration service is temporarily unavailable' });
  }
}
