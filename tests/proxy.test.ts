import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/[...path].js';
import { EventEmitter } from 'events';

function createMockReqRes(options: { url: string; method?: string; headers?: Record<string, string>; body?: any }) {
  const req: any = new EventEmitter();
  req.url = options.url;
  req.method = options.method || 'GET';
  req.headers = options.headers || { host: 'caltrack-web-six.vercel.app' };
  req.body = options.body;

  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    end(data?: any) {
      if (data) {
        this.body = Buffer.isBuffer(data) ? data.toString('utf8') : data;
      }
    }
  };

  return { req, res };
}

test('Vercel API Proxy - Missing CALTRACK_API_ORIGIN returns safe 500 without leaking secrets', async () => {
  const originalOrigin = process.env.CALTRACK_API_ORIGIN;
  delete process.env.CALTRACK_API_ORIGIN;
  try {
    const { req, res } = createMockReqRes({ url: '/api/health' });
    await handler(req, res);
    assert.equal(res.statusCode, 500);
    const parsed = JSON.parse(res.body);
    assert.equal(parsed.code, 'MISSING_API_ORIGIN');
    assert.equal(parsed.error, 'Server configuration error: CALTRACK_API_ORIGIN environment variable is required.');
    assert.ok(!res.body.includes('3.18.108.1'));
  } finally {
    process.env.CALTRACK_API_ORIGIN = originalOrigin;
  }
});

test('Vercel API Proxy - Prevents infinite proxy loops', async () => {
  process.env.CALTRACK_API_ORIGIN = 'https://caltrack-web-six.vercel.app';
  const { req, res } = createMockReqRes({
    url: '/api/health',
    headers: { host: 'caltrack-web-six.vercel.app' }
  });
  await handler(req, res);
  assert.equal(res.statusCode, 500);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.code, 'PROXY_LOOP_DETECTED');
});

test('Vercel API Proxy - Target route mappings, headers, query preservation & non-2xx propagation', async () => {
  let receivedUrl = '';
  let receivedMethod = '';
  let receivedAuthHeader = '';

  const upstreamServer = http.createServer((uReq, uRes) => {
    receivedUrl = uReq.url || '';
    receivedMethod = uReq.method || '';
    receivedAuthHeader = uReq.headers['authorization'] || '';

    if (receivedUrl === '/health') {
      uRes.writeHead(200, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify({ status: 'healthy', database: 'connected' }));
    } else if (receivedUrl === '/api/work-orders') {
      if (!receivedAuthHeader) {
        uRes.writeHead(401, { 'Content-Type': 'application/json' });
        uRes.end(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }));
        return;
      }
      uRes.writeHead(200, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify([{ id: 'wo-1', workOrderNumber: 'WO-1001' }]));
    } else if (receivedUrl === '/api/control-loops') {
      uRes.writeHead(200, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify([{ id: 'loop-101', loopTag: 'PT-101' }]));
    } else if (receivedUrl === '/api/process-areas?filter=active&limit=10') {
      uRes.writeHead(200, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify([{ id: 'area-10', name: 'Feedwater System' }]));
    } else if (receivedUrl === '/api/auth/login') {
      uRes.writeHead(200, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify({ token: 'mock-jwt-token' }));
    } else if (receivedUrl === '/api/non-existent-route') {
      uRes.writeHead(404, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify({ error: 'Cannot GET /api/non-existent-route', code: 'NOT_FOUND' }));
    } else {
      uRes.writeHead(500, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify({ error: 'Unexpected upstream endpoint' }));
    }
  });

  await new Promise<void>((resolve) => upstreamServer.listen(0, '127.0.0.1', resolve));
  const address: any = upstreamServer.address();
  const testOrigin = `http://127.0.0.1:${address.port}`;
  process.env.CALTRACK_API_ORIGIN = testOrigin;

  try {
    // 1. /api/health -> /health
    {
      const { req, res } = createMockReqRes({ url: '/api/health' });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/health');
      const data = JSON.parse(res.body);
      assert.equal(data.status, 'healthy');
    }

    // 2. /api/work-orders -> /api/work-orders (with Authorization header forwarding)
    {
      const { req, res } = createMockReqRes({
        url: '/api/work-orders',
        method: 'GET',
        headers: {
          host: 'caltrack-web-six.vercel.app',
          authorization: 'Bearer valid-auth-token'
        }
      });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/api/work-orders');
      assert.equal(receivedAuthHeader, 'Bearer valid-auth-token');
      const data = JSON.parse(res.body);
      assert.equal(data[0].workOrderNumber, 'WO-1001');
    }

    // 3. /work-orders (Vercel stripped path form) -> /api/work-orders
    {
      const { req, res } = createMockReqRes({
        url: '/work-orders',
        method: 'GET',
        headers: {
          host: 'caltrack-web-six.vercel.app',
          authorization: 'Bearer valid-auth-token'
        }
      });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/api/work-orders');
    }

    // 4. /api/control-loops -> /api/control-loops
    {
      const { req, res } = createMockReqRes({ url: '/api/control-loops' });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/api/control-loops');
      const data = JSON.parse(res.body);
      assert.equal(data[0].loopTag, 'PT-101');
    }

    // 5. /api/process-areas?filter=active&limit=10 -> /api/process-areas?filter=active&limit=10 (query string preservation)
    {
      const { req, res } = createMockReqRes({ url: '/api/process-areas?filter=active&limit=10' });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/api/process-areas?filter=active&limit=10');
      const data = JSON.parse(res.body);
      assert.equal(data[0].name, 'Feedwater System');
    }

    // 6. Non-2xx response propagation (e.g. 404 from upstream)
    {
      const { req, res } = createMockReqRes({ url: '/api/non-existent-route' });
      await handler(req, res);
      assert.equal(res.statusCode, 404);
      const data = JSON.parse(res.body);
      assert.equal(data.code, 'NOT_FOUND');
    }
  } finally {
    upstreamServer.close();
  }
});

test('Vercel API Proxy - Returns safe 502 error when upstream is unreachable', async () => {
  process.env.CALTRACK_API_ORIGIN = 'http://127.0.0.1:59998';
  const { req, res } = createMockReqRes({
    url: '/api/health',
    headers: { host: 'caltrack-web-six.vercel.app' }
  });
  await handler(req, res);
  assert.equal(res.statusCode, 502);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.code, 'UPSTREAM_UNAVAILABLE');
  assert.equal(parsed.error, 'Upstream API server unavailable.');
  assert.ok(!res.body.includes('127.0.0.1'));
  assert.ok(!res.body.includes('59998'));
});
