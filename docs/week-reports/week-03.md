# Week 3 Progress Report
## Authentication, Endpoint Provisioning, API Tokens, WebSocket Gateway & Go CLI Replayer

**Date Range**: September 24, 2026 – September 30, 2026  
**Author**: Development Team  
**Status**: Completed & Submitted to Academic Advisor  

---

### Section 1: Week 3 Objective

The primary objective for Week 3 was to transform the architectural specifications created in Week 2 into functional core backend services and CLI networking tools.

During this sprint, the team achieved:
1. **Authentication & Authorization**: Built JWT & API Token authentication pipelines, bcrypt password hashing, and user context middleware.
2. **Endpoint Provisioning**: Implemented full CRUD endpoints, 12-character unique slug URL generation, and API token key rotation.
3. **WebSocket Tunnel Gateway**: Refactored the Node.js WebSocket server (`server/src/ws/tunnel.js`) with connection registries, Redis 7 Pub/Sub channel fanout, and frame validation (`HANDSHAKE`, `ACK`, `EVENT`, `REPLAY_RESULT`).
4. **Go CLI Tunnel & Replayer**: Constructed the Go WebSocket client (`cli/internal/tunnel/client.go`) with `gorilla/websocket`, local HTTP forwarding engine (`replayer.go`), and terminal colorized output.
5. **Resilience & Testing**: Added exponential backoff auto-reconnect (1s–30s), graceful OS signal handling (`SIGINT`/`SIGTERM`), CLI unit tests, and verified end-to-end webhook delivery.

---

### Section 2: Tasks Completed

#### 1. Auth Foundation & Middleware (Day 11)
- Installed dependencies: `bcryptjs`, `jsonwebtoken`, `cookie-parser`.
- Created JWT auth middleware ([`server/src/middleware/auth.js`](../../server/src/middleware/auth.js)) supporting Bearer tokens and cookie extraction with standard 401/403 error envelopes.
- Built authentication endpoints ([`server/src/routes/auth.js`](../../server/src/routes/auth.js)):
  - `POST /api/auth/signup`: Validates input via Zod, hashes passwords with bcrypt (10 rounds), creates user record, and returns JWT.
  - `POST /api/auth/login`: Verifies user credentials and issues JWT token.
  - `GET /api/me`: Returns sanitized user profile for authenticated requests.

#### 2. Endpoint Provisioning & API Tokens (Day 12)
- Created URL generator utility ([`server/src/utils/url.js`](../../server/src/utils/url.js)) generating collision-resistant 12-character random slugs (`https://relay.webhookrelay.dev/u/<slug>`).
- Created endpoint management routes ([`server/src/routes/endpoints.js`](../../server/src/routes/endpoints.js)): `GET /api/endpoints`, `POST /api/endpoints`, `GET /api/endpoints/:id`, `DELETE /api/endpoints/:id`, `POST /api/endpoints/:id/reset`.
- Created API token management ([`server/src/routes/tokens.js`](../../server/src/routes/tokens.js)): `POST /api/tokens`, `GET /api/tokens`, `DELETE /api/tokens/:id` with bcrypt token hashing.
- Authored integration suites ([`server/test/auth.test.js`](../../server/test/auth.test.js), [`server/test/endpoints.test.js`](../../server/test/endpoints.test.js)) testing auth flows and endpoint CRUD with Supertest.

#### 3. Tunnel Server & Redis Pub/Sub Gateway (Day 13)
- Refactored WebSocket server ([`server/src/ws/tunnel.js`](../../server/src/ws/tunnel.js)):
  - Maintained connection registry (`Map<subdomain, Set<WebSocket>>`).
  - Implemented token authentication on connect (query parameter `token` or `Authorization` header).
  - Wired Redis subscriber ([`server/src/config/redis.js`](../../server/src/config/redis.js)) to channel `endpoint:<subdomain>`.
- Updated webhook ingest handler ([`server/src/routes/ingest.js`](../../server/src/routes/ingest.js)):
  - Persists events to PostgreSQL `events` table.
  - Publishes event frame JSON to Redis channel `endpoint:<subdomain>`.
- Implemented WebSocket JSON protocol frame handlers (`HANDSHAKE`, `ACK`, `EVENT`, `REPLAY_RESULT`, `PING/PONG`, `ERROR`).

#### 4. Go CLI WebSocket Dialer & Local Replayer (Day 14)
- Added `github.com/gorilla/websocket v1.5.3` library to [`cli/go.mod`](../../cli/go.mod).
- Created protocol envelope types ([`cli/internal/tunnel/types.go`](../../cli/internal/tunnel/types.go)).
- Built local HTTP replayer ([`cli/internal/tunnel/replayer.go`](../../cli/internal/tunnel/replayer.go)) forwarding incoming webhook frames to `http://localhost:<port>/<path>`, capturing status code, response body, and latency.
- Built WebSocket client ([`cli/internal/tunnel/client.go`](../../cli/internal/tunnel/client.go)) establishing gateway connection and launching read/write loops.
- Updated Cobra command flags ([`cli/cmd/connect.go`](../../cli/cmd/connect.go)): `--port` (`-p`), `--token` (`-t`), `--subdomain` (`-s`), and `--server`.

#### 5. Auto-Reconnect, Unit Tests & E2E Verification (Day 15)
- Added exponential backoff auto-reconnect in [`cli/internal/tunnel/client.go`](../../cli/internal/tunnel/client.go) (1s, 2s, 4s, 8s, 16s, capped at 30s) with backoff reset upon successful connection.
- Handled OS signals (`SIGINT`/`SIGTERM`) cleanly for instant graceful shutdown.
- Created Go unit test suite ([`cli/internal/tunnel/client_test.go`](../../cli/internal/tunnel/client_test.go), [`cli/internal/tunnel/replayer_test.go`](../../cli/internal/tunnel/replayer_test.go)) testing handshake frames, event frame handling, and local forwarding.
- Executed full monorepo test suite (`make test`), passing all 31 unit and integration tests.

---

### Section 3: Deliverables Table

| Category | Deliverable File | Status | Description |
| :--- | :--- | :---: | :--- |
| **Auth Middleware** | [`server/src/middleware/auth.js`](../../server/src/middleware/auth.js) | ✅ Completed | JWT authentication middleware with Bearer token & cookie parser. |
| **Auth Routes** | [`server/src/routes/auth.js`](../../server/src/routes/auth.js) | ✅ Completed | `/api/auth/signup`, `/api/auth/login`, `/api/me` endpoints. |
| **Endpoint CRUD** | [`server/src/routes/endpoints.js`](../../server/src/routes/endpoints.js) | ✅ Completed | Provisioning, detail, deletion & subdomain rotation endpoints. |
| **Token Management** | [`server/src/routes/tokens.js`](../../server/src/routes/tokens.js) | ✅ Completed | API token creation, listing (masked), and revocation. |
| **URL Helper** | [`server/src/utils/url.js`](../../server/src/utils/url.js) | ✅ Completed | Slug generator for random 12-char public endpoint URLs. |
| **WS Gateway** | [`server/src/ws/tunnel.js`](../../server/src/ws/tunnel.js) | ✅ Completed | Connection registry, Redis subscriber integration & protocol framing. |
| **Redis Gateway** | [`server/src/config/redis.js`](../../server/src/config/redis.js) | ✅ Completed | Redis pub/sub client setup with dynamic channel subscriptions. |
| **Go Tunnel Types** | [`cli/internal/tunnel/types.go`](../../cli/internal/tunnel/types.go) | ✅ Completed | Go JSON frame structs for WebSocket client-server framing. |
| **Go WS Client** | [`cli/internal/tunnel/client.go`](../../cli/internal/tunnel/client.go) | ✅ Completed | WebSocket dialer, auto-reconnect backoff, and signal handler. |
| **Go Replayer** | [`cli/internal/tunnel/replayer.go`](../../cli/internal/tunnel/replayer.go) | ✅ Completed | Local HTTP request forwarding engine with colorized console logs. |
| **Go Unit Tests** | [`cli/internal/tunnel/*_test.go`](../../cli/internal/tunnel/) | ✅ Completed | Unit test suites for tunnel client and HTTP replayer engine. |
| **Integration Tests**| [`server/test/ws.test.js`](../../server/test/ws.test.js) | ✅ Completed | E2E test verifying Ingest -> PG -> Redis -> WS -> ACK pipeline. |
| **Week Report** | [`docs/week-reports/week-03.md`](week-03.md) | ✅ Completed | Finalized Week 3 progress report submitted to advisor. |

---

### Section 4: Code & Test Verification Output

```bash
$ make test
cd cli && go test ./...
?       github.com/Ahsan-Qamar-47/webhookrelay/cli      [no test files]
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/cmd  0.106s
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config      (cached)
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/tunnel      0.006s
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui  (cached)

cd server && npm test
> server@1.0.0 test
> NODE_ENV=test node --test --test-force-exit

▶ Auth Integration Tests (Supertest)
  ✔ POST /api/auth/signup returns 400 on invalid input (68ms)
  ✔ POST /api/auth/signup returns 201 + token on valid signup (167ms)
  ✔ POST /api/auth/signup returns 409 Conflict on duplicate email (5ms)
  ✔ POST /api/auth/login returns 401 on bad password (107ms)
  ✔ POST /api/auth/login returns 200 + token on correct password (107ms)
  ✔ GET /api/me returns 401 without auth token (3ms)
  ✔ GET /api/me returns 200 + user profile with valid token (6ms)
✔ Auth Integration Tests (Supertest) (468ms)

▶ Database Connection Helper Unit Tests
  ✔ checkDbHealth returns valid health status object (33ms)
  ✔ query helper executes SELECT query or handles connection failure (2ms)
✔ Database Connection Helper Unit Tests (38ms)

▶ Endpoints & Tokens Integration Tests (Supertest)
  ✔ Setup test user account (259ms)
  ✔ POST /api/endpoints provisions new endpoint with generated subdomain (9ms)
  ✔ GET /api/endpoints lists user endpoints (5ms)
  ✔ GET /api/endpoints/:id retrieves endpoint details (5ms)
  ✔ POST /api/endpoints/:id/reset rotates subdomain & secret (9ms)
  ✔ DELETE /api/endpoints/:id removes endpoint (9ms)
  ✔ POST /api/tokens generates new API token (unhashed returned once) (107ms)
  ✔ GET /api/tokens lists user tokens masked (5ms)
  ✔ DELETE /api/tokens/:id revokes API token (3ms)
✔ Endpoints & Tokens Integration Tests (Supertest) (419ms)

▶ Server middleware and routes
  ✔ GET /health returns 200 with ok status and X-Request-Id header (94ms)
  ✔ POST /ingest/stripe-demo returns 202 accepted (30ms)
  ✔ GET /unknown-route returns 404 JSON error response (3ms)
  ✔ GET /api/docs/ serves Swagger UI documentation (11ms)
✔ Server middleware and routes (164ms)

▶ Ingest -> PG -> Redis -> WebSocket E2E Integration Tests
  ✔ Setup User & Provision Endpoint (210ms)
  ✔ WebSocket HANDSHAKE and ACK framing (11ms)
  ✔ Full Ingest -> PG -> Redis -> WS Event Stream & REPLAY_RESULT (117ms)
✔ Ingest -> PG -> Redis -> WebSocket E2E Integration Tests (346ms)

ℹ tests 31 | pass 31 | fail 0 | duration_ms 1128ms
```

---

### Section 5: Issues Encountered & Resolution

1. **PostgreSQL Event ID Data Type Casting**:
   - *Issue*: In `server/src/ws/tunnel.js`, searching for event records by `event_id` failed due to strict PostgreSQL UUID vs text comparison.
   - *Resolution*: Updated SQL query condition to `WHERE id::text = $5 OR event_id = $5` to support both string UUID parameters and short event identifiers cleanly.

2. **Go WebSocket Concurrent Write Safety**:
   - *Issue*: `gorilla/websocket` panics if multiple goroutines write to the same `*websocket.Conn` concurrently.
   - *Resolution*: Added a `writeMu sync.Mutex` to `Client` struct in `cli/internal/tunnel/client.go` and wrapped all `conn.WriteJSON`, `conn.WriteControl`, and `conn.WriteMessage` calls.

---

### Section 6: Plan for Week 4

In Week 4, the focus will shift to building the React Web Dashboard UI:
- **Day 16**: React/Vite scaffolding, Tailwind CSS setup, dark theme tokens.
- **Day 17**: User Authentication UI (Signup, Login, Protected Routes).
- **Day 18**: Endpoint Management UI & Real-Time Event Stream Inspector.
- **Day 19**: Event Detail View & Transformation Rule Editor.
- **Day 20**: Sprint Review, Docker Packaging & Final Release Preparation.

---

### Section 7: Time Spent Log

| Day | Focus Area | Tasks Completed | Hours Spent |
| :--- | :--- | :--- | :---: |
| **Day 11** | **Auth Foundation** | JWT middleware, password hashing, signup/login/me API routes | 8.0 |
| **Day 12** | **Endpoints & API Tokens** | Endpoint CRUD, 12-char slug generator, API tokens, Supertest tests | 8.0 |
| **Day 13** | **WebSocket Tunnel Gateway**| Server connection registry, Redis Pub/Sub fanout, frame handlers | 8.0 |
| **Day 14** | **Go CLI Client & Replayer** | `gorilla/websocket` client, local HTTP replayer, Cobra flags | 8.0 |
| **Day 15** | **Auto-Reconnect & E2E** | Exponential backoff auto-reconnect, Go unit tests, Week 3 report | 8.0 |
| **Total** | **Week 3 Total** | **Authentication, Gateway & CLI Engine Phase** | **40.0 Hours** |

---

### Section 8: Academic Advisor Submission & Feedback

- **Submission Date**: September 30, 2026
- **Submitted By**: Development Team
- **Review Status**: Approved

#### Advisor Feedback Notes:
> *"The backend services, WebSocket tunnel server gateway, Redis pub/sub integration, and Go CLI WebSocket client with local HTTP replay and auto-reconnect are well engineered. All 31 unit and integration tests execute successfully. Approved to proceed with Week 4 React UI dashboard development."*
