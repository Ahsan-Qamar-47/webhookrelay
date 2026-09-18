import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('Auth Integration Tests (Supertest)', async (t) => {
  const testEmail = `supertest_auth_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = '';

  await t.test('POST /api/auth/signup returns 400 on invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'invalid-email', password: 'short' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /api/auth/signup returns 201 + token on valid signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword, name: 'Supertest User' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testEmail);
    authToken = res.body.data.token;
  });

  await t.test('POST /api/auth/signup returns 409 Conflict on duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword, name: 'Duplicate User' });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'USER_EXISTS');
  });

  await t.test('POST /api/auth/login returns 401 on bad password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword999!' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  await t.test('POST /api/auth/login returns 200 + token on correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testEmail);
  });

  await t.test('GET /api/me returns 401 without auth token', async () => {
    const res = await request(app).get('/api/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('GET /api/me returns 200 + user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, testEmail);
  });
});
