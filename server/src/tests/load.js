import http from 'node:http';
import app from '../app.js';
import { query } from '../config/db.js';

const TOTAL_REQUESTS = 100;
const DURATION_SECONDS = 10;
const DELAY_BETWEEN_BATCHES_MS = (DURATION_SECONDS * 1000) / (TOTAL_REQUESTS / 10); // 10 batches of 10 requests

/**
 * Helper to calculate percentile from sorted numbers array
 */
function getPercentile(sortedArr, percentile) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

async function ensureSeedEndpoint() {
  try {
    const res = await query("SELECT subdomain FROM endpoints WHERE subdomain = 'stripe-demo';");
    if (res.rows.length === 0) {
      // Insert fallback endpoint for testing
      const userRes = await query("SELECT id FROM users LIMIT 1;");
      let userId;
      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const newUser = await query(
          "INSERT INTO users (email, password_hash, name) VALUES ('loadtest@dev.com', 'hash', 'Load Tester') RETURNING id;"
        );
        userId = newUser.rows[0].id;
      }
      await query(
        "INSERT INTO endpoints (user_id, subdomain, destination_url, secret, is_active) VALUES ($1, 'stripe-demo', 'http://localhost:3000/webhook', 'secret', true) ON CONFLICT DO NOTHING;",
        [userId]
      );
    }
  } catch (err) {
    console.error('Warning: could not seed test endpoint:', err.message);
  }
}

async function runLoadTest() {
  await ensureSeedEndpoint();

  // Start HTTP server instance on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const targetUrl = `http://localhost:${port}/ingest/stripe-demo`;

  console.log(`\n🚀 Starting Load Test: Sending ${TOTAL_REQUESTS} webhooks to ${targetUrl} over ${DURATION_SECONDS} seconds...\n`);

  const latencies = [];
  let successCount = 0;
  let failureCount = 0;

  const startTime = Date.now();

  const sendRequest = (index) => {
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        event: 'payment_intent.succeeded',
        load_test_index: index,
        amount: Math.floor(Math.random() * 10000),
        currency: 'usd',
        timestamp: new Date().toISOString(),
      });

      const reqStart = process.hrtime.bigint();

      const req = http.request(
        targetUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Stripe-Signature': `t=${Date.now()},v1=sig_${index}`,
            'User-Agent': 'WebhookRelay-LoadTest/1.0',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            const reqEnd = process.hrtime.bigint();
            const latencyMs = Number(reqEnd - reqStart) / 1e6;

            if (res.statusCode === 202) {
              successCount++;
              latencies.push(latencyMs);
            } else {
              failureCount++;
              console.error(`Request ${index} failed with status ${res.statusCode}: ${body}`);
            }
            resolve();
          });
        }
      );

      req.on('error', (err) => {
        failureCount++;
        console.error(`Request ${index} errored: ${err.message}`);
        resolve();
      });

      req.write(payload);
      req.end();
    });
  };

  // Send 10 batches of 10 requests spaced evenly across 10 seconds
  const BATCH_SIZE = 10;
  const NUM_BATCHES = TOTAL_REQUESTS / BATCH_SIZE;

  for (let b = 0; b < NUM_BATCHES; b++) {
    const batchPromises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const reqIndex = b * BATCH_SIZE + i + 1;
      batchPromises.push(sendRequest(reqIndex));
    }
    await Promise.all(batchPromises);
    if (b < NUM_BATCHES - 1) {
      await new Promise((res) => setTimeout(res, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  const totalTimeMs = Date.now() - startTime;
  server.close();

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const minLatency = latencies.length > 0 ? latencies[0] : 0;
  const maxLatency = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p50 = getPercentile(latencies, 50);
  const p90 = getPercentile(latencies, 90);
  const p99 = getPercentile(latencies, 99);
  const rps = (successCount / (totalTimeMs / 1000)).toFixed(2);

  const report = {
    totalRequests: TOTAL_REQUESTS,
    successCount,
    failureCount,
    totalTimeMs: Number(totalTimeMs.toFixed(2)),
    rps: Number(rps),
    minLatencyMs: Number(minLatency.toFixed(2)),
    maxLatencyMs: Number(maxLatency.toFixed(2)),
    avgLatencyMs: Number(avgLatency.toFixed(2)),
    p50LatencyMs: Number(p50.toFixed(2)),
    p90LatencyMs: Number(p90.toFixed(2)),
    p99LatencyMs: Number(p99.toFixed(2)),
  };

  console.log('================ LOAD TEST RESULTS ================');
  console.log(`Total Requests Sent : ${report.totalRequests}`);
  console.log(`Successful (202)    : ${report.successCount}`);
  console.log(`Failed              : ${report.failureCount}`);
  console.log(`Total Elapsed Time  : ${report.totalTimeMs} ms (${(totalTimeMs / 1000).toFixed(2)}s)`);
  console.log(`Throughput          : ${report.rps} req/sec`);
  console.log('---------------- LATENCY METRICS ----------------');
  console.log(`Min Latency         : ${report.minLatencyMs} ms`);
  console.log(`Average Latency     : ${report.avgLatencyMs} ms`);
  console.log(`p50 Latency (Median): ${report.p50LatencyMs} ms`);
  console.log(`p90 Latency         : ${report.p90LatencyMs} ms`);
  console.log(`p99 Latency         : ${report.p99LatencyMs} ms`);
  console.log(`Max Latency         : ${report.maxLatencyMs} ms`);
  console.log('===================================================\n');

  process.exit(failureCount === 0 ? 0 : 1);
}

runLoadTest().catch((err) => {
  console.error('Fatal error running load test:', err);
  process.exit(1);
});
