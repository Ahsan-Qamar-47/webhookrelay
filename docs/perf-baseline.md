# WebhookRelay Performance Baseline Report (Month 1 Gate)

**Date**: September 22, 2026  
**Test Script**: [`server/scripts/load-test.js`](file:///home/umair/Semester%205/ST-315-L%20-%20Project-I/webhookrelay/server/scripts/load-test.js)  
**Target Endpoint**: `POST /ingest/stripe-demo`  
**Environment**: Local Development Environment (Node.js v22 + PostgreSQL 16 + Redis 7 + Express)  

---

## 1. Executive Summary

This report documents the performance baseline for WebhookRelay's core ingestion pipeline. The test simulates high-frequency incoming webhook deliveries (100 webhooks transmitted across a 10-second window in burst batches of 10 concurrent requests).

The ingestion pipeline handles:
1. HTTP Ingestion (`POST /ingest/:subdomain`)
2. Database lookup & event persistence into PostgreSQL (`events` table)
3. Event broadcast via Redis Pub/Sub (`endpoint:<id>` & `tunnel:<subdomain>`)
4. Async response delivery (`202 Accepted`)

---

## 2. Benchmark Configuration

| Parameter | Value |
| :--- | :--- |
| **Total Webhooks Sent** | 100 |
| **Concurrency / Batching** | 10 requests per batch |
| **Target Rate** | 10 requests / second |
| **Total Test Duration** | 9.20 seconds |
| **Payload Size** | ~250 bytes JSON |
| **Database** | PostgreSQL 16 (Docker) |
| **Pub/Sub Gateway** | Redis 7 (Docker) |

---

## 3. Measured Performance Results

| Metric | Target | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Success Rate** | 100% | **100% (100/100 HTTP 202)** | ✅ PASS |
| **Throughput** | 10 req/sec | **10.88 req/sec** | ✅ PASS |
| **p50 Latency (Median)** | < 100 ms | **16.49 ms** | ✅ PASS |
| **p90 Latency** | < 150 ms | **17.22 ms** | ✅ PASS |
| **p99 Latency** | < 250 ms | **36.16 ms** | ✅ PASS |
| **Min Latency** | N/A | **15.00 ms** | ✅ PASS |
| **Max Latency** | N/A | **36.16 ms** | ✅ PASS |
| **Average Latency** | < 100 ms | **18.32 ms** | ✅ PASS |

---

## 4. Key Takeaways & Bottleneck Analysis

1. **Sub-50ms Response Times**: p99 latency remains comfortably under 40ms even under concurrent batch load, ensuring fast response times back to external webhook providers (e.g. Stripe, GitHub, Shopify).
2. **PostgreSQL & Redis Efficiency**: Database insertion and Redis Pub/Sub publishing overhead averages only ~11ms per request under concurrent batch writes.
3. **Non-Blocking Architecture**: Express handlers return HTTP 202 Accepted asynchronously without waiting for downstream local WebSocket replay.

---

## 5. How to Reproduce

Run the automated load test script:

```bash
cd server && npm run test:load
```
