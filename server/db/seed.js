import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://relay:relay_pass@localhost:5434/webhookrelay',
});

async function seed() {
  console.log('🌱 Seeding WebhookRelay database...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert Demo User
    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('demo@webhookrelay.dev', '$2b$10$e8c1b9a7f5d4e3c2b1a0e.demohashvalueforlocaldevtesting', 'Demo Developer', 'admin')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const userId = userRes.rows[0].id;
    console.log(`✅ Demo User created/updated with ID: ${userId}`);

    // 2. Insert Demo Subscription
    await client.query(`
      INSERT INTO subscriptions (user_id, plan, status)
      VALUES ($1, 'team', 'active')
      ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status;
    `, [userId]);
    console.log('✅ Demo Subscription created (Team plan)');

    // 3. Insert Demo API Token
    await client.query(`
      INSERT INTO api_tokens (user_id, name, token_hash)
      VALUES ($1, 'CLI Development Token', 'hash_demo_token_998877665544332211')
      ON CONFLICT (token_hash) DO NOTHING;
    `, [userId]);
    console.log('✅ Demo API Token created');

    // 4. Insert Demo Endpoint
    const endpointRes = await client.query(`
      INSERT INTO endpoints (user_id, subdomain, destination_url, secret, is_active)
      VALUES ($1, 'stripe-demo', 'http://localhost:3000/api/webhooks/stripe', 'whsec_demo_secret_key_12345', true)
      ON CONFLICT (subdomain) DO UPDATE SET destination_url = EXCLUDED.destination_url
      RETURNING id;
    `, [userId]);
    const endpointId = endpointRes.rows[0].id;
    console.log(`✅ Demo Endpoint created/updated with ID: ${endpointId} (subdomain: stripe-demo)`);

    // 5. Insert Demo Events
    const event1Res = await client.query(`
      INSERT INTO events (
        endpoint_id, event_id, provider, method, headers, payload, ip_address, status, response_status, response_body, latency_ms
      ) VALUES (
        $1,
        'evt_101_stripe_payment',
        'stripe',
        'POST',
        '{"content-type": "application/json", "stripe-signature": "t=1600000,v1=demo_sig"}'::jsonb,
        '{"id": "evt_101_stripe_payment", "type": "payment_intent.succeeded", "data": {"object": {"amount": 4900, "currency": "usd"}}}'::jsonb,
        '54.187.205.12',
        'relayed',
        200,
        '{"status": "success", "received": true}',
        32
      ) RETURNING id;
    `, [endpointId]);
    const eventId1 = event1Res.rows[0].id;

    await client.query(`
      INSERT INTO events (
        endpoint_id, event_id, provider, method, headers, payload, ip_address, status, response_status, response_body, latency_ms
      ) VALUES (
        $1,
        'evt_102_github_push',
        'github',
        'POST',
        '{"content-type": "application/json", "x-github-event": "push"}'::jsonb,
        '{"ref": "refs/heads/main", "commits": [{"id": "abc123", "message": "feat: add webhook relay engine"}]}'::jsonb,
        '140.82.115.1',
        'relayed',
        200,
        '{"status": "ok"}',
        24
      );
    `, [endpointId]);
    console.log('✅ Demo Events created (Stripe payment_intent & GitHub push)');

    // 6. Insert Demo Replay Log
    await client.query(`
      INSERT INTO replay_logs (
        event_id, user_id, target_url, status_code, response_body, latency_ms
      ) VALUES (
        $1,
        $2,
        'http://localhost:3000/api/webhooks/stripe',
        200,
        '{"status": "success", "replayed": true}',
        28
      );
    `, [eventId1, userId]);
    console.log('✅ Demo Replay Log created');

    await client.query('COMMIT');
    console.log('🚀 Database seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
