# Software Requirements Specification (SRS)
## Webhook Relay Service

---

### Section 1: Problem Statement

Modern web applications increasingly rely on third-party webhook integrations (e.g., Stripe payment processing, GitHub event hooks, Shopify order updates, Twilio SMS callbacks). During local software development, receiving these external HTTP callbacks presents major operational friction:

1. **Network Inaccessibility**: Local development machines operate behind NAT routers, private IP subnets, and strict firewall configurations, making them inaccessible to external cloud providers.
2. **Third-Party Integration Friction**: Developers are forced to either deploy early to remote staging environments or rely on third-party SaaS tunneling services, which often suffer from session timeout limits, bandwidth throttling, pricing paywalls, or privacy concerns regarding payload exposure.
3. **Lack of Inspection & Replay Tools**: When webhooks fail locally, reproducing identical header states, signatures, and JSON payloads is tedious without built-in capture, logging, and replaying mechanisms.

Webhook Relay solves these challenges by providing a developer-first, self-hostable, low-latency webhook tunneling and inspection framework.

---

### Section 2: Project Goal

The primary goal of the **Webhook Relay** project is to deliver a secure, scalable, enterprise-grade open-source webhook tunneling system consisting of:
- A high-performance **Go CLI client** (`relay`) for exposing local HTTP ports to public endpoints.
- A robust **Node.js Express & WebSocket Gateway Server** for receiving, logging, and routing incoming webhook payloads in real time.
- A **Redis Pub/Sub & PostgreSQL** infrastructure layer for low-latency message distribution and historical audit persistence.
- An interactive **React Dashboard UI** for live event monitoring, body/header inspection, and single-click webhook replaying.

---

### Section 3: Stakeholders

| Stakeholder Category | Role / Group | Responsibilities & Interests |
| :--- | :--- | :--- |
| **Primary Stakeholders** | Backend & Full-Stack Developers | Require reliable, sub-second webhook tunneling to local ports (`localhost:3000`), payload inspection, CLI simplicity, and webhook replay functionality during active development. |
| **Secondary Stakeholders** | DevOps & Platform Engineers | Focused on self-hosting ease, multi-tenant isolation, minimal server resource utilization, Docker container deployment, and monitoring/health telemetry. |
| **Tertiary Stakeholders** | Enterprise Security & Compliance Teams | Concerned with end-to-end transport encryption (TLS/WSS), token-based authentication, secret masking in logs, and data retention policies. |

---

### Section 4: Functional Requirements

#### FR-1: Tunnel Establishment
- The CLI (`relay connect`) MUST establish an authenticated full-duplex WebSocket connection with the relay server.
- The server MUST assign a unique, deterministic or randomized `tunnelId` per session (e.g., `/ingest/:tunnelId`).
- Heartbeat ping/pong mechanisms MUST detect disconnected clients within 10 seconds.

#### FR-2: Webhook Ingestion & Routing
- The server MUST expose a public HTTP endpoint `/ingest/:tunnelId` supporting all standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- Upon receiving a request at `/ingest/:tunnelId`, the HTTP Gateway MUST format the incoming headers, body, query parameters, and verb into a standardized JSON envelope.
- The server MUST route the envelope over Redis Pub/Sub to the WebSocket worker handling the active tunnel, forwarding it to the CLI in real-time.

#### FR-3: Local Traffic Forwarding & Response Proxying
- The CLI MUST receive the forwarded webhook envelope over WebSocket and issue an identical local HTTP request to the target application (e.g., `http://localhost:3000/api/webhooks`).
- The CLI MUST capture the local application's HTTP status code, headers, and body response and send it back to the relay server to complete the HTTP exchange for the webhook provider.

#### FR-4: Inspection & Replay Engine
- The system MUST log all incoming webhooks into PostgreSQL with payload bodies, query strings, and request/response headers.
- The React Web Dashboard MUST display real-time incoming events.
- The React Web Dashboard and CLI MUST allow users to select any past webhook and re-trigger/replay it against local endpoints without needing third-party provider action.

#### FR-5: Authentication & Multi-Tenancy
- The backend MUST authenticate CLI connections via persistent API tokens or JWT credentials.
- The system MUST restrict tunnel access so that only authorized users can connect to assigned tunnel subdomains or IDs.

#### FR-6: Header & Payload Transformation
- The system MUST allow developers to inject custom headers (e.g., mock authorization headers or X-Forwarded-For headers) or modify payload bodies during relay or replay testing.

---

### Section 5: Non-Functional Requirements

#### NFR-1: Latency & Performance
- The end-to-end routing latency (from public HTTP ingest to CLI local request dispatch) MUST be less than **50ms** at the 95th percentile under normal load.

#### NFR-2: Throughput & Concurrency
- A single relay server node MUST support a minimum of **1,000 concurrent active WebSocket tunnels** and handle up to **1,000 requests per second (RPS)** without dropping incoming connections.

#### NFR-3: Security & Privacy
- All external communication MUST enforce TLS 1.3 for HTTPS ingest and WSS (WebSocket Secure) for tunnel streaming.
- Sensitive header values (e.g., `Authorization`, `Stripe-Signature`, `X-Hub-Signature`) MUST be masked in non-authenticated dashboard views or system logging streams according to configurable retention rules.

#### NFR-4: Availability & Resilience
- Server infrastructure MUST target **99.9% uptime**.
- If a client connection drops transiently, the CLI MUST implement exponential backoff re-connection logic, restoring tunnel routing seamlessly within 5 seconds of network restoration.

#### NFR-5: Maintainability & Portability
- All components MUST be containerized via Docker and orchestrated with Docker Compose.
- Monorepo build steps MUST complete in under 2 minutes, and unit/integration test suites MUST maintain >80% code coverage.

---

### Section 6: Out of Scope

The initial release (v1.0) explicitly excludes the following features:
1. **Custom Domain SSL Provisioning**: Automatic Let's Encrypt TLS certificate provisioning for custom user subdomains (deferred to v2.0).
2. **Raw TCP / UDP Tunneling**: Non-HTTP protocols such as SSH, gRPC raw sockets, or database tunneling.
3. **P2P Direct WebRTC Tunneling**: Webhook Relay routes strictly through central gateway infrastructure to guarantee logging and auditability.
4. **Permanent File Storage**: Video stream or large binary file (>10MB) proxying over webhooks.

---

### Section 7: Success Metrics

| Metric | Target Baseline | Measurement Method |
| :--- | :--- | :--- |
| **P95 Relay Latency** | `< 50ms` | Prometheus metrics on HTTP ingest to WS dispatch |
| **CLI Connection Setup** | `< 1.0s` | `relay connect` handshake roundtrip time |
| **Test Suite Coverage** | `> 80%` | Monorepo CI code coverage coverage reports |
| **Zero Data Loss** | `100% Delivery` | Zero dropped webhooks during active tunnel connection |
| **Developer Onboarding** | `< 3 minutes` | Time from `git clone` to executing first local tunnel test |
