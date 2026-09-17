import test from 'node:test';
import assert from 'node:assert';
import { checkDbHealth, query } from '../src/config/db.js';

test('Database Connection Helper Unit Tests', async (t) => {
  await t.test('checkDbHealth returns healthy status and latency', async () => {
    const health = await checkDbHealth();
    assert.strictEqual(health.status, 'healthy');
    assert.ok(health.timestamp);
    assert.ok(typeof health.latency_ms === 'number');
  });

  await t.test('query helper executes SELECT query successfully', async () => {
    const res = await query('SELECT 1 + 1 AS result;');
    assert.strictEqual(res.rows[0].result, 2);
  });
});
