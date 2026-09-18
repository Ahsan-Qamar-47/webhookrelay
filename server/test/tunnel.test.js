import test from 'node:test';
import assert from 'node:assert';
import { WebSocketServer, WebSocket } from 'ws';
import request from 'supertest';
import app from '../src/app.js';
import setupTunnel from '../src/ws/tunnel.js';
import { closeRedis } from '../src/config/redis.js';

test('Ingest -> PG -> Redis -> WebSocket E2E Integration Tests', async (t) => {
  // 1. Setup WS Server instance for testing
  const wsPort = 8089;
  const wss = new WebSocketServer({ port: wsPort });
  setupTunnel(wss);

  t.after(async () => {
    await new Promise((resolve) => wss.close(resolve));
    await closeRedis();
  });

  const testEmail = `ws_e2e_${Date.now()}@example.com`;
  let userToken = '';
  let subdomain = '';

  // 2. Signup User & Provision Endpoint
  await t.test('Setup User & Provision Endpoint', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'Password123!', name: 'WS E2E User' });

    assert.strictEqual(signupRes.status, 201);
    userToken = signupRes.body.data.token;

    const epRes = await request(app)
      .post('/api/endpoints')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ destination_url: 'http://localhost:3000/api/webhooks' });

    assert.strictEqual(epRes.status, 201);
    subdomain = epRes.body.data.subdomain;
    assert.ok(subdomain);
  });

  // 3. Connect WebSocket & Handshake
  await t.test('WebSocket HANDSHAKE and ACK framing', async () => {
    const client = new WebSocket(`ws://localhost:${wsPort}`);

    await new Promise((resolve, reject) => {
      client.on('open', () => {
        client.send(JSON.stringify({
          type: 'HANDSHAKE',
          payload: {
            token: userToken,
            subdomain,
          },
        }));
      });

      client.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ACK') {
          assert.strictEqual(msg.payload.status, 'connected');
          assert.strictEqual(msg.payload.subdomain, subdomain);
          client.close();
          resolve();
        } else if (msg.type === 'ERROR') {
          reject(new Error(msg.payload.message));
        }
      });

      client.on('error', reject);
    });
  });

  // 4. Full Ingest -> Redis -> WS Event Stream Test
  await t.test('Full Ingest -> PG -> Redis -> WS Event Stream & REPLAY_RESULT', async () => {
    const client = new WebSocket(`ws://localhost:${wsPort}`);

    await new Promise((resolve, reject) => {
      client.on('open', () => {
        // Send Handshake
        client.send(JSON.stringify({
          type: 'HANDSHAKE',
          payload: {
            token: userToken,
            subdomain,
          },
        }));
      });

      client.on('message', async (raw) => {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'ACK') {
          // Handshake acknowledged, trigger HTTP POST /ingest/:subdomain
          await request(app)
            .post(`/ingest/${subdomain}`)
            .set('Stripe-Signature', 't=160000,v1=demo_sig')
            .send({ id: 'evt_stripe_test_100', amount: 9900, currency: 'usd' })
            .expect(202);
        } else if (msg.type === 'EVENT') {
          assert.strictEqual(msg.payload.subdomain, subdomain);
          assert.strictEqual(msg.payload.body.amount, 9900);

          // Return REPLAY_RESULT frame back to server
          client.send(JSON.stringify({
            type: 'REPLAY_RESULT',
            payload: {
              event_id: msg.payload.event_id,
              status_code: 200,
              headers: { 'content-type': 'application/json' },
              body: '{"received": true}',
              latency_ms: 18,
            },
          }));

          // Give server a short moment to process result frame before closing
          setTimeout(() => {
            client.close();
            resolve();
          }, 100);
        }
      });

      client.on('error', reject);
    });
  });
});
