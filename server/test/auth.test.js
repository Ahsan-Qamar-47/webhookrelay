import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const reqOptions = {
      hostname: 'localhost',
      port: addr.port,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body = null;
        if (data) {
          try {
            body = JSON.parse(data);
          } catch {
            body = data;
          }
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('Authentication Endpoints & Middleware Integration Tests', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  const testEmail = `auth_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = '';

  await t.test('POST /api/auth/signup validates invalid input', async () => {
    const res = await request(server, '/api/auth/signup', {
      method: 'POST',
      body: { email: 'invalid-email', password: 'short' },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /api/auth/signup registers a new user successfully', async () => {
    const res = await request(server, '/api/auth/signup', {
      method: 'POST',
      body: { email: testEmail, password: testPassword, name: 'Auth Test User' },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testEmail);
    assert.strictEqual(res.body.data.user.name, 'Auth Test User');
    authToken = res.body.data.token;
  });

  await t.test('POST /api/auth/signup returns 409 Conflict for existing email', async () => {
    const res = await request(server, '/api/auth/signup', {
      method: 'POST',
      body: { email: testEmail, password: testPassword, name: 'Duplicate User' },
    });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'USER_EXISTS');
  });

  await t.test('POST /api/auth/login fails with wrong password', async () => {
    const res = await request(server, '/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'WrongPassword999!' },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  await t.test('POST /api/auth/login succeeds with correct credentials', async () => {
    const res = await request(server, '/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: testPassword },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testEmail);
  });

  await t.test('GET /api/me fails without Authorization header', async () => {
    const res = await request(server, '/api/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  await t.test('GET /api/me succeeds with valid Bearer token', async () => {
    const res = await request(server, '/api/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, testEmail);
    assert.ok(res.body.data.subscription);
  });
});
