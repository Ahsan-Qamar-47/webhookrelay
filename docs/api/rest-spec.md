# Webhook Relay — REST API Specification

**Version:** `1.0.0`  
**Base URL:** `http://localhost:8080` (Development) / `https://api.relay.dev` (Production)  
**Content-Type:** `application/json`  
**Authentication:** Bearer Token (`Authorization: Bearer <JWT_TOKEN>`) or API Key Header (`X-API-Key: <TOKEN>`)

---

## 📌 Overview

The Webhook Relay REST API allows developers and web application UI clients to:
- Authenticate users via local credentials or GitHub OAuth 2.0.
- Provision, list, and manage custom webhook tunnel endpoints.
- Query historical webhook ingestion events with headers, payloads, and execution latency.
- Trigger manual single-click payload replays against active tunnels or custom targets.
- Apply request payload and header transformations for simulation and debugging.

---

## 🔒 Authentication Endpoints

### 1. User Signup
- **Endpoint:** `POST /api/auth/signup`
- **Authentication:** None (Public)
- **Description:** Registers a new user account and returns an authentication JWT token.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "developer@example.com",
  "password": "SecurePassword123!",
  "name": "Alex Developer"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "developer@example.com",
      "name": "Alex Developer",
      "role": "user",
      "created_at": "2026-09-17T23:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-09-24T23:00:00.000Z"
  }
}
```

#### Error Responses
- **`400 Bad Request`** (Invalid email or weak password)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password must be at least 8 characters long and contain numbers and symbols."
  }
}
```
- **`409 Conflict`** (Email already registered)
```json
{
  "success": false,
  "error": {
    "code": "USER_EXISTS",
    "message": "User with this email address already exists."
  }
}
```

---

### 2. User Login
- **Endpoint:** `POST /api/auth/login`
- **Authentication:** None (Public)
- **Description:** Authenticates user credentials and issues a JWT token.

#### Request Body
```json
{
  "email": "developer@example.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "developer@example.com",
      "name": "Alex Developer",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-09-24T23:00:00.000Z"
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password provided."
  }
}
```

---

### 3. GitHub OAuth Login
- **Endpoint:** `POST /api/auth/oauth/github`
- **Authentication:** None (Public)
- **Description:** Authenticates or creates a user account using a GitHub OAuth 2.0 authorization code.

#### Request Body
```json
{
  "code": "7a94f09d8e3b2a1c4e5f"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b1ffcd88-8b0a-4df7-aa5c-5aa8ac270b22",
      "email": "github_user@example.com",
      "name": "GitHub User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "OAUTH_FAILED",
    "message": "Failed to exchange authorization code with GitHub OAuth server."
  }
}
```

---

### 4. Get Current User Profile
- **Endpoint:** `GET /api/me`
- **Authentication:** Bearer Token (`JWT`)
- **Description:** Fetches details and active subscription status of the authenticated user.

#### Request Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "developer@example.com",
      "name": "Alex Developer",
      "role": "user",
      "created_at": "2026-09-17T23:00:00.000Z"
    },
    "subscription": {
      "plan": "team",
      "status": "active",
      "current_period_end": "2026-10-17T23:00:00.000Z"
    }
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Bearer token."
  }
}
```

---

## 📡 Endpoint (Tunnel) Management Endpoints

### 5. List User Endpoints
- **Endpoint:** `GET /api/endpoints`
- **Authentication:** Bearer Token
- **Description:** Retrieves all webhook tunnel endpoints provisioned by the authenticated user.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "c2ddde77-7a09-4ce6-994b-4bb7ab160c33",
      "subdomain": "stripe-checkout",
      "destination_url": "http://localhost:3000/api/webhooks/stripe",
      "secret": "whsec_abc123xyz...",
      "is_active": true,
      "created_at": "2026-09-17T23:10:00.000Z"
    }
  ]
}
```

---

### 6. Provision New Endpoint
- **Endpoint:** `POST /api/endpoints`
- **Authentication:** Bearer Token
- **Description:** Provisions a new webhook tunnel subdomain and signing secret.

#### Request Body
```json
{
  "subdomain": "stripe-checkout",
  "destination_url": "http://localhost:3000/api/webhooks/stripe",
  "secret": "whsec_abc123xyz"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "c2ddde77-7a09-4ce6-994b-4bb7ab160c33",
    "subdomain": "stripe-checkout",
    "destination_url": "http://localhost:3000/api/webhooks/stripe",
    "public_url": "http://localhost:8080/ingest/stripe-checkout",
    "secret": "whsec_abc123xyz",
    "is_active": true,
    "created_at": "2026-09-17T23:10:00.000Z"
  }
}
```

#### Error Response (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "SUBDOMAIN_TAKEN",
    "message": "Subdomain 'stripe-checkout' is already in use by another tunnel."
  }
}
```

---

### 7. Delete Endpoint
- **Endpoint:** `DELETE /api/endpoints/:id`
- **Authentication:** Bearer Token
- **Description:** Removes a provisioned endpoint and closes any active connected WebSocket tunnels.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Endpoint 'c2ddde77-7a09-4ce6-994b-4bb7ab160c33' successfully deleted."
}
```

#### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "error": {
    "code": "ENDPOINT_NOT_FOUND",
    "message": "Endpoint with the specified ID does not exist."
  }
}
```

---

## ⚡ Webhook Events & Replay Endpoints

### 8. List Endpoint Webhook Events
- **Endpoint:** `GET /api/endpoints/:id/events`
- **Authentication:** Bearer Token
- **Query Parameters:**
  - `limit` (optional, default `20`): Number of events to return.
  - `offset` (optional, default `0`): Pagination offset.
  - `status` (optional): Filter by event status (`pending`, `relayed`, `failed`).
  - `provider` (optional): Filter by provider (`stripe`, `github`, etc.).
- **Description:** Returns historical webhook events captured by the specified endpoint.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "d3eeef66-6f08-4bd5-883a-3aa6ba050d44",
      "endpoint_id": "c2ddde77-7a09-4ce6-994b-4bb7ab160c33",
      "event_id": "evt_101_stripe",
      "provider": "stripe",
      "method": "POST",
      "status": "relayed",
      "response_status": 200,
      "latency_ms": 32,
      "received_at": "2026-09-17T23:12:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 9. Get Webhook Event Details
- **Endpoint:** `GET /api/events/:id`
- **Authentication:** Bearer Token
- **Description:** Retrieves complete request and response headers, JSON payload, and status for a single event.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "d3eeef66-6f08-4bd5-883a-3aa6ba050d44",
    "endpoint_id": "c2ddde77-7a09-4ce6-994b-4bb7ab160c33",
    "event_id": "evt_101_stripe",
    "provider": "stripe",
    "method": "POST",
    "headers": {
      "content-type": "application/json",
      "stripe-signature": "t=1600000,v1=9f82..."
    },
    "payload": {
      "id": "evt_101_stripe",
      "type": "payment_intent.succeeded",
      "data": {
        "amount": 2500,
        "currency": "usd"
      }
    },
    "response_status": 200,
    "response_headers": {
      "content-type": "application/json"
    },
    "response_body": "{\"status\":\"received\"}",
    "latency_ms": 32,
    "received_at": "2026-09-17T23:12:00.000Z"
  }
}
```

---

### 10. Replay Webhook Event
- **Endpoint:** `POST /api/events/:id/replay`
- **Authentication:** Bearer Token
- **Description:** Triggers an instant re-transmission of a past webhook event to the local target application.

#### Request Body (Optional Override)
```json
{
  "target_url": "http://localhost:3000/api/webhooks/stripe"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "replay_id": "e4fff055-5e07-4ac4-7729-2bb5a9040e55",
    "event_id": "d3eeef66-6f08-4bd5-883a-3aa6ba050d44",
    "status_code": 200,
    "response_body": "{\"status\":\"received\"}",
    "latency_ms": 28,
    "replayed_at": "2026-09-17T23:15:00.000Z"
  }
}
```

---

### 11. Transform & Simulate Webhook Event
- **Endpoint:** `POST /api/events/:id/transform`
- **Authentication:** Bearer Token
- **Description:** Modifies headers or payload of a past event and dispatches the transformed webhook envelope.

#### Request Body
```json
{
  "headers": {
    "x-custom-test-header": "mock_value"
  },
  "payload": {
    "id": "evt_101_stripe",
    "type": "payment_intent.succeeded",
    "data": {
      "amount": 9999,
      "currency": "eur"
    }
  },
  "target_url": "http://localhost:3000/api/webhooks/stripe"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "transformation_applied": true,
    "replay_id": "f5aaa144-4d06-3ab3-6618-1aa498030d66",
    "status_code": 200,
    "latency_ms": 30
  }
}
```
