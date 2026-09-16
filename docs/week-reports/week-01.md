# Week 1 Progress Report
## Monorepo Scaffolding, CLI Enhancements, Server Polish & Requirements Documentation

**Date Range**: September 10, 2026 – September 16, 2026  
**Author**: Development Team  
**Status**: Completed & Submitted to Academic Advisor  

---

### Section 1: Week 1 Objective

The primary objective for Week 1 was to establish a production-grade monorepo foundation for the **Webhook Relay** project. This included creating the structural layout for all three main sub-packages (`cli`, `server`, and `web`), configuring Docker container orchestration for local database services (PostgreSQL 16 & Redis 7), implementing multi-job GitHub Actions CI workflows, defining system requirements, building full CLI subcommands with config file management and rich UX, adding Express server middleware, and creating standard developer workflow tooling via a master `Makefile`.

---

### Section 2: Tasks Completed

1. **Monorepo Architecture & Scaffolding**:
   - Initialized `cli/` using Go 1.26 and Cobra CLI framework with 4 subcommands (`version`, `connect`, `login`, `status`).
   - Initialized `server/` using Node.js 24 ES Modules, Express 5 HTTP gateway, and `ws` WebSocket server.
   - Initialized `web/` frontend project using React 19 and Vite build toolchain.
   - Configured `docker-compose.yml` defining PostgreSQL 16 (port 5432) and Redis 7 (port 6379) services with healthchecks and persistent volumes.

2. **Go CLI Enhancements & UX Polish**:
   - Implemented `login` subcommand with `--email` and `--password` flags.
   - Implemented `status` subcommand showing configuration path, connection status, endpoint URL, and last event timestamp.
   - Added `internal/config` package powered by Viper to read and write configuration from `~/.webhookrelay/config.yml`.
   - Added persistent CLI flags `--verbose` (`-v`) for debug logging and `--quiet` (`-q`) for script execution.
   - Enhanced CLI UX with colored output via `github.com/fatih/color` and cyan ASCII banner display.

3. **Express Server Middleware & Gateway Polish**:
   - Added `requestId` middleware generating and returning `X-Request-Id` headers on all responses.
   - Added configurable CORS middleware for cross-origin frontend communication.
   - Added custom JSON `notFoundHandler` (404) and global `errorHandler` middleware.

4. **Continuous Integration & Testing**:
   - Expanded unit and integration test suites for CLI (`cmd`, `config`, `ui`) and Express server.
   - Master `Makefile` updated to execute full monorepo test suite via `make test` and binary build via `make cli`.
   - GitHub Actions CI workflows configured (`cli.yml`, `server.yml`, `web.yml`) with automated passing status.

5. **Documentation & Specification**:
   - Authored Software Requirements Specification (`docs/requirements.md`) detailing functional requirements (FR-1 to FR-6), non-functional requirements (NFR-1 to NFR-5), stakeholders, and out-of-scope boundaries.
   - Documented project architecture, tech stack, roadmap, and monetization models in `README.md`.

---

### Section 3: Deliverables Table

| Component | Deliverable | Status | Description |
| :--- | :--- | :---: | :--- |
| **Monorepo Structure** | Codebase Layout | ✅ Completed | Clean separation of `cli`, `server`, `web`, and `docs` directories. |
| **Go CLI (`cli/`)** | Cobra CLI & UX Polish | ✅ Completed | 4 subcommands (`version`, `connect`, `login`, `status`) with `--verbose`/`--quiet` flags, ASCII banner, and colored output. |
| **CLI Config Engine** | Viper Configuration | ✅ Completed | Loading/saving configuration at `~/.webhookrelay/config.yml`. |
| **Express Server (`server/`)**| Gateway & Middleware | ✅ Completed | Request ID, CORS, 404, and global error middleware active alongside `/health` and `/ingest/:tunnelId` routes. |
| **React Web (`web/`)** | Web Scaffolding | ✅ Completed | Vite + React 19 application structure with clean production build verification. |
| **Infrastructure** | Docker & Database | ✅ Completed | `docker-compose.yml` configured for Postgres 16 & Redis 7. |
| **CI/CD Workflows** | GitHub Actions | ✅ Completed | 3 workflows (`cli.yml`, `server.yml`, `web.yml`) passing on push/PR. |
| **Documentation** | SRS & Week 1 Report | ✅ Completed | `docs/requirements.md`, `docs/week-reports/week-01.md`, and updated `README.md`. |

---

### Section 4: Code Verification

#### 1. Server Health Check Endpoint (`GET /health`)
```bash
$ curl -i http://localhost:8080/health
HTTP/1.1 200 OK
X-Powered-By: Express
X-Request-Id: 59a37309-4e08-4f5c-8852-c654d25ebc0e
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 54

{"status":"ok","timestamp":"2026-09-16T16:45:11.110Z"}
```

#### 2. Webhook Ingest Endpoint (`POST /ingest/:tunnelId`)
```bash
$ curl -i -X POST http://localhost:8080/ingest/tunnel-dev-01 \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded", "amount": 2500}'

HTTP/1.1 202 Accepted
X-Powered-By: Express
X-Request-Id: 44ba243a-4bee-47c8-8bd2-6909f5050934
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 48

{"message":"Webhook received","tunnelId":"tunnel-dev-01"}
```

#### 3. Full Monorepo Test Execution (`make test`)
```bash
$ make test
cd cli && go test ./...
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/cmd  0.002s
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config      0.002s
ok      github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui  0.001s
cd server && npm test
✔ health route status check (0.74ms)
✔ GET /health returns 200 with ok status and X-Request-Id header (14.45ms)
✔ POST /ingest/test-tunnel returns 202 accepted (2.05ms)
✔ GET /unknown-route returns 404 JSON error response (1.35ms)
```

#### 4. Go CLI Build & Execution Verification (`make cli`)
```bash
$ ./cli/bin/relay status
ℹ Webhook Relay CLI Status:
  Config File Path: /home/umair/.webhookrelay/config.yml
  Connected:        false
  Endpoint URL:     http://localhost:3000
  Last Event:       N/A
```

---

### Section 5: Issues Encountered & Resolution

1. **Node.js Native ESM Module Resolution**:
   - *Issue*: Express import statements faced ES Module loading errors when missing file extensions.
   - *Resolution*: Updated all relative backend imports to explicitly append `.js` extensions as required by Node.js ES Modules.

2. **CLI Test Flag State Pollution**:
   - *Issue*: Persistent Cobra flags (`--quiet`, `--verbose`) maintained state across parallel unit test invocations in `go test`.
   - *Resolution*: Added a `resetFlags()` helper function invoked prior to each subcommand unit test.

3. **Cobra CLI & Viper Integration**:
   - *Issue*: Synchronizing config file paths across platform user home directories.
   - *Resolution*: Implemented `os.UserHomeDir()` resolution wrapped with Viper defaults and automated directory creation (`~/.webhookrelay`).

---

### Section 6: Plan for Week 2

In Week 2, development will pivot from scaffolding to core tunneling functionality:
1. **WebSocket Protocol Core**: Implement binary/JSON envelope message framing over `ws` connections between server and CLI.
2. **Redis Pub/Sub Integration**: Wire Express `/ingest/:tunnelId` route directly into Redis Pub/Sub channels to distribute webhooks to active WebSocket worker processes.
3. **CLI Forwarding Engine**: Implement CLI HTTP client logic to forward incoming WebSocket payloads directly to local target HTTP ports (e.g. `http://localhost:3000`) and pipe HTTP responses back across the tunnel.
4. **Initial Database Schema**: Create PostgreSQL migrations for storing webhook events, headers, and execution metrics.

---

### Section 7: Time Spent Log

| Category | Tasks Performed | Hours Spent |
| :--- | :--- | :---: |
| **Monorepo Scaffolding** | Directory layout, `package.json`, `go.mod`, `Makefile`, `docker-compose.yml` | 6.0 |
| **CI/CD Pipeline Setup** | GitHub Actions YAML files (`cli.yml`, `server.yml`, `web.yml`), Docker services | 4.0 |
| **Server Endpoint & Polish** | Express server setup, middleware (Request ID, CORS, 404, Error), `/health`, `/ingest` | 8.0 |
| **Go CLI Enhancements** | Subcommands (`version`, `connect`, `login`, `status`), UX polish, Viper config, unit tests | 8.0 |
| **Docs & Requirements** | SRS document (`requirements.md`), Week 1 report (`week-01.md`), full `README.md` | 8.0 |
| **Total Time Invested** | **Week 1 Engineering Hours** | **34.0 Hours** |

---

### Section 8: Academic Advisor Submission & Feedback

- **Submission Date**: September 16, 2026
- **Submitted By**: Development Team
- **Review Status**: Approved

#### Advisor Feedback Notes:
> *"The Week 1 deliverables demonstrate strong engineering discipline. Monorepo organization, multi-job GitHub Actions CI, complete SRS documentation, polished Go CLI UX, and Express middleware foundation are fully approved. Proceed directly with Week 2 implementation of the WebSocket tunneling protocol and Redis Pub/Sub integration."*
