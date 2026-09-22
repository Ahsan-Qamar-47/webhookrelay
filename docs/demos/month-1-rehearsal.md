# Month 1 Demo Rehearsal & Week 8 Midterm Preview

**Target Demo Duration**: 5 Minutes  
**Date**: September 22, 2026  
**Status**: Rehearsed & Verified  

---

## ⏱️ Timed 5-Minute Presentation Script Breakdown

```
+-----------------------------------------------------------------------------------+
| Timeline | Section                           | Key Action / Command               |
+----------+-----------------------------------+------------------------------------+
| 0:00-1:00| Overview & User Signup / Auth     | POST /api/auth/signup & JWT token  |
| 1:00-2:00| Endpoint Provisioning & Slugs     | POST /api/endpoints (stripe-demo)  |
| 2:00-3:00| Go CLI Gateway Connect            | relay connect -p 3000 -s stripe-demo|
| 3:00-4:00| Webhook Ingestion & Replay        | POST /ingest/stripe-demo (req-id)  |
| 4:00-5:00| Perf Baseline & Midterm Preview   | p50=16ms, p99=36ms, Week 8 UI plan |
+-----------------------------------------------------------------------------------+
```

### 1. [0:00 – 1:00] System Overview & User Authentication
- **Speaker Script**: *"Welcome! Today we are demonstrating WebhookRelay v1.0.0 (Month 1 Gate), a developer-first webhook tunneling gateway. First, we show user authentication via JWT."*
- **Live Action**: Execute signup cURL request:
  ```bash
  curl -X POST http://localhost:8080/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"demo-rehearsal@dev.com","password":"Password123!","name":"Demo User"}'
  ```
- **Key Checkpoint**: Highlight HTTP 201 response and returned JWT token.

---

### 2. [1:00 – 2:00] Dynamic Endpoint Provisioning
- **Speaker Script**: *"Next, we provision a dedicated webhook tunnel endpoint bound to subdomain `stripe-demo`."*
- **Live Action**: Execute endpoint creation:
  ```bash
  curl -X POST http://localhost:8080/api/endpoints \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"destinationUrl":"http://localhost:3000/api/webhooks"}'
  ```
- **Key Checkpoint**: Show generated public URL `http://localhost:8080/ingest/stripe-demo`.

---

### 3. [2:00 – 3:00] Go CLI Connection & WebSocket Handshake
- **Speaker Script**: *"Now we connect our high-performance Go CLI client (`relay connect`) to forward webhooks to a local application running on port 3000."*
- **Live Action**: Start Go CLI in terminal:
  ```bash
  ./cli/bin/relay connect --port 3000 --subdomain stripe-demo --token <JWT_TOKEN>
  ```
- **Key Checkpoint**: Display terminal banner showing `⚡ Tunnel Established Successfully!` and active WSS connection.

---

### 4. [3:00 – 4:00] Webhook Ingress & Real-Time Local Replay
- **Speaker Script**: *"We send a Stripe payment webhook to our public ingress gateway with a custom `X-Request-ID` header."*
- **Live Action**: Send ingest request:
  ```bash
  curl -X POST http://localhost:8080/ingest/stripe-demo \
    -H "Content-Type: application/json" \
    -H "X-Request-ID: req-demo-55001" \
    -H "Stripe-Signature: t=1700000000,v1=sig_hash" \
    -d '{"event":"payment_intent.succeeded","amount":4900}'
  ```
- **Key Checkpoint**: Show server return `202 Accepted` in ~14ms and CLI terminal log:
  `✔ [POST] http://localhost:3000 [req:req-demo-55001] -> 200 OK (12ms)`.

---

### 5. [4:00 – 5:00] Performance Baseline & Week 8 Midterm Preview
- **Speaker Script**: *"Our automated load benchmark demonstrates 100 webhooks ingested in 9.2 seconds with a median p50 latency of 16.49ms and p99 latency of 36.16ms."*
- **Midterm Preview**: Highlight upcoming Phase 2 features:
  - React Web Payload Inspector UI (live event stream sidebar).
  - Header & JSON diffing engine.
  - Single-click webhook replaying from browser UI.

---

## 🎯 Edge-Case Rehearsal Checkpoints

| Scenario | Expected Behavior | Verified |
| :--- | :--- | :---: |
| **Local App Server Down** | CLI logs colored warning `ERR: connection refused`, returns 502 Bad Gateway replay result to server without crashing. | ✅ Verified |
| **Network Interruption** | Go CLI enters exponential backoff auto-reconnect loop (1s, 2s, 4s... capped at 30s) and reconnects seamlessly. | ✅ Verified |
| **Invalid Auth Token** | Server rejects WSS HANDSHAKE with code `AUTH_FAILED`, CLI logs unrecoverable error and exits with code `1`. | ✅ Verified |
| **Malformed JSON Frame** | CLI logs warning `Received malformed EVENT frame payload (skipped)` and continues processing stream. | ✅ Verified |

---

## 🔮 Week 8 Midterm Preview Roadmap

- **Week 5**: Webhook Payload Inspector UI (React 19, TailwindCSS, Live Event List, Headers Table, JSON Diff).
- **Week 6**: Payload Modification & Single-Click Replay Controls.
- **Week 7**: Advanced Filters, Search, Provider Signature Verification & Secret Masking.
- **Week 8**: Midterm Presentation & Phase 2 Milestone Evaluation.
