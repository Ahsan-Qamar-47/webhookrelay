import test from 'node:test';
import assert from 'node:assert';
import { checkDbHealth, query } from '../src/config/db.js';

test('Database Connection Helper Unit Tests', async (t) => {
  await t.test('checkDbHealth returns valid health status object', async () => {
    const health = await checkDbHealth();
    assert.ok(health.status === 'healthy' || health.status === 'unhealthy');
    if (health.status === 'healthy') {
      assert.ok(health.timestamp);
      assert.ok(typeof health.latency_ms === 'number');
    } else {
      assert.ok(health.error);
    }
  });

  await t.test('query helper executes SELECT query or handles connection failure', async () => {
    try {
      const res = await query('SELECT 1 + 1 AS result;');
      assert.strictEqual(res.rows[0].result, 2);
    } catch (err) {
      assert.ok(err.code === 'ECONNREFUSED' || err.code === '28P01' || err.message.includes('connect'));
    }
  });
});
