import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { publishEvent } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Infer webhook provider from request headers
 */
function inferProvider(headers) {
  const keys = Object.keys(headers).map((k) => k.toLowerCase());
  if (keys.some((k) => k.includes('stripe'))) return 'stripe';
  if (keys.some((k) => k.includes('github'))) return 'github';
  if (keys.some((k) => k.includes('shopify'))) return 'shopify';
  if (keys.some((k) => k.includes('twilio'))) return 'twilio';
  return 'generic';
}

/**
 * Handle incoming webhook POST/GET/PUT/DELETE at /ingest/:tunnelId
 */
export async function handleIngest(req, res, next) {
  try {
    const { tunnelId } = req.params;

    if (!tunnelId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TUNNEL_ID', message: 'Tunnel ID or subdomain parameter is required.' },
      });
    }

    // 1. Fetch active endpoint from Database
    const epRes = await query(
      'SELECT id, user_id, subdomain, destination_url, secret, is_active FROM endpoints WHERE subdomain = $1 OR id::text = $1;',
      [tunnelId]
    );

    if (epRes.rows.length === 0 || !epRes.rows[0].is_active) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TUNNEL_NOT_FOUND',
          message: `No active webhook tunnel endpoint found for ID or subdomain '${tunnelId}'.`,
        },
      });
    }

    const endpoint = epRes.rows[0];
    const provider = inferProvider(req.headers);
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const providerEventId = req.headers['stripe-signature']
      ? `evt_${crypto.randomBytes(8).toString('hex')}`
      : req.headers['x-github-delivery'] || `evt_${crypto.randomBytes(8).toString('hex')}`;
    const requestId = req.id || req.headers['x-request-id'] || crypto.randomUUID();
    const requestHeaders = { ...req.headers, 'x-request-id': requestId };

    // 2. Insert Event into PostgreSQL
    const eventRes = await query(
      `INSERT INTO events (endpoint_id, event_id, provider, method, headers, payload, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, endpoint_id, event_id, provider, method, headers, payload, status, received_at;`,
      [
        endpoint.id,
        providerEventId,
        provider,
        req.method,
        JSON.stringify(requestHeaders),
        JSON.stringify(req.body || {}),
        clientIp,
      ]
    );

    const event = eventRes.rows[0];

    // 3. Construct Standardized Event Envelope for WebSocket / CLI
    const eventEnvelope = {
      id: event.id,
      event_id: event.event_id,
      request_id: requestId,
      endpoint_id: endpoint.id,
      subdomain: endpoint.subdomain,
      provider: event.provider,
      method: event.method,
      headers: requestHeaders,
      body: req.body || {},
      payload: req.body || {},
      timestamp: event.received_at,
    };

    // 4. Publish Event to Redis Pub/Sub channels (endpoint:<id> and tunnel:<subdomain>)
    await publishEvent(`endpoint:${endpoint.id}`, eventEnvelope);
    await publishEvent(`tunnel:${endpoint.subdomain}`, eventEnvelope);

    logger.info(`Webhook ingested for tunnel ${endpoint.subdomain}`, {
      requestId,
      eventId: event.id,
      provider,
      method: req.method,
      tunnelId: endpoint.subdomain,
    });

    // 5. Return HTTP 202 Accepted Response
    return res.status(202).json({
      success: true,
      message: 'Webhook received',
      eventId: event.id,
      providerEventId: event.event_id,
      requestId,
      tunnelId: endpoint.subdomain,
      status: 'pending',
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  handleIngest,
};
