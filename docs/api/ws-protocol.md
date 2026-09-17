# Webhook Relay — WebSocket Protocol Specification

**Version:** `1.0.0`  
**Endpoint URL:** `ws://localhost:8081` (Development) / `wss://tunnel.relay.dev` (Production)  
**Protocol:** Standard JSON-framed WebSocket Connection (`ws` / `wss`)

---

## 📌 Protocol Overview

The Webhook Relay WebSocket protocol handles real-time bidirectional communication between the central Relay Gateway Server and local **Go CLI** tunnel clients. 

All messages exchanged over the WebSocket connection MUST be valid JSON objects conforming to the schema defined below.

```
       Go CLI Client                                    Relay Server
             |                                                |
             | --------------- 1. HANDSHAKE ----------------> |
             | <----------------- 2. ACK -------------------- |
             |                                                |
             | <-------------- 3. EVENT Frame --------------- |
             | (Dispatch Local HTTP)                          |
             | --------------- 4. REPLAY_RESULT ------------> |
             |                                                |
             | <------------- 5. PING / PONG ---------------> |
             |                                                |
             | <--------------- 6. ERROR / CLOSE ------------ |
```

---

## 📐 Frame Structure & Types

Every frame sent or received contains a top-level `type` string field identifying the frame payload structure:

```json
{
  "type": "<FRAME_TYPE>",
  "payload": { ... }
}
```

| Frame Type | Source | Destination | Purpose |
| :--- | :--- | :--- | :--- |
| `HANDSHAKE` | CLI | Server | Authenticates client and registers tunnel subdomain. |
| `ACK` | Server | CLI | Confirms tunnel activation with assigned public URL. |
| `EVENT` | Server | CLI | Relays incoming webhook HTTP payload to local CLI. |
| `REPLAY_RESULT` | CLI | Server | Returns local application HTTP response status/body to server. |
| `PING` / `PONG` | Both | Both | Bidirectional heartbeat to detect dropped connections. |
| `ERROR` | Server | CLI | Emits error code and message (e.g. invalid token, rate limit). |
| `CLOSE` | Server | CLI | Instructs connection shutdown with clean termination code. |

---

## 📄 Frame Specifications

### 1. HANDSHAKE Frame (CLI $\rightarrow$ Server)
Initiated immediately upon opening the WebSocket TCP connection.

```json
{
  "type": "HANDSHAKE",
  "payload": {
    "token": "relay_token_99a8b7c6d5e4f3a2",
    "subdomain": "stripe-checkout",
    "client_version": "v1.0.0",
    "target_port": 3000
  }
}
```

---

### 2. ACK Frame (Server $\rightarrow$ CLI)
Sent by the server to confirm valid authentication and active tunnel provisioning.

```json
{
  "type": "ACK",
  "payload": {
    "status": "connected",
    "tunnel_id": "c2ddde77-7a09-4ce6-994b-4bb7ab160c33",
    "subdomain": "stripe-checkout",
    "public_url": "http://localhost:8080/ingest/stripe-checkout",
    "expires_at": null
  }
}
```

---

### 3. EVENT Frame (Server $\rightarrow$ CLI)
Streamed to the CLI when a third-party provider hits the public ingest endpoint.

```json
{
  "type": "EVENT",
  "payload": {
    "event_id": "d3eeef66-6f08-4bd5-883a-3aa6ba050d44",
    "provider": "stripe",
    "method": "POST",
    "path": "/api/webhooks/stripe",
    "headers": {
      "content-type": "application/json",
      "user-agent": "Stripe/1.0",
      "stripe-signature": "t=1600000000,v1=abc123xyz..."
    },
    "body": "{\"id\":\"evt_101\",\"type\":\"payment_intent.succeeded\"}",
    "timestamp": "2026-09-17T23:12:00.000Z"
  }
}
```

---

### 4. REPLAY_RESULT Frame (CLI $\rightarrow$ Server)
Returned by the CLI after executing the webhook request against the local target host.

```json
{
  "type": "REPLAY_RESULT",
  "payload": {
    "event_id": "d3eeef66-6f08-4bd5-883a-3aa6ba050d44",
    "status_code": 200,
    "headers": {
      "content-type": "application/json",
      "x-powered-by": "Express"
    },
    "body": "{\"status\":\"success\",\"processed\":true}",
    "latency_ms": 34
  }
}
```

---

### 5. PING / PONG Heartbeat Frames
Heartbeat frames run every 10 seconds to maintain connection health and bypass proxy timeouts.

#### PING (Server or CLI)
```json
{
  "type": "PING",
  "payload": {
    "timestamp": 1758150000000
  }
}
```

#### PONG (Response)
```json
{
  "type": "PONG",
  "payload": {
    "timestamp": 1758150000000
  }
}
```

---

### 6. ERROR Frame (Server $\rightarrow$ CLI)
Emitted when an error condition occurs during handshake or streaming.

```json
{
  "type": "ERROR",
  "payload": {
    "code": "AUTH_FAILED",
    "message": "Invalid authentication token provided in HANDSHAKE frame.",
    "fatal": true
  }
}
```

#### Standard Protocol Error Codes
- `AUTH_FAILED` (4001): Invalid or expired API token.
- `SUBDOMAIN_UNAVAILABLE` (4002): Requested subdomain is already bound by another client.
- `RATE_LIMIT_EXCEEDED` (4029): Tunnel request volume exceeds subscription tier limit.
- `INTERNAL_SERVER_ERROR` (5000): Gateway pipeline execution fault.

---

### 7. CLOSE Frame (Server $\rightarrow$ CLI)
Issued prior to server-initiated connection shutdown.

```json
{
  "type": "CLOSE",
  "payload": {
    "code": 1000,
    "reason": "Tunnel closed gracefully by user command or server shutdown."
  }
}
```
