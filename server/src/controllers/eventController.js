import { query } from '../config/db.js';

/**
 * Get full event details by ID including replay history
 * GET /api/events/:id
 */
export async function getEventById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isRaw = req.query.raw === 'true';

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

    const event = eventRes.rows[0];

    // Fetch replay history for this event
    const replaysRes = await query(
      `SELECT id, target_url, status_code, response_body, response_headers, latency_ms, error_message, replayed_at
       FROM replay_logs
       WHERE event_id = $1
       ORDER BY replayed_at DESC;`,
      [event.id]
    );

    // If raw query param requested, return raw body text
    if (isRaw) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      const rawText = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2);
      return res.status(200).send(rawText);
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
        replay_history: replaysRes.rows || [],
      },
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  getEventById,
};
