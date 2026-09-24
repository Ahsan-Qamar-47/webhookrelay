# Midterm Presentation & Live Demo Script

**Target Duration**: 5 – 7 Minutes  
**Audience**: Academic Advisor & Project Evaluation Panel  
**Presenter**: Development Team  

---

## Timed Segment Breakdown

| Segment | Topic | Target Time | Key Actions & Visuals |
|---|---|:---:|---|
| **Section 1** | Intro & Problem Statement | 0:00 – 0:30 (30s) | Slides / Overview |
| **Section 2** | User Signup & Authentication | 0:30 – 1:00 (30s) | Live Dashboard UI |
| **Section 3** | Tunnel Endpoint Provisioning | 1:00 – 1:30 (30s) | Endpoints Management |
| **Section 4** | CLI Tunnel Daemon Connection | 1:30 – 2:00 (30s) | Terminal CLI Handshake |
| **Section 5** | Live Webhook Ingestion (Stripe) | 2:00 – 3:00 (60s) | Demo Trigger Script |
| **Section 6** | Inspector, Headers & JSON Diff | 3:00 – 4:00 (60s) | Event Detail & Diff Engine |
| **Section 7** | Event Replay & Local Execution | 4:00 – 5:00 (60s) | Replay Audit History |
| **Section 8** | Benchmark Metrics & Q&A | 5:00 – 5:30 (30s) | Final Slide & Questions |

---

## Detailed Script & Presenter Spoken Notes

### Section 1: Introduction & Problem Statement (0:00 – 0:30)
- **Presenter Spoken Notes**:
  > *"Good morning. Today we present **WebhookRelay**, an enterprise-grade developer platform for capturing, inspecting, debugging, and replaying webhooks in real time. Local development with third-party webhooks—like Stripe, GitHub, or WhatsApp—is traditionally painful: developers face public IP provisioning issues, lost payload events, and broken signature validations. WebhookRelay solves this by acting as a high-speed secure tunnel gateway between public SaaS providers and localhost application servers."*

---

### Section 2: Account Creation & Onboarding Wizard (0:30 – 1:00)
- **Live Action**:
  - Open browser at `http://localhost:5173`.
  - Show the glassmorphism dashboard and navigate to **Onboarding Wizard** (`/onboarding`).
- **Presenter Spoken Notes**:
  > *"Here we have the WebhookRelay web portal. When a developer registers, they are guided through a 5-step onboarding wizard. In one click, the platform provisions an isolated public endpoint URL and generates a secure API token."*

---

### Section 3: Tunnel Endpoint Provisioning (1:00 – 1:30)
- **Live Action**:
  - Click **Endpoints** tab in navigation sidebar.
  - Highlight pre-provisioned endpoint `stripe-demo` (`https://relay.local:8080/ingest/stripe-demo`).
- **Presenter Spoken Notes**:
  > *"In the Endpoints view, developers can manage their active web tunnels, rotate signing secrets, and specify local forwarding targets. Each tunnel is uniquely addressed and indexed in PostgreSQL."*

---

### Section 4: CLI Tunnel Connection & Handshake (1:30 – 2:00)
- **Live Action**:
  - Open terminal window alongside the browser inspector.
  - Run simulated CLI connection command or pre-recorded CLI stream:
    ```bash
    relay connect --token demo_cli_token_9988 --tunnel stripe-demo --target http://localhost:3000/api/webhooks
    ```
- **Presenter Spoken Notes**:
  > *"On the terminal side, our developer CLI establishes a persistent WebSocket stream with the WebhookRelay gateway. The initial framing exchange exchanges JWT credentials and registers the socket into our Redis Pub/Sub topology."*

---

### Section 5: Live Webhook Ingestion (Stripe Trigger) (2:00 – 3:00)
- **Live Action**:
  - Execute live trigger script: `node server/scripts/demo-triggers.js`.
  - Watch incoming `Stripe invoice.paid` event pop up in real time on the Events feed with flash animation.
- **Presenter Spoken Notes**:
  > *"Now, we simulate an incoming webhook from Stripe. As soon as Stripe hits our public ingestion endpoint, the event is persisted into PostgreSQL, published via Redis Pub/Sub, and streamed instantly to both our browser inspector and CLI client in less than 20 milliseconds."*

---

### Section 6: Inspector, Preserved Signatures & JSON Diff (3:00 – 4:00)
- **Live Action**:
  - Click on the incoming Stripe event to open **Event Detail View**.
  - Highlight **"Stripe-Signature Preserved"** security badge.
  - Switch to **Headers** tab, demonstrate Copy-as-cURL button.
  - Switch to **JSON Diff** tab, comparing `evt_101` with `evt_102`.
- **Presenter Spoken Notes**:
  > *"In the Inspector View, we preserve exact raw request bytes and headers—including `Stripe-Signature` and `X-GitHub-Event`—ensuring cryptographic signature verification never fails in user apps. Developers can search headers, export full requests as cURL commands, and compare modified payload structures using our side-by-side JSON Diff engine."*

---

### Section 7: Event Replay & Local Execution (4:00 – 5:00)
- **Live Action**:
  - Click **Replay Event** button in the header card.
  - Observe instant optimistic UI entry in **Replay History** tab (`200 OK`, latency `18ms`).
- **Presenter Spoken Notes**:
  > *"When debugging local code changes, developers can re-fire any captured historical event with a single click. Our TanStack Query optimistic mutation updates the replay audit trail immediately, while the backend forwards the request payload to the local endpoint."*

---

### Section 8: Benchmark Performance Metrics & Q&A (5:00 – 5:30)
- **Live Action**:
  - Display load test summary slide or [load-test.md](../perf/load-test.md) report.
- **Presenter Spoken Notes**:
  > *"To validate production readiness, we conducted high-concurrency load benchmarks: under 1,000 continuous requests across 25 parallel worker connections, WebhookRelay sustained over **1,500 requests per second** with **zero data loss (0.00%)** and a **p99 latency of just 59 ms**. Thank you, and we welcome any questions."*
