# Week 3 Development Plan
## Backend Authentication Services, Endpoint Management, Redis Pub/Sub Pipeline & CLI Tunnel Engine

**Target Period**: September 24, 2026 – September 30, 2026 (Days 11–15)  
**Goal**: Build functional end-to-end webhook tunneling between public Ingress HTTP gateway, Redis Pub/Sub message broker, WebSocket gateway, Go CLI client, and local HTTP applications.

---

## 📅 Daily Task Breakdown

### Day 11: Authentication Service & JWT Middleware
- [ ] **Task 11.1**: Install `bcryptjs` and `jsonwebtoken` in `server/`.
- [ ] **Task 11.2**: Implement Auth Controller (`server/src/controllers/authController.js`):
  - `signup`: Validate email/password, hash password, create user & subscription in PostgreSQL, return JWT.
  - `login`: Validate credentials, compare hash, return JWT token.
  - `getMe`: Return current user profile & subscription tier.
- [ ] **Task 11.3**: Implement JWT Authentication Middleware (`server/src/middleware/auth.js`):
  - Extract Bearer token from `Authorization` header, verify signature, attach `req.user`.
- [ ] **Task 11.4**: Unit & Integration tests for Auth endpoints (`server/test/auth.test.js`).

### Day 12: Endpoint (Tunnel) Management & API Tokens
- [ ] **Task 12.1**: Implement Endpoint Controller (`server/src/controllers/endpointController.js`):
  - `listEndpoints`: Fetch endpoints owned by authenticated user.
  - `createEndpoint`: Validate subdomain uniqueness, generate secret (`whsec_...`), store in PostgreSQL.
  - `deleteEndpoint`: Soft/hard delete endpoint and disconnect active WebSocket session.
- [ ] **Task 12.2**: Implement API Token Service (`server/src/controllers/tokenController.js`):
  - `createToken`: Generate persistent API token (`relay_token_...`) for CLI login.
- [ ] **Task 12.3**: Mount routes under `/api/endpoints` and `/api/tokens`.
- [ ] **Task 12.4**: Unit tests for endpoint CRUD operations (`server/test/endpoints.test.js`).

### Day 13: Ingest Gateway & Redis Pub/Sub Integration
- [ ] **Task 13.1**: Create Redis connection module (`server/src/config/redis.js`) using `ioredis`.
- [ ] **Task 13.2**: Refactor Ingest Route (`POST /ingest/:tunnelId`):
  - Validate active tunnel in Redis cache / PostgreSQL.
  - Format incoming HTTP request (verb, headers, payload, IP) into standard JSON envelope.
  - Publish envelope to Redis Pub/Sub channel `channel:tunnel:<subdomain>`.
- [ ] **Task 13.3**: Asynchronous Event Logging:
  - Save event record into PostgreSQL `events` table (`status = 'pending'`).
- [ ] **Task 13.4**: Integration tests simulating high-throughput webhook ingestion (`server/test/ingest.test.js`).

### Day 14: WebSocket Gateway Tunnel Server Engine
- [ ] **Task 14.1**: Refactor WebSocket handler (`server/src/ws/tunnel.js`):
  - Parse incoming JSON frames (`type: HANDSHAKE`).
  - Validate CLI API token against `api_tokens` table.
  - Send `ACK` frame with public ingress URL upon successful handshake.
- [ ] **Task 14.2**: Redis Pub/Sub Fanout to WebSocket:
  - Subscribe worker process to Redis channel `channel:tunnel:<subdomain>`.
  - Stream `EVENT` frame to active CLI WebSocket client.
- [ ] **Task 14.3**: Replay Result Handling:
  - Process incoming `REPLAY_RESULT` frame from CLI client.
  - Update `events` table status (`relayed`), response code, body, and latency in PostgreSQL.
- [ ] **Task 14.4**: Heartbeat Ping/Pong & Disconnection Handling.

### Day 15: Go CLI Tunnel Engine (`relay connect`)
- [ ] **Task 15.1**: Implement WebSocket Client Engine (`cli/internal/tunnel/client.go`) using `github.com/gorilla/websocket`.
- [ ] **Task 15.2**: Implement `relay connect --port <PORT>` Cobra Command (`cli/cmd/connect.go`):
  - Read token from `~/.webhookrelay/config.yml`.
  - Connect to WSS gateway (`ws://localhost:8081`).
  - Transmit `HANDSHAKE` frame and await `ACK`.
- [ ] **Task 15.3**: Local HTTP Forwarding Engine:
  - Receive `EVENT` frame, construct HTTP request to `http://localhost:<PORT><path>`.
  - Dispatch request, measure response latency, construct `REPLAY_RESULT` frame.
  - Transmit `REPLAY_RESULT` frame back over WebSocket connection.
- [ ] **Task 15.4**: End-to-end integration test (`Stripe Webhook -> Gateway -> Redis -> WS -> CLI -> Local App`).

---

## 🔍 Key Technical Unknowns & Research Items

1. **High-Concurrency Redis Channel Multiplexing**:
   - *Question*: How to efficiently manage 1,000+ active Redis Pub/Sub subscriptions per Node.js process without memory leaks?
   - *Approach*: Benchmark `ioredis` subscriber instance sharing vs per-socket channels.

2. **WebSocket Connection Re-establishment Logic**:
   - *Question*: How should the Go CLI handle transient network drops without duplicating in-flight webhooks?
   - *Approach*: Implement exponential backoff with jitter and unacknowledged event sequence buffer.
