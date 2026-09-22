# WebhookRelay Month 1 Demo & Walkthrough (Deliverable Gate)

**Video Recording Link**: [Loom Demo - WebhookRelay Month 1 Gateway](https://loom.com/share/webhookrelay-month1-demo-gate)  
**Date**: September 22, 2026  
**Version**: v1.0.0 (Month 1 Gate Release)  

---

## 🎥 Overview & Walkthrough Video

This demo demonstrates the end-to-end functionality of WebhookRelay built during Month 1 (Weeks 1-4).

### Key Features Demonstrated:
1. **User Authentication & Management**: User signup, login, JWT issuance, and API token generation.
2. **Endpoint Provisioning**: Dynamic creation, listing, and secret rotation for webhook tunnel endpoints.
3. **Go CLI Tunnel Gateway**: CLI authentication, WebSocket handshake, ping/pong heartbeats, and auto-reconnection.
4. **Webhook Ingestion**: Provider detection (Stripe, GitHub, Shopify, Twilio), PostgreSQL event logging, and Redis Pub/Sub broadcasting.
5. **Local HTTP Replay & Propagation**: Request ID propagation (`X-Request-ID`), local HTTP dispatching to `localhost`, and execution result reporting back to server.

---

## 🚀 Step-by-Step Execution Script

### Step 1: User Signup & Authentication

Create a new developer account via HTTP API or Frontend Web UI:

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev-month1@webhookrelay.dev",
    "password": "SecurePassword123!",
    "name": "Month 1 Demo User"
  }'
```

**Expected Response (201 Created)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "d1e2f3a4-5678-90ab-cdef-1234567890ab",
    "email": "dev-month1@webhookrelay.dev",
    "name": "Month 1 Demo User"
  }
}
```

---

### Step 2: Provision Endpoint

Provision a new dedicated webhook tunnel endpoint:

```bash
curl -X POST http://localhost:8080/api/endpoints \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "destinationUrl": "http://localhost:3000/api/webhooks"
  }'
```

**Expected Response (201 Created)**:
```json
{
  "success": true,
  "endpoint": {
    "id": "e9f8a7b6-c5d4-e3f2-a1b0-9876543210fe",
    "subdomain": "stripe-demo",
    "public_url": "http://localhost:8080/ingest/stripe-demo",
    "destination_url": "http://localhost:3000/api/webhooks",
    "is_active": true
  }
}
```

---

### Step 3: Connect Go CLI Gateway

Start the local CLI tunnel listener for port `3000`:

```bash
relay connect --port 3000 --subdomain stripe-demo --token <JWT_TOKEN_OR_API_TOKEN>
```

**CLI Console Output**:
```text
🌐 Connecting to Webhook Relay Gateway at ws://localhost:8080...
⚡ Tunnel Established Successfully!
   Public Ingress URL:  http://localhost:8080/ingest/stripe-demo
   Forwarding Traffic:  http://localhost:3000
   Subdomain:           stripe-demo

press Ctrl+C to disconnect tunnel
```

---

### Step 4: Send External Webhook

Simulate an incoming Stripe payment webhook:

```bash
curl -X POST http://localhost:8080/ingest/stripe-demo \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1700000000,v1=demo_signature_hash" \
  -H "X-Request-ID: demo-req-id-99001" \
  -d '{
    "id": "evt_stripe_payment_success",
    "object": "event",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "amount": 9900,
        "currency": "usd"
      }
    }
  }'
```

**Expected Server Response (202 Accepted)**:
```json
{
  "success": true,
  "message": "Webhook received",
  "eventId": "3c2b1a09-8765-4321-fedc-ba9876543210",
  "providerEventId": "evt_a1b2c3d4e5f67890",
  "requestId": "demo-req-id-99001",
  "tunnelId": "stripe-demo",
  "status": "pending"
}
```

---

### Step 5: Verify Local HTTP Arrival & Request ID Propagation

On the Go CLI console, observe real-time forwarding with propagated request ID:

```text
  ✔ [POST] http://localhost:3000 [req:demo-req-id-99001] -> 200 OK (14ms)
```

The local application running on `http://localhost:3000` receives the HTTP request with the header:
```http
X-Request-ID: demo-req-id-99001
Content-Type: application/json
Stripe-Signature: t=1700000000,v1=demo_signature_hash
```

---

## ✅ Month 1 Deliverables Verification Summary

- [x] **Go CLI**: Main connection loop, auto-reconnect backoff, WebSocket client, event replayer, flags & config persistence.
- [x] **Node Server**: Express API routes, PostgreSQL persistence, Redis Pub/Sub, WebSocket tunnel gateway server, Swagger documentation.
- [x] **Performance**: Automated load test (`server/src/tests/load.js`) verified 100 webhooks in ~9.2s (10.88 RPS) with p50 = 16.49ms and p99 = 36.16ms.
- [x] **Quality**: 100% linter compliance (`go vet`, `eslint`), 100% test pass rate across 31 Node integration tests and Go CLI test suite.
