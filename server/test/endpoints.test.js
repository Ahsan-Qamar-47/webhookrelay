import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('Endpoints & Tokens Integration Tests (Supertest)', async (t) => {
  const testEmail = `ep_test_${Date.now()}@example.com`;
  let token = '';
  let endpointId = '';
  let tokenId = '';

  // 0. Register user to get JWT token
  await t.test('Setup test user account', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'Password123!', name: 'Endpoints Tester' });

    assert.strictEqual(res.status, 201);
    token = res.body.data.token;
  });

  // 1. ENDPOINTS CRUD TESTS
  await t.test('POST /api/endpoints provisions new endpoint with generated subdomain', async () => {
    const res = await request(app)
      .post('/api/endpoints')
      .set('Authorization', `Bearer ${token}`)
      .send({ destination_url: 'http://localhost:3000/webhooks' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.subdomain);
    assert.ok(res.body.data.public_url.includes(res.body.data.subdomain));
    endpointId = res.body.data.id;
  });

  await t.test('GET /api/endpoints lists user endpoints', async () => {
    const res = await request(app)
      .get('/api/endpoints')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
  });

  await t.test('GET /api/endpoints/:id retrieves endpoint details', async () => {
    const res = await request(app)
      .get(`/api/endpoints/${endpointId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, endpointId);
    assert.strictEqual(res.body.data.destination_url, 'http://localhost:3000/webhooks');
  });

  await t.test('POST /api/endpoints/:id/reset rotates subdomain & secret', async () => {
    const oldRes = await request(app)
      .get(`/api/endpoints/${endpointId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(oldRes.status, 200);
    assert.ok(oldRes.body && oldRes.body.data, 'Endpoint data should exist');
    const oldSubdomain = oldRes.body.data.subdomain;

    const res = await request(app)
      .post(`/api/endpoints/${endpointId}/reset`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.notStrictEqual(res.body.data.subdomain, oldSubdomain);
  });

  await t.test('DELETE /api/endpoints/:id removes endpoint', async () => {
    const res = await request(app)
      .delete(`/api/endpoints/${endpointId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Verify GET now returns 404
    const getRes = await request(app)
      .get(`/api/endpoints/${endpointId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(getRes.status, 404);
  });

  // 2. API TOKENS MANAGEMENT TESTS
  await t.test('POST /api/tokens generates new API token (unhashed returned once)', async () => {
    const res = await request(app)
      .post('/api/tokens')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'CLI Development Laptop' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.token.startsWith('whr_token_'));
    tokenId = res.body.data.id;
  });

  await t.test('GET /api/tokens lists user tokens masked', async () => {
    const res = await request(app)
      .get('/api/tokens')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((t) => t.id === tokenId && t.masked_token.startsWith('whr_token_****')));
  });

  await t.test('DELETE /api/tokens/:id revokes API token', async () => {
    const res = await request(app)
      .delete(`/api/tokens/${tokenId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});
