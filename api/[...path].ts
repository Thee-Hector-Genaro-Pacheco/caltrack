import type { IncomingMessage, ServerResponse } from 'http';

interface ExtendedRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  body?: any;
}

export default async function handler(req: ExtendedRequest, res: ServerResponse) {
  const rawOrigin = process.env.CALTRACK_API_ORIGIN;
  if (!rawOrigin || !rawOrigin.trim()) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Server configuration error: CALTRACK_API_ORIGIN environment variable is required.',
      code: 'MISSING_API_ORIGIN'
    }));
    return;
  }

  const origin = rawOrigin.trim().replace(/\/+$/, '');

  // Prevent infinite loop if CALTRACK_API_ORIGIN points to self/Vercel frontend domain
  const host = req.headers.host || '';
  if (host && origin.includes(host)) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'CALTRACK_API_ORIGIN misconfigured: causes infinite proxy loop.',
      code: 'PROXY_LOOP_DETECTED'
    }));
    return;
  }

  // Ensure request URL starts with /api
  const requestUrl = req.url || '';
  if (!requestUrl.startsWith('/api')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Not Found: Only /api routes are proxied.',
      code: 'NOT_FOUND'
    }));
    return;
  }

  // Path mapping:
  // /api/health -> /health (Express health endpoint is mounted at /health)
  // All other /api/* routes preserve /api/* prefix matching Express route mounts (/api/auth, /api/instruments, etc.)
  let targetPath = requestUrl;
  if (requestUrl === '/api/health' || requestUrl.startsWith('/api/health?')) {
    targetPath = requestUrl.replace(/^\/api\/health/, '/health');
  }

  const targetUrl = `${origin}${targetPath}`;

  // Hop-by-hop headers to omit
  const hopByHopHeaders = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'host'
  ]);

  const forwardHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    if (!hopByHopHeaders.has(lowerKey) && value !== undefined) {
      forwardHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  const method = (req.method || 'GET').toUpperCase();
  let requestBody: string | Buffer | undefined = undefined;

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (req.body) {
      if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        requestBody = req.body;
      } else {
        requestBody = JSON.stringify(req.body);
      }
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      if (chunks.length > 0) {
        requestBody = Buffer.concat(chunks);
      }
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: forwardHeaders,
      body: requestBody,
    };

    const upstreamResponse = await fetch(targetUrl, fetchOptions);

    res.statusCode = upstreamResponse.status;

    upstreamResponse.headers.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!hopByHopHeaders.has(lowerKey) && lowerKey !== 'content-length' && lowerKey !== 'content-encoding') {
        res.setHeader(key, val);
      }
    });

    if (upstreamResponse.status === 204) {
      res.end();
      return;
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.end(buffer);
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Upstream API server unavailable.',
      code: 'UPSTREAM_UNAVAILABLE'
    }));
  }
}
