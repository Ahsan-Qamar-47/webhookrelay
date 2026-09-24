import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://relay:relay_pass@localhost:5434/webhookrelay',
});

async function seed() {
  console.log('🌱 Seeding WebhookRelay database for Demo Environment (Day 35)...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert / Update Demo User (email: demo@webhookrelay.dev, password: password123)
    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('demo@webhookrelay.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Demo Developer', 'admin')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const userId = userRes.rows[0].id;
    console.log(`✅ Demo User created/updated with ID: ${userId}`);

    // 2. Insert Demo Subscription (Team Plan)
    await client.query(`
      INSERT INTO subscriptions (user_id, plan, status)
      VALUES ($1, 'team', 'active')
      ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status;
    `, [userId]);
    console.log('✅ Demo Subscription created (Team plan)');

    // 3. Insert Demo API Token
    await client.query(`
      INSERT INTO api_tokens (user_id, name, token_hash)
      VALUES ($1, 'Demo CLI Secret Token', 'hash_demo_token_998877665544332211')
      ON CONFLICT (token_hash) DO NOTHING;
    `, [userId]);
    console.log('✅ Demo API Token created');

    // 4. Insert / Update Demo Endpoint (stripe-demo)
    const endpointRes = await client.query(`
      INSERT INTO endpoints (user_id, subdomain, destination_url, secret, is_active)
      VALUES ($1, 'stripe-demo', 'http://localhost:3000/api/webhooks/stripe', 'whsec_demo_secret_key_12345', true)
      ON CONFLICT (subdomain) DO UPDATE SET destination_url = EXCLUDED.destination_url, secret = EXCLUDED.secret
      RETURNING id;
    `, [userId]);
    const endpointId = endpointRes.rows[0].id;
    console.log(`✅ Demo Endpoint created/updated with ID: ${endpointId} (subdomain: stripe-demo)`);

    // 5. Insert Multi-Provider Seed Webhook Events
    const now = new Date();

    // Event 1: Stripe invoice.paid
    const evt1 = await client.query(`
      INSERT INTO events (
        endpoint_id, event_id, provider, source, method, headers, payload, ip_address, status, response_status, response_body, latency_ms, received_at
      ) VALUES (
        $1,
        'evt_stripe_101',
        'stripe',
        'stripe',
        'POST',
        '{"host": "relay.local:8080", "content-type": "application/json", "stripe-signature": "t=1672531199,v1=99a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4", "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)"}'::jsonb,
        '{"id": "in_1M001A2eZvKYlo2C9990123", "object": "event", "type": "invoice.paid", "data": {"object": {"id": "in_1M001A", "amount_paid": 4900, "currency": "usd", "customer": "cus_N1892837492", "customer_email": "alex.developer@example.com", "paid": true, "status": "paid"}}}'::jsonb,
        '54.187.205.12',
        'completed',
        200,
        '{"received": true, "status": "processed"}',
        18,
        $2
      ) RETURNING id;
    `, [endpointId, new Date(now - 1000 * 60 * 15)]);

    const eventId1 = evt1.rows[0].id;

    // Event 2: GitHub push
    await client.query(`
      INSERT INTO events (
        endpoint_id, event_id, provider, source, method, headers, payload, ip_address, status, response_status, response_body, latency_ms, received_at
      ) VALUES (
        $1,
        'evt_github_102',
        'github',
        'github',
        'POST',
        '{"host": "relay.local:8080", "content-type": "application/json", "x-github-event": "push", "x-github-delivery": "72d31b00-8252-11ed-8b1e-2321946059d6", "user-agent": "GitHub-Hookshot/f31c89f"}'::jsonb,
        '{"ref": "refs/heads/main", "before": "61108f88b5b21e24c05c3f000000000000000000", "after": "0000000000000000000000000000000000000000", "repository": {"name": "webhookrelay", "full_name": "Ahsan-Qamar-47/webhookrelay", "html_url": "https://github.com/Ahsan-Qamar-47/webhookrelay"}, "pusher": {"name": "ahsanqamar", "email": "ahsan@dev.org"}, "commits": [{"id": "b35878d", "message": "feat: prototype assembly and onboarding wizard"}]}'::jsonb,
        '140.82.115.1',
        'completed',
        200,
        '{"status": "build_queued"}',
        24,
        $2
      );
    `, [endpointId, new Date(now - 1000 * 60 * 10)]);

    // Event 3: WhatsApp inbound message
    await client.query(`
      INSERT INTO events (
        endpoint_id, event_id, provider, source, method, headers, payload, ip_address, status, response_status, response_body, latency_ms, received_at
      ) VALUES (
        $1,
        'evt_whatsapp_103',
        'whatsapp',
        'whatsapp',
        'POST',
        '{"host": "relay.local:8080", "content-type": "application/json", "x-hub-signature-256": "sha256=a1b2c3d4e5f67890", "user-agent": "facebookexternalua"}'::jsonb,
        '{"object": "whatsapp_business_account", "entry": [{"id": "1098273645", "changes": [{"value": {"messaging_product": "whatsapp", "metadata": {"display_phone_number": "15550198", "phone_number_id": "100293847"}, "messages": [{"from": "15550123", "id": "wamid.HBgLMTU1NTAxMjM", "text": {"body": "Status query for order #99281"}, "type": "text"}]}}]}]}'::jsonb,
        '31.13.71.1',
        'completed',
        200,
        '{"status": "message_received"}',
        14,
        $2
      );
    `, [endpointId, new Date(now - 1000 * 60 * 5)]);

    console.log('✅ Demo Events created (Stripe invoice.paid, GitHub push, WhatsApp message)');

    // 6. Insert Demo Replay Log
    await client.query(`
      INSERT INTO replay_logs (
        event_id, user_id, target_url, status_code, response_body, latency_ms, replayed_at
      ) VALUES (
        $1,
        $2,
        'http://localhost:3000/api/webhooks/stripe',
        200,
        '{"status": "success", "replayed": true, "timestamp": "2026-10-24T12:00:00Z"}',
        22,
        CURRENT_TIMESTAMP
      );
    `, [eventId1, userId]);
    console.log('✅ Demo Replay Log created');

    await client.query('COMMIT');
    console.log('🚀 Demo Database seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding demo database:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
