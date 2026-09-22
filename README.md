# Webhook Relay

[![Go CLI CI](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/cli.yml/badge.svg)](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/cli.yml)
[![Node.js Server CI](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/server.yml/badge.svg)](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/server.yml)
[![React Web CI](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/web.yml/badge.svg)](https://github.com/Ahsan-Qamar-47/webhookrelay/actions/workflows/web.yml)

A high-performance, developer-first, self-hostable webhook tunneling and inspection framework. Webhook Relay exposes your local development environment (`localhost`) to third-party webhook providers (Stripe, GitHub, Shopify, Twilio) with real-time inspection, payload replaying, and sub-50ms latency.

---

## ✨ Features (Month 1 Release)

- **⚡ Sub-50ms Real-time Tunneling**: Decoupled HTTP ingestion gateway returning HTTP 202 Accepted in ~16ms and broadcasting webhooks instantly via Redis Pub/Sub to WebSocket CLI clients.
- **🔐 Multi-Tenant Authentication**: JWT token authentication, bcrypt password hashing (10 rounds), and API key generation (`whr_token_...`).
- **🌐 Dynamic Endpoint Provisioning**: Instant endpoint creation with custom or collision-resistant subdomains, endpoint metrics, secret keys, and rotation.
- **🆔 End-to-End Request ID Propagation**: Automatic `X-Request-ID` header generation and pass-through across server ingest, Redis event envelopes, WebSocket frames, and local HTTP replays.
- **📊 Structured Logging & Rotation**: Server log rotation (`winston` daily rotate files in `server/logs/`) with JSON formatting, plus Go CLI file logging using `log/slog` in `~/.webhookrelay/relay.log`.
- **🛡️ Resilience & Auto-Reconnect**: Go CLI WebSocket client featuring exponential backoff auto-reconnect (1s–30s), local server connection error handling (HTTP 502), graceful signal handling (`SIGINT`/`SIGTERM`), and explicit exit codes (`0`, `1`, `2`).

---

## 🏛️ Architecture Overview

![System Architecture Overview](docs/architecture/system-overview.png)

### 📐 Detailed Architectural & Protocol Specifications

- **[System Overview Architecture Diagram](docs/architecture/system-overview.png)**
- **[Data Flow Diagram (Level 0 & 1)](docs/architecture/dfd.png)**
- **[Database Entity-Relationship (ER) Diagram](docs/architecture/er-diagram.png)**
- **[Signup & Endpoint Provisioning Sequence Diagram](docs/architecture/seq-signup.png)**
- **[Webhook Ingress to CLI Replay Sequence Diagram](docs/architecture/seq-ingest-replay.png)**
- **[UI Real-time Dashboard Updates Sequence Diagram](docs/architecture/seq-realtime.png)**
- **[REST API Specification Document](docs/api/rest-spec.md)**
- **[WebSocket Protocol Framing Specification](docs/api/ws-protocol.md)**
- **[Performance Baseline Benchmark Report](docs/perf-baseline.md)**
- **[Month 1 Demo Recording & Walkthrough Script](docs/demos/month-1.md)**
- **[Interactive OpenAPI/Swagger UI Documentation](http://localhost:8080/api/docs)**

```
                          +-------------------------+
                          | Webhook Providers       |
                          | (Stripe, GitHub, etc.)  |
                          +------------+------------+
                                       |
                                       | HTTP POST /ingest/:tunnelId
                                       v
                          +-------------------------+
                          | Express HTTP Gateway    |
                          | (Port 8080)             |
                          +------------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
        +---------------------+                 +---------------------+
        | Redis Pub/Sub       |                 | PostgreSQL 16       |
        | (Message Broker)    |                 | (Audit Logs & State)|
        +----------+----------+                 +---------------------+
                   |
                   v
        +---------------------+
        | WebSocket Server    |
        | (Port 8081)         |
        +----------+----------+
                   |
                   | WSS Tunnel Connection
                   v
        +---------------------+                 +---------------------+
        | Go CLI Client       |                 | React Dashboard UI  |
        | (relay connect)     |                 | (Live Event Viewer) |
        +----------+----------+                 +---------------------+
                   |
                   | Forward Request (X-Request-ID)
                   v
        +---------------------+
        | Local Application   |
        | (localhost:3000)    |
        +---------------------+
```

---

## 💻 CLI Usage Examples

### 1. Authenticate CLI
Authenticate your local environment with the server using your API token or user credentials:
```bash
./cli/bin/relay login --token whr_token_abc123xyz
```

### 2. Connect Tunnel Gateway
Establish a real-time WebSocket tunnel forwarding incoming webhooks to `localhost:3000`:
```bash
./cli/bin/relay connect --port 3000 --subdomain stripe-demo
```
*Console Output*:
```text
🌐 Connecting to Webhook Relay Gateway at ws://localhost:8081...
⚡ Tunnel Established Successfully!
   Public Ingress URL:  http://localhost:8080/ingest/stripe-demo
   Forwarding Traffic:  http://localhost:3000
   Subdomain:           stripe-demo

press Ctrl+C to disconnect tunnel
  ✔ [POST] http://localhost:3000 [req:demo-req-id-99001] -> 200 OK (14ms)
```

### 3. Verbose Debug Mode
Enable detailed debug logs and output:
```bash
./cli/bin/relay connect --port 3000 --subdomain stripe-demo --verbose
```

### 4. Check Status & Version
```bash
./cli/bin/relay status
./cli/bin/relay version
```

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **CLI Client** | Go 1.24, Cobra CLI, `log/slog` | High-performance binary for local port forwarding and tunneling. |
| **Backend Gateway** | Node.js 22, Express, Winston, `ws` | HTTP ingress gateway and WebSocket connection handling. |
| **Web Dashboard** | React 19, Vite, TailwindCSS | Real-time browser UI for inspecting, filtering, and replaying webhooks. |
| **Message Broker** | Redis 7 (Pub/Sub) | Decouples HTTP ingestion from WebSocket client connections. |
| **Database** | PostgreSQL 16 | Persistent historical audit log for webhook requests and responses. |
| **Orchestration** | Docker, Docker Compose | Unified local development database environment. |
| **CI/CD Pipeline** | GitHub Actions | Parallel automated testing, linting, and build verification. |

---

## 🔧 Troubleshooting Guide

| Issue / Symptom | Possible Cause | Resolution |
| :--- | :--- | :--- |
| **Exit Code 2: Connection Error** | Server or database infrastructure containers not running. | Run `make db` to start Postgres & Redis containers, then start server with `cd server && npm run dev`. |
| **Exit Code 1: Authentication Failed** | Missing or invalid token provided during connect. | Execute `./cli/bin/relay login --token <TOKEN>` or pass `--token <TOKEN>` directly to `relay connect`. |
| **502 Bad Gateway (CLI log)** | Local application is not running on target port (e.g. `3000`). | Ensure your local app server is running on `http://localhost:<port>`. |
| **Port EADDRINUSE (8080 / 8081)** | Another process is occupying the server gateway HTTP/WS ports. | Terminate the process using `lsof -i :8080` or `lsof -i :8081` and kill the PID. |
| **Missing Log Files** | Log directory write permissions. | Logs are created at `server/logs/relay-%DATE%.log` and `~/.webhookrelay/relay.log`. |

---

## 📂 Monorepo Structure

```
webhookrelay/
├── .github/
│   └── workflows/          # GitHub Actions CI Workflows
│       ├── cli.yml         # Go CLI formatting, vet, race tests & multi-platform build
│       ├── server.yml      # Express server linting, Jest/Node tests & coverage
│       └── web.yml         # React web linting & Vite build
├── cli/                    # Go Command Line Interface
│   ├── bin/                # Compiled binary outputs
│   ├── cmd/                # Cobra commands (root, connect, login, status, version)
│   ├── internal/           # Config, logger (slog), tunnel engine, UI
│   ├── go.mod              # Go module definition
│   └── main.go             # CLI entrypoint
├── docs/                   # Documentation, Specifications & Reports
│   ├── api/                # REST & WebSocket protocol specs
│   ├── architecture/       # System diagrams & sequence flows
│   ├── demos/              # Month 1 Loom video demo walkthrough script
│   ├── perf-baseline.md    # Load benchmark report (100 webhooks / 10s)
│   └── week-reports/       # Weekly progress engineering reports (01-04)
├── server/                 # Node.js Express & WebSocket Gateway
│   ├── db/                 # PostgreSQL 16 schema SQL migrations & seed
│   ├── logs/               # Winston daily rotated server log files
│   ├── src/
│   │   ├── config/         # Database, Redis & Swagger configuration
│   │   ├── controllers/    # Auth, endpoint, ingest & token controllers
│   │   ├── middleware/     # Auth, CORS, requestId, 404 & 500 error handlers
│   │   ├── routes/         # Express HTTP route definitions
│   │   ├── utils/          # JWT, URL, Winston logger, Error helpers
│   │   ├── ws/             # WebSocket tunnel connection handler
│   │   └── index.js        # Express & WS server entrypoint
│   ├── test/               # Integration test suites (31 passing tests)
│   └── package.json        # Server dependencies & scripts
├── web/                    # React Web Inspection Dashboard
│   ├── src/                # UI components & state management
│   ├── index.html          # Dashboard HTML template
│   └── package.json        # Frontend dependencies & scripts
├── docker-compose.yml      # Postgres 16 & Redis 7 stack configuration
├── Makefile                # Unified developer project commands
└── README.md               # Repository documentation
```

---

## ⚡ Quickstart Commands

### 1. Setup Dependencies & Environment
```bash
# Clone the repository
git clone https://github.com/Ahsan-Qamar-47/webhookrelay.git
cd webhookrelay

# Install dependencies across server, web, and cli
make install

# Start PostgreSQL and Redis infrastructure containers
make db

# Execute database migrations & load seed data
cd server && npm run db:migrate && npm run db:seed && cd ..
```

### 2. Build & Run Components
```bash
# Build the Go CLI binary
make cli

# Run CLI version check
./cli/bin/relay version

# Start Backend Server (HTTP :8080 & WS :8081)
cd server && npm run dev

# Start Web Dashboard (Vite :5173) in a separate terminal
cd web && npm run dev
```

### 3. Verification & Testing
```bash
# Verify health endpoint
curl http://localhost:8080/health

# Run load benchmark (100 webhooks in 10s)
node server/src/tests/load.js

# Execute unit test suites across CLI and Server
make test
```

---

## 📅 16-Week Project Roadmap

| Phase | Timeline | Focus Area | Key Milestones & Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Weeks 1–4** | **Core Monorepo & Tunneling** | Monorepo setup, CI/CD, Go CLI connection engine, Express HTTP Ingress, Redis Pub/Sub integration, WSS streaming, Month 1 Gate release. |
| **Phase 2** | **Weeks 5–8** | **Inspection UI & Webhook Replay** | React dashboard, live stream event view, body/header diffing, payload modification, single-click replay functionality. |
| **Phase 3** | **Weeks 9–12** | **Auth, Multi-Tenancy & Security** | Token authentication, custom subdomains, secret masking, Postgres event audit retention, rate limiting. |
| **Phase 4** | **Weeks 13–16** | **Cloud Deploy & Monetization** | Helm chart / Docker distribution, usage metering, SaaS billing integration, docs polish & v1.0 Release. |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
