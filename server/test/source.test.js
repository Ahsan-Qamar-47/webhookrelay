import test from 'node:test';
import assert from 'node:assert';
import { detectSource } from '../src/utils/source.js';

test('Source Detection Utility Unit Tests', async (t) => {
  await t.test('detects Stripe webhooks via Stripe-Signature header', () => {
    const result = detectSource({ 'Stripe-Signature': 't=123,v1=abc' });
    assert.strictEqual(result, 'stripe');
  });

  await t.test('detects Stripe webhooks via User-Agent', () => {
    const result = detectSource({ 'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)' });
    assert.strictEqual(result, 'stripe');
  });

  await t.test('detects GitHub webhooks via X-GitHub-Event header', () => {
    const result = detectSource({ 'X-GitHub-Event': 'push', 'User-Agent': 'GitHub-Hookshot/abc123' });
    assert.strictEqual(result, 'github');
  });

  await t.test('detects WhatsApp webhooks via X-Hub-Signature-256 header', () => {
    const result = detectSource({ 'X-Hub-Signature-256': 'sha256=12345' });
    assert.strictEqual(result, 'whatsapp');
  });

  await t.test('detects WhatsApp webhooks via hub.mode query param', () => {
    const result = detectSource({}, { 'hub.mode': 'subscribe' });
    assert.strictEqual(result, 'whatsapp');
  });

  await t.test('detects Slack webhooks via User-Agent Slackbot', () => {
    const result = detectSource({ 'User-Agent': 'Slackbot 1.0 (+https://api.slack.com/robots)' });
    assert.strictEqual(result, 'slack');
  });

  await t.test('detects Slack webhooks via X-Slack-Signature', () => {
    const result = detectSource({ 'x-slack-signature': 'v0=abc123' });
    assert.strictEqual(result, 'slack');
  });

  await t.test('detects Shopify webhooks via X-Shopify-Topic', () => {
    const result = detectSource({ 'X-Shopify-Topic': 'orders/create' });
    assert.strictEqual(result, 'shopify');
  });

  await t.test('detects Twilio webhooks via X-Twilio-Signature', () => {
    const result = detectSource({ 'X-Twilio-Signature': 'abc12345' });
    assert.strictEqual(result, 'twilio');
  });

  await t.test('returns generic for unrecognized request signatures', () => {
    const result = detectSource({ 'Content-Type': 'application/json' });
    assert.strictEqual(result, 'generic');
  });
});
