# Week 5 Architecture & Component Implementation Plan
## Milestone: "Webhook Payload Inspector UI with Headers & JSON Diff"

---

## 1. Milestone Overview

Week 5 marks the beginning of **Phase 2: Inspection UI & Webhook Replay**. The primary goal is to build an interactive, high-performance React dashboard UI allowing developers to inspect incoming webhook payloads in real time, view HTTP headers, examine JSON payload diffs, and replay webhooks to local destination servers with a single click.

---

## 2. React Components Architecture

```
+-----------------------------------------------------------------------------------+
| React Inspection Dashboard                                                         |
| +----------------------------------+--------------------------------------------+ |
| | EventList (Sidebar Feed)         | EventDetail (Main Inspector)               | |
| | - Provider Badge (Stripe/GitHub) | +----------------------------------------+ | |
| | - Method Badge (POST/GET)        | | EventHeader (Event ID, Status, Latency) | | |
| | - Status Badge (202 / 200 / 502) | +----------------------------------------+ | |
| | - Request ID tag [req:...]       | | Navigation Tabs:                         | | |
| | - Timestamp & Latency (14ms)     | | [Headers] [Payload] [Response] [Diff]    | | |
| |                                  | +----------------------------------------+ | |
| | Search & Provider Filter Bar     | | Tab Content Pane:                        | | |
| +----------------------------------+ | - HeaderInspector Table                  | | |
|                                    | - JsonViewer / Formatted Body              | | |
|                                    | - JsonDiffInspector Component             | | |
|                                    | - ReplayButton Action Controls             | | |
|                                    | +----------------------------------------+ | |
| +----------------------------------+--------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### Component Breakdown:

1. **`EventList` Component**:
   - Live-updating virtualized list of webhook events connected to SSE or WebSocket stream.
   - Filters: Provider (Stripe, GitHub, Shopify, Twilio, Generic), Method (POST, GET), Status (Pending, Relayed, Failed).
   - Display: Provider icon/badge, event name/type, HTTP method, timestamp, latency badge, request ID tag.

2. **`EventDetail` Component**:
   - Primary inspection workspace for the selected event.
   - Tabs: **Summary**, **Headers**, **Payload / Body**, **Response**, and **JSON Diff**.
   - Includes **ReplayButton** action control.

3. **`HeaderInspector` Component**:
   - Tabular key-value display of HTTP headers.
   - Highlighting for signature headers (`Stripe-Signature`, `X-Hub-Signature-256`) and request tracing headers (`X-Request-ID`).
   - One-click "Copy as Header Array" or "Copy as cURL".

4. **`JsonDiffInspector` Component**:
   - Visual side-by-side or inline JSON diffing view comparing:
     - Original incoming request payload vs modified payload draft.
     - Expected schema payload vs actual received payload.
   - Colorized insertions (green), deletions (red), and modifications (yellow).

5. **`ReplayButton` Component**:
   - Single-click action button triggering `POST /api/events/:id/replay`.
   - Option to edit payload or target URL before triggering replay.
   - Real-time feedback with spinner and latency badge.

---

## 3. Required API Endpoints Specification

| Method | Endpoint Path | Description | Query / Body Params | Response Payload |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/endpoints/:id/events` | List historical webhook events for an endpoint. | `page`, `limit`, `provider`, `status`, `search` | `{ success: true, data: { events: [...], pagination: {...} } }` |
| **GET** | `/api/events/:id` | Fetch full event details including headers and payload. | `id` (UUID) | `{ success: true, data: { event: {...} } }` |
| **POST** | `/api/events/:id/replay` | Replay event payload to destination target URL. | `{ targetUrl?: string, payload?: object }` | `{ success: true, data: { replayResult: {...} } }` |
| **GET** | `/api/events/:id/diff` | Calculate JSON diff against previous event or target. | `compareId` (UUID) | `{ success: true, data: { diff: [...] } }` |

---

## 4. Daily Execution Schedule (Week 5)

- **Day 21**: Scaffolding UI layout, responsive grid split view, and `EventList` feed component.
- **Day 22**: Build `EventDetail` inspector and `HeaderInspector` key-value table views.
- **Day 23**: Integrate `JsonDiffInspector` syntax highlighting and diffing engine.
- **Day 24**: Implement `ReplayButton` and wire `POST /api/events/:id/replay` API endpoint.
- **Day 25**: Integration testing, responsive UI styling polish, and Week 5 progress report submission.
