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

test('Stripe Integration Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  await t.test('POST /ingest/stripe-demo ingests Stripe event and preserves Stripe-Signature header', async () => {
    const stripeSignature = 't=1695500000,v1=abcdef1234567890abcdef1234567890';
    const stripePayload = {
      id: 'evt_stripe_integration_101',
      object: 'event',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_1Nxxx2eZvKYlo2C012345678',
          amount_paid: 4900,
          currency: 'usd',
          customer: 'cus_Nxxx12345678',
        },
      },
    };

    const res = await request(server, '/ingest/stripe-demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
      },
      body: stripePayload,
    });

    assert.strictEqual(res.status, 202);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.tunnelId, 'stripe-demo');
    assert.strictEqual(res.body.source, 'stripe');
    assert.ok(res.body.eventId);
  });
});
