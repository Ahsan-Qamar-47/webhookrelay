# Changelog

All notable changes to the Webhook Relay project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-month1] - 2026-09-22

### 🎉 Month 1 Deliverable Gate Release — Tunnel Server & WebSocket Client Gateway

#### ✨ Added
- **Core Ingestion Gateway**: High-throughput Express HTTP ingestion route (`POST /ingest/:subdomain`) returning HTTP 202 Accepted.
- **Go CLI Client Engine**: Cobra-based CLI binary (`relay connect`, `relay login`, `relay status`, `relay version`) with `gorilla/websocket` client and exponential backoff auto-reconnection (1s–30s).
- **Local HTTP Replayer Engine**: Forwarding engine for replaying incoming webhook frames to local HTTP target applications (`http://localhost:<port>`).
- **End-to-End Request ID Propagation**: Automatic `X-Request-ID` correlation across HTTP ingress, Redis Pub/Sub payloads, WebSocket frames, and local HTTP replays.
- **Winston Log Infrastructure**: Daily rotating server log files in `server/logs/relay-%DATE%.log` with JSON formatting in production mode.
- **Go CLI `slog` Logger**: Structured file logger using Go stdlib `log/slog` writing to `~/.webhookrelay/relay.log` with `--verbose` debug support.
- **Load Testing Benchmark**: Load test script ([`server/src/tests/load.js`](server/src/tests/load.js)) firing 100 webhooks over 10 seconds (10.88 req/sec, p50 = 16.49ms, p99 = 36.16ms).
- **Multi-Platform CI Matrix**: GitHub Actions matrix build supporting `linux/amd64`, `darwin/amd64`, `darwin/arm64`, and `windows/amd64`.

#### 🔧 Changed & Hardened
- **WHATWG URL Standard**: Replaced deprecated `url.parse()` with standard `new URL()` in WebSocket connection handler.
- **Standardized Error Envelopes**: Standardized API error responses across Express routes (`{ success: false, error: { code, message, details } }`).
- **CLI Exit Codes**: Enforced explicit command exit codes: `0` (Success), `1` (Configuration / Auth error), `2` (Network / Gateway connection failure).
- **Graceful Fault Tolerance**: Protected CLI connection loops against malformed event frames and local target `connection refused` (HTTP 502 Bad Gateway) errors.
