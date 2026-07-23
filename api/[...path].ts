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

  const requestUrl = req.url || '/';

  // Determine correct target path for Express backend
  let targetPath = '';
  if (
    requestUrl === '/health' ||
    requestUrl.startsWith('/health?') ||
    requestUrl === '/api/health' ||
    requestUrl.startsWith('/api/health?')
  ) {
    // Health endpoint is mounted at /health in Express
    const queryString = requestUrl.includes('?') ? requestUrl.substring(requestUrl.indexOf('?')) : '';
    targetPath = `/health${queryString}`;
  } else {
    // All other Express routes are mounted under /api/ (e.g. /api/work-orders, /api/control-loops, /api/process-areas)
    if (requestUrl.startsWith('/api/')) {
      targetPath = requestUrl;
    } else {
      const cleanPath = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`;
      targetPath = `/api${cleanPath}`;
    }
  }

  const targetUrl = `${origin}${targetPath}`;
  const method = (req.method || 'GET').toUpperCase();

  // Safe diagnostic log (Task 5: proxy path, upstream URL without secrets, no headers/tokens)
  console.log(`[Vercel Proxy] Request: ${method} ${requestUrl} -> Upstream: ${targetUrl}`);

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

    // Safe diagnostic log of response status
    console.log(`[Vercel Proxy] Response: ${method} ${targetUrl} -> Status ${upstreamResponse.status}`);

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
    console.error(`[Vercel Proxy Error] Failed to reach upstream target ${targetUrl}:`, err.message);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Upstream API server unavailable.',
      code: 'UPSTREAM_UNAVAILABLE'
    }));
  }
}
