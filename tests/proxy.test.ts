import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/[...path].js';
import { EventEmitter } from 'events';

// Helper to create mock Vercel req/res objects
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

test('Vercel API Proxy - Returns 404 for non-/api routes', async () => {
  process.env.CALTRACK_API_ORIGIN = 'http://localhost:3001';
  const { req, res } = createMockReqRes({ url: '/dashboard' });
  await handler(req, res);
  assert.equal(res.statusCode, 404);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.code, 'NOT_FOUND');
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

test('Vercel API Proxy - Correct route mapping & header/query forwarding using a mock upstream server', async () => {
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
    } else if (receivedUrl === '/api/auth/login') {
      uRes.writeHead(200, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify({ token: 'mock-jwt-token', user: { email: 'admin@caltrack.com' } }));
    } else if (receivedUrl === '/api/calibrations?status=DUE&limit=5') {
      uRes.writeHead(204); // empty 204 No Content response
      uRes.end();
    } else {
      uRes.writeHead(404, { 'Content-Type': 'application/json' });
      uRes.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  await new Promise<void>((resolve) => upstreamServer.listen(0, '127.0.0.1', resolve));
  const address: any = upstreamServer.address();
  const testOrigin = `http://127.0.0.1:${address.port}`;
  process.env.CALTRACK_API_ORIGIN = testOrigin;

  try {
    // Test 1: /api/health -> upstream /health
    {
      const { req, res } = createMockReqRes({ url: '/api/health' });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/health');
      const data = JSON.parse(res.body);
      assert.equal(data.status, 'healthy');
    }

    // Test 2: /api/auth/login -> upstream /api/auth/login with POST body and headers
    {
      const { req, res } = createMockReqRes({
        url: '/api/auth/login',
        method: 'POST',
        headers: {
          host: 'caltrack-web-six.vercel.app',
          authorization: 'Bearer sample-token'
        },
        body: JSON.stringify({ email: 'admin@caltrack.com', password: 'secretpassword' })
      });
      await handler(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(receivedUrl, '/api/auth/login');
      assert.equal(receivedMethod, 'POST');
      assert.equal(receivedAuthHeader, 'Bearer sample-token');
      const data = JSON.parse(res.body);
      assert.equal(data.token, 'mock-jwt-token');
    }

    // Test 3: Query strings & 204 No Content response
    {
      const { req, res } = createMockReqRes({
        url: '/api/calibrations?status=DUE&limit=5',
        method: 'GET',
        headers: { host: 'caltrack-web-six.vercel.app' }
      });
      await handler(req, res);
      assert.equal(res.statusCode, 204);
      assert.equal(receivedUrl, '/api/calibrations?status=DUE&limit=5');
      assert.equal(res.body, '');
    }
  } finally {
    upstreamServer.close();
  }
});

test('Vercel API Proxy - Returns safe 502 error when upstream is unreachable', async () => {
  // Point to a non-existent port
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
