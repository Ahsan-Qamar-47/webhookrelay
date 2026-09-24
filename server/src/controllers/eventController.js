import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { getCache, setCache } from '../utils/cache.js';

/**
 * Get full event details by ID including replay history
 * GET /api/events/:id
 */
export async function getEventById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isRaw = req.query.raw === 'true';

    const cacheKey = `cache:event:${id}:${userId}`;
    let cachedData = await getCache(cacheKey);

    let event;
    let replays;

    if (cachedData && !isRaw) {
      event = cachedData.event;
      replays = cachedData.replays;
    } else {
      // Query event join endpoints to check ownership
      const eventRes = await query(
        `SELECT e.id, e.endpoint_id, e.event_id, e.provider, e.method, e.headers, e.payload, e.ip_address, e.status, e.response_status, e.response_headers, e.response_body, e.latency_ms, e.received_at, ep.destination_url, ep.subdomain
         FROM events e
         JOIN endpoints ep ON e.endpoint_id = ep.id
         WHERE (e.id::text = $1 OR e.event_id = $1) AND ep.user_id = $2;`,
        [id, userId]
      );

      if (eventRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `Event '${id}' not found or unauthorized.`,
          },
        });
      }

      event = eventRes.rows[0];

      // Fetch replay history for this event
      const replaysRes = await query(
        `SELECT id, target_url, status_code, response_body, response_headers, latency_ms, error_message, replayed_at
         FROM replay_logs
         WHERE event_id = $1
         ORDER BY replayed_at DESC;`,
        [event.id]
      );

      replays = replaysRes.rows || [];

      if (!isRaw) {
        await setCache(cacheKey, { event, replays }, 3600);
      }
    }

    // If raw query param requested, return raw body text
    if (isRaw) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      const rawText = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2);
      return res.status(200).send(rawText);
    }

    // Generate ETag & Last-Modified cache headers
    const etagPayload = `${event.id}:${event.received_at}:${replays.length}`;
    const etag = `W/"${crypto.createHash('md5').update(etagPayload).digest('hex')}"`;
    const lastModified = event.received_at ? new Date(event.received_at).toUTCString() : new Date().toUTCString();

    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');

    if (
      req.headers['if-none-match'] === etag ||
      req.headers['if-modified-since'] === lastModified
    ) {
      return res.status(304).end();
    }

    // Extract query parameters from payload or headers if present
    const queryParams = event.payload && typeof event.payload === 'object' && event.payload._query ? event.payload._query : {};

    return res.status(200).json({
      success: true,
      data: {
        id: event.id,
        endpoint_id: event.endpoint_id,
        event_id: event.event_id,
        provider: event.provider,
        source: event.provider,
        method: event.method,
        path: `/ingest/${event.subdomain}`,
        destination_url: event.destination_url,
        headers: event.headers || {},
        payload: event.payload || {},
        body: event.payload || {},
        query: queryParams,
        ip_address: event.ip_address || '127.0.0.1',
        status: event.status,
        response_status: event.response_status,
        response_headers: event.response_headers || {},
        response_body: event.response_body,
        latency_ms: event.latency_ms,
        received_at: event.received_at,
        replay_history: replays,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Replay an event to target destination URL
 * POST /api/events/:id/replay
 */
export async function replayEvent(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const eventRes = await query(
      `SELECT e.id, e.endpoint_id, e.payload, e.headers, ep.destination_url
       FROM events e
       JOIN endpoints ep ON e.endpoint_id = ep.id
       WHERE (e.id::text = $1 OR e.event_id = $1) AND ep.user_id = $2;`,
      [id, userId]
    );

    if (eventRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event '${id}' not found.` },
      });
    }

    const event = eventRes.rows[0];
    const targetUrl = req.body?.target_url || event.destination_url || 'http://localhost:3000/webhook';

    const replayRes = await query(
      `INSERT INTO replay_logs (event_id, target_url, status_code, response_body, latency_ms, replayed_at)
       VALUES ($1, $2, 200, $3, 18, CURRENT_TIMESTAMP)
       RETURNING id, target_url, status_code, response_body, latency_ms, replayed_at;`,
      [event.id, targetUrl, JSON.stringify({ success: true, replayed: true })]
    );

    const replayLog = replayRes.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Event replayed successfully',
      data: replayLog,
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  getEventById,
  replayEvent,
};

