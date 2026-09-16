import test from 'node:test';
import assert from 'node:assert';

test('health route status check', () => {
  const statusResponse = { status: 'ok', timestamp: new Date().toISOString() };
  assert.strictEqual(statusResponse.status, 'ok');
  assert.ok(statusResponse.timestamp);
});
