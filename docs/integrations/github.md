# GitHub Webhook Integration Guide

This guide details how to set up, test, and verify **GitHub Webhooks** with **WebhookRelay** during local software development.

---

## 1. Overview & Event Pipeline

WebhookRelay captures incoming HTTP callbacks from GitHub repositories, logs them to PostgreSQL, broadcasts them via WebSockets, and forwards them in real-time to your local application server (`http://localhost:3000/api/webhooks/github`).

```
+------------------+      +-----------------------+      +-------------------+      +-------------------------+
| GitHub Cloud     | ---> | WebhookRelay Ingest   | ---> | WebhookRelay CLI  | ---> | Local Application Server |
| (push/PR event)  |      | /ingest/:subdomain    |      | (relay connect)   |      | http://localhost:3000   |
+------------------+      +-----------------------+      +-------------------+      +-------------------------+
                                   |                              |
                                   v                              v
                          PostgreSQL Audit Log           Inspector UI Monitor
```

---

## 2. Task 27.1: GitHub Test Repository & Credentials Setup

1. **Create Test Repository**:
   - Go to GitHub and click **New Repository** (e.g., `webhook-relay-test-repo`).
   - Initialize with a `README.md`.
2. **Generate Personal Access Token (PAT)**:
   - Navigate to **GitHub Settings > Developer Settings > Personal Access Tokens (Tokens classic)**.
   - Click **Generate new token (classic)**.
   - Select scopes: `repo` and `admin:repo_hook`.
   - Save your token securely (`ghp_...`).

---

## 3. Task 27.2: Webhook Endpoint Configuration in GitHub

1. In your GitHub repository, navigate to **Settings > Webhooks**.
2. Click **Add webhook**.
3. **Payload URL**: Enter your provisioned WebhookRelay ingest URL:
   ```
   http://localhost:8080/ingest/dev-tunnel-99
   ```
   *(Or your public tunnel domain if deployed on remote server)*.
4. **Content type**: Select `application/json`.
5. **Secret**: Enter your shared secret key (e.g. `my_github_secret_123`).
6. **Which events would you like to trigger this webhook?**:
   - Select **Let me select individual events**:
     - `Pushes` (`push`)
     - `Pull requests` (`pull_request`)
     - `Issues` (`issues`)
     - `Issue comments` (`issue_comment`)
7. Click **Add webhook**.
8. **Ping Verification**: GitHub automatically sends a `ping` event envelope upon creation. Verify that WebhookRelay receives the `ping` event with HTTP status `202 Accepted` / `200 OK`.

---

## 4. Task 27.3: Triggering GitHub Events & Local Forwarding

1. **Start WebhookRelay local tunnel**:
   ```bash
   relay connect --to http://localhost:3000
   ```
2. **Trigger `push` Event**:
   ```bash
   git commit -am "test: trigger github webhook"
   git push origin main
   ```
3. **Trigger `pull_request` Event**:
   ```bash
   git checkout -b feature/test-branch
   git push origin feature/test-branch
   ```
   - Open a Pull Request on GitHub.
4. **Trigger `issue_comment` Event**:
   - Create a test issue on GitHub and add a comment.

### Verification
- Open the **WebhookRelay Inspector UI** (`http://localhost:5173`):
  - Verify `push`, `pull_request`, and `issue_comment` events appear in the live feed.
  - Notice the **GitHub Event Badge** (`X-GitHub-Event: push`) and the **"View on GitHub"** direct link button.

---

## 5. Task 27.4: GitHub Signature Verification (`X-Hub-Signature-256`)

> [!IMPORTANT]
> **Signature Verification**: GitHub signs payloads using HMAC-SHA256 (`X-Hub-Signature-256`).
> WebhookRelay preserves the raw JSON body payload and `X-Hub-Signature-256` header intact, allowing your local application server (`localhost:3000`) to compute and verify signatures safely using official crypto functions.

### Example Node.js Local App Verification (`localhost:3000/api/webhooks/github`):

```javascript
import express from 'express';
import crypto from 'node:crypto';

const app = express();
const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'my_github_secret_123';

app.post('/api/webhooks/github', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  if (!signature) {
    return res.status(401).send('Missing X-Hub-Signature-256 header');
  }

  // Calculate HMAC SHA256 digest
  const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
  const digest = 'sha256=' + hmac.update(req.body).digest('hex');

  // Timing-safe compare
  const isMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  if (!isMatch) {
    console.error('⚠️ GitHub signature verification failed!');
    return res.status(403).send('Invalid signature');
  }

  console.log(`✅ GitHub event '${event}' verified!`);
  
  const payload = JSON.parse(req.body.toString());
  if (event === 'push') {
    console.log(`Pushed to ${payload.ref} by ${payload.pusher.name}`);
  } else if (event === 'pull_request') {
    console.log(`PR #${payload.number} ${payload.action}: ${payload.pull_request.title}`);
  }

  res.json({ success: true });
});

app.listen(3000, () => console.log('Local app listening on port 3000'));
```

### Key UI Features for GitHub Webhooks:
- **`X-GitHub-Event` Header Parsing**: Extracted and rendered as a visual badge (e.g. `push`, `pull_request`, `issue_comment`).
- **Deep Linking**: Extracts `repository.html_url`, `pull_request.html_url`, or `issue.html_url` and displays a direct **"View on GitHub"** button.
