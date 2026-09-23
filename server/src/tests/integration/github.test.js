import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../../app.js';

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

test('GitHub Integration Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  await t.test('POST /ingest/stripe-demo ingests GitHub push event and preserves X-GitHub-Event headers', async () => {
    const deliveryId = '7295a000-58c0-11ee-8765-abcdef123456';
    const githubPayload = {
      ref: 'refs/heads/main',
      before: '0000000000000000000000000000000000000000',
      after: '1111111111111111111111111111111111111111',
      repository: {
        id: 123456789,
        name: 'webhookrelay',
        html_url: 'https://github.com/user/webhookrelay',
      },
      pusher: {
        name: 'devuser',
        email: 'devuser@example.com',
      },
    };

    const res = await request(server, '/ingest/stripe-demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'push',
        'X-GitHub-Delivery': deliveryId,
        'X-Hub-Signature-256': 'sha256=abcdef1234567890',
        'User-Agent': 'GitHub-Hookshot/abc1234',
      },
      body: githubPayload,
    });

    assert.strictEqual(res.status, 202);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.tunnelId, 'stripe-demo');
    assert.strictEqual(res.body.source, 'github');
    assert.ok(res.body.eventId);
  });
});
