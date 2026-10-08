/**
 * Backend API proxy for the broker admin panel.
 *
 * The browser calls this app's own origin (/api/v1/...) and this function
 * forwards it to the backend, so the backend's address never appears in the
 * JavaScript bundle and every API call is same-origin.
 *
 * Nothing is added to the request: the broker's own JWT in Authorization is
 * what the backend authenticates. Same design as the user portal's proxy.
 *
 * Environment (Vercel project settings):
 *   BACKEND_URL   https://api...   backend origin, no trailing /v1
 */

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

/** Hop-by-hop headers, plus the ones the fetch below must set itself. */
const STRIP = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
  'te',
  'trailer',
  // fetch() decompresses the upstream body, and the request body is passed as
  // raw bytes, so neither header describes what is actually sent on.
  'content-encoding',
  'content-length'
]);

/**
 * Vercel's body parser is off: the raw stream is forwarded byte for byte, so
 * multipart uploads (support attachments, receipts) keep their boundary intact.
 */
export const config = { api: { bodyParser: false } };

const rawBody = async (req) => {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
};

export default async function handler(req, res) {
  // vercel.json rewrites /api/<rest> to /api/proxy?path=<rest>; every other
  // query parameter is the caller's own and is forwarded.
  const { path: raw, ...forwarded } = req.query ?? {};
  const path = Array.isArray(raw) ? raw.join('/') : (raw ?? '');

  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(forwarded)) {
    for (const v of Array.isArray(value) ? value : [value]) params.append(name, v);
  }
  const query = params.toString() ? `?${params}` : '';

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!STRIP.has(name.toLowerCase()) && value !== undefined) {
      headers[name] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  const body = await rawBody(req);

  try {
    const upstream = await fetch(`${BACKEND_URL}/${path}${query}`, {
      method: req.method,
      headers,
      body
    });

    upstream.headers.forEach((value, name) => {
      if (!STRIP.has(name.toLowerCase())) res.setHeader(name, value);
    });

    res.status(upstream.status);
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    // The backend being unreachable is a gateway problem, not a client error.
    return res.status(502).json({ message: 'Upstream request failed' });
  }
}
