# Stripe Webhook Integration Guide

This guide details how to set up, test, and verify **Stripe Webhooks** with **WebhookRelay** during local development.

---

## 1. Overview & Architecture Flow

WebhookRelay acts as a transparent, high-performance webhook proxy. Incoming HTTP POST callbacks from Stripe are received by WebhookRelay's Ingestion Gateway, logged to PostgreSQL, streamed via WebSockets, and forwarded in real-time to your local application server (`http://localhost:3000/api/webhooks/stripe`).

```
+----------------+      +-----------------------+      +-------------------+      +-------------------------+
| Stripe Cloud   | ---> | WebhookRelay Ingest   | ---> | WebhookRelay CLI  | ---> | Local Application Server |
| (Test Webhook) |      | /ingest/:subdomain    |      | (relay connect)   |      | http://localhost:3000   |
+----------------+      +-----------------------+      +-------------------+      +-------------------------+
                                 |                              |
                                 v                              v
                        PostgreSQL Audit Log           Inspector UI Monitor
```

---

## 2. Task 26.1: Stripe Test Account & API Keys Setup

1. **Enable Test Mode**: Log into the [Stripe Dashboard](https://dashboard.stripe.com/) and ensure the **Test Mode** toggle is enabled (top right corner).
2. **API Keys**: Navigate to **Developers > API Keys**:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`
3. **Sample Product & Subscription**:
   - Navigate to **Product Catalog > Add Product**.
   - Create a test subscription product (e.g., "Pro Developer Plan - $49/mo").
4. **Webhook Signing Secret**:
   - Webhook signing secrets follow the format `whsec_...`.
   - Store this secret in your local application environment variables (`STRIPE_WEBHOOK_SECRET=whsec_...`).

---

## 3. Task 26.2: Webhook Endpoint Configuration

1. In the Stripe Dashboard, navigate to **Developers > Webhooks**.
2. Click **+ Add Endpoint**.
3. **Endpoint URL**: Enter your provisioned WebhookRelay ingest URL:
   ```
   http://localhost:8080/ingest/dev-tunnel-99
   ```
   *(Or your public tunnel domain if deployed on remote server)*.
4. **Events to Send**: Select the following events:
   - `invoice.paid`
   - `customer.created`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
5. Click **Add Endpoint**.

---

## 4. Task 26.3: Stripe CLI Local Testing & Trigger Workflow

The Stripe CLI allows you to trigger synthetic test webhooks locally without needing real credit card transactions.

### Installation
- **macOS (Homebrew)**: `brew install stripe/stripe-cli/stripe`
- **Linux (Debian/Ubuntu)**:
  ```bash
  curl -s https://packages.stripe.dev/stripecli-debian-local.repo | sudo tee /etc/apt/sources.list.d/stripe.list
  sudo apt-get update
  sudo apt-get install stripe
  ```

### Authentication & Forwarding
1. Authenticate Stripe CLI:
   ```bash
   stripe login
   ```
2. Start WebhookRelay local tunnel:
   ```bash
   relay connect --to http://localhost:3000
   ```
3. Trigger synthetic Stripe webhooks:
   ```bash
   # Trigger invoice.paid event
   stripe trigger invoice.paid

   # Trigger payment_intent.succeeded event
   stripe trigger payment_intent.succeeded

   # Trigger customer.created event
   stripe trigger customer.created
   ```

### Verification
- Check the **WebhookRelay Inspector UI** (`http://localhost:5173`):
  - Verify incoming events arrive in the live feed.
  - Verify status code `200 OK` and latency metric.
- Check your local application terminal (`http://localhost:3000`):
  - Verify payload received by your HTTP route handler.

---

## 5. Task 26.4: Stripe Signature Verification Architecture

> [!IMPORTANT]
> **Signature Verification Location**: Stripe webhook signature verification (`stripe.webhooks.constructEvent`) occurs **inside your local application server (`localhost:3000`)**, NOT inside WebhookRelay.
>
> WebhookRelay acts as a transparent payload proxy, preserving the exact raw request body and all HTTP headers (`Stripe-Signature`).

### Example Node.js Local App Signature Verification (`localhost:3000/api/webhooks/stripe`):

```javascript
import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // whsec_...

const app = express();

// Use raw body parser for Stripe signature verification
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Construct and verify event signature using preserved raw body & header
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the verified event
  switch (event.type) {
    case 'invoice.paid':
      const invoice = event.data.object;
      console.log(`✅ Invoice ${invoice.id} paid successfully!`);
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent ${paymentIntent.id} succeeded!`);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(3000, () => console.log('Local app listening on port 3000'));
```

### Key Security Points:
- **Raw Body Integrity**: WebhookRelay preserves original JSON bytes to ensure HMAC-SHA256 signature calculations match.
- **Header Preservation**: The `Stripe-Signature` header (containing timestamp `t=` and v1 signature hash `v1=`) is preserved verbatim in the relayed request envelope.
- **Inspector UI**: In the WebhookRelay Inspector UI, a badge reading **"Stripe-Signature Preserved"** indicates that signature headers are intact for local SDK verification.
