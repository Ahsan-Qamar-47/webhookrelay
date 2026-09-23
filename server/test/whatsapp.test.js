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

test('WhatsApp Webhook Integration Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  await t.test('GET /ingest/stripe-demo returns 403 Forbidden when verify token mismatches', async () => {
    const res = await request(
      server,
      '/ingest/stripe-demo?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_123456',
      { method: 'GET' }
    );
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VERIFICATION_FAILED');
  });

  await t.test('GET /ingest/stripe-demo returns 200 OK + challenge when verify token matches endpoint secret', async () => {
    const challengeStr = 'test_challenge_123456';
    const res = await request(
      server,
      `/ingest/stripe-demo?hub.mode=subscribe&hub.verify_token=whsec_demo_secret_key_12345&hub.challenge=${challengeStr}`,
      { method: 'GET' }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body, challengeStr);
  });

  await t.test('POST /ingest/stripe-demo ingests incoming WhatsApp message payload', async () => {
    const whatsappPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '100657345678901',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550239876',
                  phone_number_id: '109876543210987',
                },
                contacts: [{ profile: { name: 'Alice Test' }, wa_id: '15551234567' }],
                messages: [
                  {
                    from: '15551234567',
                    id: 'wamid.HBgLMTU1NTEyMzQ1NjcVAgARGBI1RkUzRTRCNkQ3OENBRDYzAA==',
                    timestamp: '1695500000',
                    text: { body: 'Hello from WhatsApp Webhook test!' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const res = await request(server, '/ingest/stripe-demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'facebookexternalua',
        'X-Hub-Signature-256': 'sha256=mocked_hash_for_test',
      },
      body: whatsappPayload,
    });

    assert.strictEqual(res.status, 202);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.tunnelId, 'stripe-demo');
    assert.strictEqual(res.body.status, 'pending');
  });
});
