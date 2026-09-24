# Midterm Live Demo Rehearsal & Fallback Plan

This document records the demo rehearsal timings, potential failure scenarios, mitigation strategies, and backup visual fallback references for the midterm presentation.

---

## 1. Rehearsal Timing Log

| Segment | Target Time | Rehearsal Run Time | Status |
|---|:---:|:---:|:---:|
| **1. Intro & Problem Statement** | 30s | 28s | ✅ On Pace |
| **2. Account Signup & Onboarding** | 30s | 32s | ✅ On Pace |
| **3. Endpoint Provisioning** | 30s | 26s | ✅ On Pace |
| **4. CLI Tunnel Connection** | 30s | 35s | ✅ On Pace |
| **5. Live Stripe Webhook Trigger** | 60s | 55s | ✅ On Pace |
| **6. Inspector, Headers & JSON Diff** | 60s | 64s | ✅ On Pace |
| **7. Event Replay Execution** | 60s | 50s | ✅ On Pace |
| **8. Performance Metrics & Q&A** | 30s | 35s | ✅ On Pace |
| **Total Presentation Time** | **5:00 – 7:00** | **5:45** | **Optimal Range** |

---

## 2. Identified Risks & Fallback Mitigations

| Risk Scenario | Potential Cause | Fallback Mitigation Strategy |
|---|---|---|
| **Local PostgreSQL disconnect** | Service restart | Demo database pre-seeded via `npm run db:seed`. Seed script automatically reconnects and initializes isolated tables. |
| **WebSocket handshake delay** | Port conflict | Pre-recorded terminal output log ready to display in terminal. |
| **Browser reload delay** | Cold cache | TanStack Query configured with 30s `staleTime` and route code-splitting (94 kB gzipped initial bundle). |
| **Network failure on live trigger** | Offline mode | Use `node server/scripts/demo-triggers.js` targeting localhost port `8080`. |

---

## 3. Pre-Recorded CLI Output Snippet

In case live terminal execution is restricted, refer to this verified CLI terminal connection log:

```
$ relay connect --token demo_cli_token_9988 --tunnel stripe-demo --target http://localhost:3000/api/webhooks
[13:30:00] INFO WebhookRelay CLI v1.0.0
[13:30:01] INFO Connecting to WebhookRelay Gateway (ws://relay.local:8080/ws/cli)...
[13:30:01] SUCCESS WebSocket connection established (authenticated as user demo@webhookrelay.dev)
[13:30:01] SUCCESS Tunnel established: https://relay.local:8080/ingest/stripe-demo -> http://localhost:3000/api/webhooks
[13:30:15] INGEST [202 Accepted] POST /ingest/stripe-demo (provider: stripe, event_id: evt_1M001A2eZvKYlo2C9990123)
[13:30:15] FORWARD -> http://localhost:3000/api/webhooks [200 OK] (latency: 18ms)
```

---

## 4. Backup Visual Screenshots & Artifact References

- **Validation Matrix**: [docs/validation/matrix.md](../validation/matrix.md)
- **Load Benchmark Report**: [docs/perf/load-test.md](../perf/load-test.md)
- **Database Query Optimization**: [docs/architecture/query-optimization.md](../architecture/query-optimization.md)
- **Week 7 Progress Report**: [docs/week-reports/week-07.md](../week-reports/week-07.md)
