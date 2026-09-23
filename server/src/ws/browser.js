import { verifyToken } from '../utils/jwt.js';
import { redisSubscriber } from '../config/redis.js';
import { query } from '../config/db.js';

// Connection registry for browser client WebSockets: Map<endpointId, Set<WebSocket>>
export const browserRegistry = new Map();

/**
 * Helper to send JSON frame over WebSocket
 */
function sendFrame(ws, type, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
  }
}

/**
 * Register a browser socket for a specific endpoint
 */
async function registerBrowserSocket(endpointId, userId, ws) {
  if (!browserRegistry.has(endpointId)) {
    browserRegistry.set(endpointId, new Set());
  }
  browserRegistry.get(endpointId).add(ws);

  ws.endpointId = endpointId;
  ws.userId = userId;

  const channel = `endpoint:${endpointId}`;
  try {
    await redisSubscriber.subscribe(channel);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Browser WS Subscribed] Channel: ${channel}`);
    }
  } catch (err) {
    console.error(`[Browser WS Redis Subscribe Error] ${err.message}`);
  }
}

/**
 * Unregister a browser socket
 */
function unregisterBrowserSocket(ws) {
  const { endpointId } = ws;
  if (endpointId && browserRegistry.has(endpointId)) {
    const socketSet = browserRegistry.get(endpointId);
    socketSet.delete(ws);
    if (socketSet.size === 0) {
      browserRegistry.delete(endpointId);
    }
  }
}

/**
 * Dispatch Redis events to connected browser sockets
 */
redisSubscriber.on('message', (channel, messageStr) => {
  try {
    if (!channel.startsWith('endpoint:')) return;
    const endpointId = channel.replace('endpoint:', '');

    if (browserRegistry.has(endpointId)) {
      const eventPayload = JSON.parse(messageStr);
      const sockets = browserRegistry.get(endpointId);
      for (const ws of sockets) {
        sendFrame(ws, 'EVENT_NEW', eventPayload);
      }
    }
  } catch (err) {
    console.error(`[Browser WS Dispatch Error] ${err.message}`);
  }
});

/**
 * Setup WebSocket Server listener for Browser Clients
 */
export default function setupBrowserWS(wss) {
  wss.on('connection', async (ws, req) => {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const token = parsedUrl.searchParams.get('token');
      const endpointId = parsedUrl.searchParams.get('endpoint') || parsedUrl.searchParams.get('endpointId');

      if (!token) {
        sendFrame(ws, 'ERROR', { code: 'UNAUTHORIZED', message: 'Missing JWT token query parameter.' });
        return ws.close(4001, 'Unauthorized');
      }

      // Verify JWT
      let decoded = null;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        sendFrame(ws, 'ERROR', { code: 'INVALID_TOKEN', message: 'JWT token invalid or expired.' });
        return ws.close(4001, 'Invalid Token');
      }

      const userId = decoded.id;

      // If endpointId supplied, verify user ownership
      if (endpointId) {
        const epRes = await query('SELECT id FROM endpoints WHERE id = $1 AND user_id = $2;', [endpointId, userId]);
        if (epRes.rows.length === 0) {
          sendFrame(ws, 'ERROR', { code: 'FORBIDDEN', message: 'Endpoint not found or unauthorized.' });
          return ws.close(4003, 'Forbidden');
        }
        await registerBrowserSocket(endpointId, userId, ws);
      } else {
        // Register to default user endpoint stream if endpointId not explicit
        const epRes = await query('SELECT id FROM endpoints WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;', [userId]);
        if (epRes.rows.length > 0) {
          await registerBrowserSocket(epRes.rows[0].id, userId, ws);
        }
      }

      sendFrame(ws, 'CONNECTED', {
        message: 'Browser WebSocket stream established.',
        endpoint_id: ws.endpointId,
        user_id: userId,
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'PING') {
            sendFrame(ws, 'PONG', { timestamp: Date.now() });
          }
        } catch {
          // Ignore invalid frames
        }
      });

      ws.on('close', () => {
        unregisterBrowserSocket(ws);
      });
    } catch (err) {
      console.error(`[Browser WS Connection Error] ${err.message}`);
      ws.close(4000, 'Server Error');
    }
  });
}
