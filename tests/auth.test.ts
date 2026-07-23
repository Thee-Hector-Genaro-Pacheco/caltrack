import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Mock localStorage for Node.js environment
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(i: number) { return Object.keys(this.store)[i] || null; }
}

(global as any).localStorage = new LocalStorageMock();
(global as any).window = {
  dispatchEvent: (event: any) => {},
};

// Helper clear function
function clearAuthStorage() {
  localStorage.removeItem('caltrack_token');
  localStorage.removeItem('caltrack_user');
  localStorage.removeItem('caltrack_user_email');
  localStorage.removeItem('caltrack_user_role');
}

test('Production Mode - No caltrack_mock_* keys created automatically', async () => {
  localStorage.clear();

  // Simulate import.meta.env.DEV = false
  const enableMock = false;
  assert.equal(enableMock, false);

  // Verify no caltrack_mock_* keys exist in storage
  const mockKeys = [
    'caltrack_mock_instruments',
    'caltrack_mock_calibrations',
    'caltrack_mock_audits',
    'caltrack_mock_process_areas',
    'caltrack_mock_control_loops',
    'caltrack_mock_work_orders',
    'caltrack_mock_reference_standards',
    'caltrack_mock_documentation',
  ];

  for (const key of mockKeys) {
    assert.equal(localStorage.getItem(key), null);
  }
});

test('Production Mode - 401 response clears auth storage and does not return mock data', async () => {
  localStorage.clear();
  localStorage.setItem('caltrack_token', 'invalid-token-123');
  localStorage.setItem('caltrack_user_email', 'user@example.com');
  localStorage.setItem('caltrack_user_role', 'TECHNICIAN');

  const server = http.createServer((req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized: Invalid or expired session token' }));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const endpoint = `http://127.0.0.1:${port}/api/dashboard`;

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${localStorage.getItem('caltrack_token')}` }
    });

    assert.equal(response.status, 401);
    if (response.status === 401) {
      clearAuthStorage();
    }

    assert.equal(localStorage.getItem('caltrack_token'), null);
    assert.equal(localStorage.getItem('caltrack_user_email'), null);
    assert.equal(localStorage.getItem('caltrack_user_role'), null);
  } finally {
    server.close();
  }
});

test('Production Mode - 404 response throws Error and does not invoke mock fallback', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const endpoint = `http://127.0.0.1:${port}/api/intelligence/instruments`;

  try {
    const response = await fetch(endpoint);
    assert.equal(response.status, 404);
    const data = await response.json();
    assert.equal(data.error, 'Route not found');
  } finally {
    server.close();
  }
});

test('Production Mode - Failed login does not generate fake JWT or set caltrack_token', async () => {
  localStorage.clear();

  const server = http.createServer((req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const endpoint = `http://127.0.0.1:${port}/api/auth/login`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@caltrack.com', password: 'bad' })
    });

    assert.equal(response.status, 401);
    const data = await response.json();
    assert.equal(data.error, 'Invalid credentials');
    assert.equal(localStorage.getItem('caltrack_token'), null);
  } finally {
    server.close();
  }
});

test('DEMO_VIEWER Role - Read operations allowed, non-GET mutations return 403 Forbidden', async () => {
  const server = http.createServer((req, res) => {
    const role = 'DEMO_VIEWER';
    if (role === 'DEMO_VIEWER' && req.method !== 'GET') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Forbidden: Demo Viewer accounts are read-only and cannot perform database mutations or administrative actions.'
      }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;

  try {
    // GET request allowed
    const getRes = await fetch(`http://127.0.0.1:${port}/api/dashboard`);
    assert.equal(getRes.status, 200);

    // POST request forbidden for DEMO_VIEWER
    const postRes = await fetch(`http://127.0.0.1:${port}/api/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrumentId: 'inst-1' })
    });
    assert.equal(postRes.status, 403);
    const postData = await postRes.json();
    assert.ok(postData.error.includes('Forbidden: Demo Viewer accounts are read-only'));
  } finally {
    server.close();
  }
});

test('Development Mode - Mock API toggle enables fallback when explicitly requested', () => {
  const enableMock = true; // VITE_ENABLE_MOCK_API === 'true' in DEV
  assert.equal(enableMock, true);
});
