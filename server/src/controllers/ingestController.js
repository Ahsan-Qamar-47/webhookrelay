import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { publishEvent } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { detectSource } from '../utils/source.js';

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
    const source = detectSource(req.headers, req.query, req.body);
    const provider = source;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const providerEventId = req.headers['stripe-signature']
      ? `evt_${crypto.randomBytes(8).toString('hex')}`
      : req.headers['x-github-delivery'] || `evt_${crypto.randomBytes(8).toString('hex')}`;
    const requestId = req.id || req.headers['x-request-id'] || crypto.randomUUID();
    const requestHeaders = { ...req.headers, 'x-request-id': requestId };

    // Meta / WhatsApp Webhook Challenge Verification (GET request)
    if (req.method === 'GET' && req.query['hub.mode'] === 'subscribe') {
      const verifyToken = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (endpoint.secret && verifyToken !== endpoint.secret) {
        logger.warn(`WhatsApp verification failed for endpoint ${endpoint.subdomain}: invalid verify token`);
        return res.status(403).json({
          success: false,
          error: { code: 'VERIFICATION_FAILED', message: 'Verify token mismatch' },
        });
      }

      // Record verification event for inspector UI visibility
      const eventRes = await query(
        `INSERT INTO events (endpoint_id, event_id, provider, source, method, headers, payload, ip_address, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
         RETURNING id, endpoint_id, event_id, provider, source, method, headers, payload, status, received_at;`,
        [
          endpoint.id,
          `challenge_${crypto.randomBytes(4).toString('hex')}`,
          provider,
          source,
          req.method,
          JSON.stringify(requestHeaders),
          JSON.stringify(req.query || {}),
          clientIp,
        ]
      );

      const event = eventRes.rows[0];
      const eventEnvelope = {
        id: event.id,
        event_id: event.event_id,
        request_id: requestId,
        endpoint_id: endpoint.id,
        subdomain: endpoint.subdomain,
        provider: event.provider,
        source: event.source,
        method: event.method,
        headers: requestHeaders,
        body: req.query || {},
        payload: req.query || {},
        timestamp: event.received_at,
      };

      await publishEvent(`endpoint:${endpoint.id}`, eventEnvelope);
      await publishEvent(`tunnel:${endpoint.subdomain}`, eventEnvelope);

      logger.info(`WhatsApp webhook challenge verified successfully for ${endpoint.subdomain}`);
      return res.status(200).send(challenge);
    }

    // 2. Insert Event into PostgreSQL
    const eventRes = await query(
      `INSERT INTO events (endpoint_id, event_id, provider, source, method, headers, payload, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id, endpoint_id, event_id, provider, source, method, headers, payload, status, received_at;`,
      [
        endpoint.id,
        providerEventId,
        provider,
        source,
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
      source: event.source,
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
      source,
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
      source,
      status: 'pending',
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  handleIngest,
};
