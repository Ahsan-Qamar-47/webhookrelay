import http from 'node:http';
import express from 'express';
import { query, pool } from '../src/config/db.js';
import { generateUniqueSubdomain } from '../src/utils/url.js';
import ingestRouter from '../src/routes/ingest.js';

// Setup isolated express test app for load testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/ingest', ingestRouter);

async function runLoadTest() {
  console.log('🚀 Starting WebhookRelay Ingestion Load Test (1,000 Events)...');

  // 1. Create a temporary load test user & endpoint in DB
  const userRes = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, 'hash_loadtest', 'Load Test User')
     ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING id;`,
    [`loadtest_${Date.now()}@webhookrelay.dev`]
  );
  const userId = userRes.rows[0].id;

  const subdomain = await generateUniqueSubdomain(10);
  const epRes = await query(
    `INSERT INTO endpoints (user_id, subdomain, destination_url, secret, is_active)
     VALUES ($1, $2, 'http://localhost:3000/webhook', 'whsec_loadtestsecret', true)
     RETURNING id, subdomain;`,
    [userId, subdomain]
  );
  const endpoint = epRes.rows[0];
  console.log(`✅ Provisioned load test tunnel endpoint: /ingest/${endpoint.subdomain}`);

  // 2. Start local HTTP server on random free port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const targetUrl = `http://127.0.0.1:${port}/ingest/${endpoint.subdomain}`;

  // 3. Prepare payload and load test variables
  const TOTAL_EVENTS = 1000;
  const CONCURRENCY = 25; // 25 parallel workers executing requests
  const latencies = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const payload = JSON.stringify({
    event: 'order.completed',
    amount: 149.99,
    currency: 'usd',
    customer: { id: 'cus_loadtest99', email: 'benchmark@webhookrelay.dev' },
    timestamp: new Date().toISOString(),
  });

  const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });

  function sendWebhook(index) {
    return new Promise((resolve) => {
      const startTime = process.hrtime.bigint();
      const req = http.request(
        targetUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'User-Agent': 'WebhookRelay-LoadTester/1.0',
            'X-Stripe-Signature': 't=1672531199,v1=mock_load_sig',
          },
          agent,
        },
        (res) => {
          res.resume();
          res.on('end', () => {
            const endTime = process.hrtime.bigint();
            const latencyMs = Number(endTime - startTime) / 1e6;
            latencies.push(latencyMs);

            if (res.statusCode === 202) {
              successfulRequests++;
            } else {
              failedRequests++;
            }
            resolve();
          });
        }
      );

      req.on('error', (err) => {
        const endTime = process.hrtime.bigint();
        const latencyMs = Number(endTime - startTime) / 1e6;
        latencies.push(latencyMs);
        failedRequests++;
        console.error(`Request ${index} failed:`, err.message);
        resolve();
      });

      req.write(payload);
      req.end();
    });
  }

  const startTimeOverall = Date.now();

  // Run requests in concurrent batches
  console.log(`⚡ Dispatching ${TOTAL_EVENTS} webhooks with concurrency factor ${CONCURRENCY}...`);
  for (let i = 0; i < TOTAL_EVENTS; i += CONCURRENCY) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY && (i + j) < TOTAL_EVENTS; j++) {
      batch.push(sendWebhook(i + j));
    }
    await Promise.all(batch);
  }

  const durationMs = Date.now() - startTimeOverall;
  const durationSec = durationMs / 1000;
  const rps = (successfulRequests / durationSec).toFixed(2);

  // 4. Verify DB ingestion accuracy
  const dbCheck = await query(
    'SELECT COUNT(*) FROM events WHERE endpoint_id = $1;',
    [endpoint.id]
  );
  const dbCount = parseInt(dbCheck.rows[0].count, 10);
  const eventsLost = TOTAL_EVENTS - dbCount;

  // Cleanup test endpoint, user & data
  await query('DELETE FROM events WHERE endpoint_id = $1;', [endpoint.id]);
  await query('DELETE FROM endpoints WHERE id = $1;', [endpoint.id]);
  await query('DELETE FROM users WHERE id = $1;', [userId]);
  server.close();
  agent.destroy();
  await pool.end();

  // 5. Calculate statistics & percentiles
  latencies.sort((a, b) => a - b);
  const minLatency = latencies[0].toFixed(2);
  const maxLatency = latencies[latencies.length - 1].toFixed(2);
  const avgLatency = (latencies.reduce((acc, curr) => acc + curr, 0) / latencies.length).toFixed(2);
  const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);

  console.log('\n==================================================');
  console.log('📊 WEBHOOKRELAY LOAD TEST RESULTS');
  console.log('==================================================');
  console.log(`Total Events Sent:       ${TOTAL_EVENTS}`);
  console.log(`Successful Ingestions:   ${successfulRequests} (202 Accepted)`);
  console.log(`Failed Requests:         ${failedRequests}`);
  console.log(`Events Persisted in DB:  ${dbCount} / ${TOTAL_EVENTS}`);
  console.log(`Events Lost:             ${eventsLost} (${((eventsLost / TOTAL_EVENTS) * 100).toFixed(2)}%)`);
  console.log(`Total Test Duration:     ${durationSec.toFixed(2)} seconds`);
  console.log(`Throughput:              ${rps} req/sec`);
  console.log('--------------------------------------------------');
  console.log(`Min Latency:             ${minLatency} ms`);
  console.log(`Average Latency:         ${avgLatency} ms`);
  console.log(`p50 Latency:             ${p50} ms`);
  console.log(`p95 Latency:             ${p95} ms`);
  console.log(`p99 Latency:             ${p99} ms`);
  console.log(`Max Latency:             ${maxLatency} ms`);
  console.log('==================================================\n');

  if (eventsLost === 0 && successfulRequests === TOTAL_EVENTS) {
    console.log('🎉 LOAD TEST PASSED: 100% Ingestion Reliability with Zero Data Loss!');
    process.exit(0);
  } else {
    console.error('❌ LOAD TEST FAILED: Data loss or request errors detected.');
    process.exit(1);
  }
}

runLoadTest().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
