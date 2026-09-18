import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../src/app.js';

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(`http://localhost:${addr.port}${path}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        if (data) {
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
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

test('Server middleware and routes', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  await t.test('GET /health returns 200 with ok status and X-Request-Id header', async () => {
    const res = await request(server, '/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(res.body.timestamp);
    assert.ok(res.headers['x-request-id']);
  });

  await t.test('POST /ingest/stripe-demo returns 202 accepted', async () => {
    const res = await request(server, '/ingest/stripe-demo', { method: 'POST' });
    assert.strictEqual(res.status, 202);
    assert.strictEqual(res.body.tunnelId, 'stripe-demo');
    assert.strictEqual(res.body.message, 'Webhook received');
  });

  await t.test('GET /unknown-route returns 404 JSON error response', async () => {
    const res = await request(server, '/unknown-route');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Not Found');
    assert.strictEqual(res.body.path, '/unknown-route');
  });

  await t.test('GET /api/docs/ serves Swagger UI documentation', async () => {
    const res = await request(server, '/api/docs/');
    assert.ok(res.status === 200 || res.status === 301);
  });
});
