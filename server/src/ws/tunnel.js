import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { verifyToken } from '../utils/jwt.js';
import { buildPublicUrl } from '../utils/url.js';
import { redisSubscriber } from '../config/redis.js';

// Connection registry: Map<subdomain, Set<WebSocket>>
export const registry = new Map();

// Active Redis subscriptions counter: Map<channel, number>
const activeSubscriptions = new Map();

/**
 * Helper to send JSON frame over WebSocket
 */
function sendFrame(ws, type, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

/**
 * Authenticate CLI token (JWT or API Token)
 */
async function authenticateToken(token) {
  if (!token) return null;

  // 1. Try JWT verification
  try {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      return { userId: decoded.id, type: 'jwt' };
    }
  } catch {
    // Not a valid JWT, proceed to API token check
  }

  // 2. Try API token check (whr_token_...)
  if (token.startsWith('whr_token_')) {
    const tokensRes = await query('SELECT id, user_id, token_hash FROM api_tokens;');
    for (const row of tokensRes.rows) {
      const match = await bcrypt.compare(token, row.token_hash);
      if (match) {
        // Update last_used_at
        await query('UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1;', [row.id]);
        return { userId: row.user_id, tokenId: row.id, type: 'api_token' };
      }
    }
  }

  return null;
}

/**
 * Register a socket to the connection registry & subscribe Redis
 */
async function registerSocket(subdomain, endpoint, ws) {
  if (!registry.has(subdomain)) {
    registry.set(subdomain, new Set());
  }
  registry.get(subdomain).add(ws);

  // Store metadata on socket
  ws.subdomain = subdomain;
  ws.endpointId = endpoint.id;
  ws.userId = endpoint.user_id;

  const channel1 = `endpoint:${endpoint.id}`;
  const channel2 = `tunnel:${subdomain}`;

  // Subscribe Redis channels if first client for this channel
  for (const channel of [channel1, channel2]) {
    const count = activeSubscriptions.get(channel) || 0;
    if (count === 0) {
      await redisSubscriber.subscribe(channel);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[WS Redis Subscribed] Channel: ${channel}`);
      }
    }
    activeSubscriptions.set(channel, count + 1);
  }
}

/**
 * Unregister a socket from connection registry & Redis
 */
async function unregisterSocket(ws) {
  const subdomain = ws.subdomain;
  const endpointId = ws.endpointId;

  if (subdomain && registry.has(subdomain)) {
    const socketSet = registry.get(subdomain);
    socketSet.delete(ws);
    if (socketSet.size === 0) {
      registry.delete(subdomain);
    }
  }

  if (endpointId && subdomain) {
    const channel1 = `endpoint:${endpointId}`;
    const channel2 = `tunnel:${subdomain}`;

    for (const channel of [channel1, channel2]) {
      const count = (activeSubscriptions.get(channel) || 1) - 1;
      if (count <= 0) {
        activeSubscriptions.delete(channel);
        try {
          await redisSubscriber.unsubscribe(channel);
        } catch {
          // Ignore error on cleanup
        }
      } else {
        activeSubscriptions.set(channel, count);
      }
    }
  }
}

// Global Redis Message Dispatcher to Registered WebSockets
redisSubscriber.on('message', (channel, messageStr) => {
  try {
    const eventPayload = JSON.parse(messageStr);
    const channelSubdomain = channel.startsWith('tunnel:') ? channel.replace('tunnel:', '') : null;

    if (channelSubdomain && registry.has(channelSubdomain)) {
      const sockets = registry.get(channelSubdomain);
      for (const ws of sockets) {
        sendFrame(ws, 'EVENT', eventPayload);
      }
    } else {
      // Broadcast to matching endpointId sockets
      for (const socketSet of registry.values()) {
        for (const ws of socketSet) {
          if (channel === `endpoint:${ws.endpointId}`) {
            sendFrame(ws, 'EVENT', eventPayload);
          }
        }
      }
    }
  } catch (err) {
    console.error(`[WS Redis Dispatch Error] ${err.message}`);
  }
});

export default function setupTunnel(wss) {
  wss.on('connection', async (ws, req) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[WS Connection Opened]');
    }

    // Attempt URL Query Param Auth (ws://host:8081?token=xyz&subdomain=abc)
    const parsedUrl = new URL(req.url, 'http://localhost');
    const queryToken = parsedUrl.searchParams.get('token');
    const querySubdomain = parsedUrl.searchParams.get('subdomain');

    if (queryToken && querySubdomain) {
      const auth = await authenticateToken(queryToken);
      if (auth) {
        const epRes = await query(
          'SELECT id, user_id, subdomain, destination_url, secret FROM endpoints WHERE subdomain = $1 AND user_id = $2;',
          [querySubdomain, auth.userId]
        );
        if (epRes.rows.length > 0) {
          const endpoint = epRes.rows[0];
          await registerSocket(endpoint.subdomain, endpoint, ws);
          sendFrame(ws, 'ACK', {
            status: 'connected',
            tunnel_id: endpoint.id,
            subdomain: endpoint.subdomain,
            public_url: buildPublicUrl(endpoint.subdomain),
          });
        }
      }
    }

    ws.on('message', async (data) => {
      try {
        let msg = null;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return sendFrame(ws, 'ERROR', { code: 'INVALID_JSON', message: 'Frame payload must be valid JSON.' });
        }

        const { type, payload } = msg;

        // 1. HANDSHAKE FRAME
        if (type === 'HANDSHAKE') {
          const { token, subdomain } = payload || {};
          if (!token || !subdomain) {
            return sendFrame(ws, 'ERROR', { code: 'MISSING_FIELDS', message: 'Token and subdomain are required in HANDSHAKE payload.' });
          }

          const auth = await authenticateToken(token);
          if (!auth) {
            return sendFrame(ws, 'ERROR', { code: 'AUTH_FAILED', message: 'Invalid or expired token provided in HANDSHAKE.' });
          }

          const epRes = await query(
            'SELECT id, user_id, subdomain, destination_url, secret FROM endpoints WHERE subdomain = $1 AND user_id = $2;',
            [subdomain, auth.userId]
          );

          if (epRes.rows.length === 0) {
            return sendFrame(ws, 'ERROR', { code: 'ENDPOINT_NOT_FOUND', message: `Subdomain '${subdomain}' not found or unauthorized.` });
          }

          const endpoint = epRes.rows[0];
          await registerSocket(endpoint.subdomain, endpoint, ws);

          return sendFrame(ws, 'ACK', {
            status: 'connected',
            tunnel_id: endpoint.id,
            subdomain: endpoint.subdomain,
            public_url: buildPublicUrl(endpoint.subdomain),
          });
        }

        // 2. REPLAY_RESULT FRAME
        if (type === 'REPLAY_RESULT') {
          const { event_id, status_code, headers, body, latency_ms } = payload || {};
          if (event_id) {
            await query(
              `UPDATE events
               SET status = 'relayed', response_status = $1, response_headers = $2, response_body = $3, latency_ms = $4
               WHERE id::text = $5 OR event_id = $5;`,
              [status_code || 200, JSON.stringify(headers || {}), typeof body === 'string' ? body : JSON.stringify(body), latency_ms || 0, event_id]
            );
          }
          return;
        }

        // 3. PING FRAME
        if (type === 'PING') {
          return sendFrame(ws, 'PONG', { timestamp: Date.now() });
        }
      } catch (err) {
        console.error(`[WS Message Handler Error] ${err.message}`);
        sendFrame(ws, 'ERROR', { code: 'INTERNAL_ERROR', message: err.message });
      }
    });

    ws.on('close', async () => {
      await unregisterSocket(ws);
      if (process.env.NODE_ENV !== 'test') {
        console.log('[WS Connection Closed]');
      }
    });
  });
}
