import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../config/db.js';
import { publishEvent } from '../config/redis.js';
import { generateUniqueSubdomain, buildPublicUrl } from '../utils/url.js';

// Input Validation Schemas
const createEndpointSchema = z.object({
  subdomain: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens').optional(),
  destination_url: z.string().url('destination_url must be a valid HTTP or HTTPS URL'),
  secret: z.string().min(8).optional(),
});

/**
 * List all endpoints for the authenticated user
 * GET /api/endpoints
 */
export async function listEndpoints(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT id, user_id, subdomain, destination_url, secret, is_active, created_at, updated_at FROM endpoints WHERE user_id = $1 ORDER BY created_at DESC;',
      [userId]
    );

    const endpoints = result.rows.map((ep) => ({
      ...ep,
      public_url: buildPublicUrl(ep.subdomain),
    }));

    return res.status(200).json({
      success: true,
      data: endpoints,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Provision a new webhook endpoint
 * POST /api/endpoints
 */
export async function createEndpoint(req, res, next) {
  try {
    const parseResult = createEndpointSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(', ');
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMsg,
        },
      });
    }

    const { destination_url, secret: customSecret } = parseResult.data;
    let { subdomain } = parseResult.data;
    const userId = req.user.id;

    // Handle Subdomain Allocation
    if (subdomain) {
      subdomain = subdomain.toLowerCase().trim();
      const existing = await query('SELECT id FROM endpoints WHERE subdomain = $1;', [subdomain]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SUBDOMAIN_TAKEN',
            message: `Subdomain '${subdomain}' is already in use by another tunnel.`,
          },
        });
      }
    } else {
      subdomain = await generateUniqueSubdomain(12);
    }

    // Generate Signing Secret if not provided
    const secret = customSecret || `whsec_${crypto.randomBytes(16).toString('hex')}`;

    // Insert into DB
    const insertRes = await query(
      `INSERT INTO endpoints (user_id, subdomain, destination_url, secret, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, user_id, subdomain, destination_url, secret, is_active, created_at, updated_at;`,
      [userId, subdomain, destination_url, secret]
    );

    const endpoint = insertRes.rows[0];
    endpoint.public_url = buildPublicUrl(endpoint.subdomain);

    return res.status(201).json({
      success: true,
      data: endpoint,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get endpoint details by ID
 * GET /api/endpoints/:id
 */
export async function getEndpointById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'SELECT id, user_id, subdomain, destination_url, secret, is_active, created_at, updated_at FROM endpoints WHERE id = $1 AND user_id = $2;',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint '${id}' does not exist or does not belong to your account.`,
        },
      });
    }

    const endpoint = result.rows[0];
    endpoint.public_url = buildPublicUrl(endpoint.subdomain);

    return res.status(200).json({
      success: true,
      data: endpoint,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete an endpoint
 * DELETE /api/endpoints/:id
 */
export async function deleteEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM endpoints WHERE id = $1 AND user_id = $2 RETURNING id, subdomain;',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint '${id}' does not exist or does not belong to your account.`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Endpoint '${id}' successfully deleted.`,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Rotate / Reset Endpoint subdomain & secret
 * POST /api/endpoints/:id/reset
 */
export async function resetEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const existing = await query('SELECT id FROM endpoints WHERE id = $1 AND user_id = $2;', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint '${id}' does not exist or does not belong to your account.`,
        },
      });
    }

    const newSubdomain = await generateUniqueSubdomain(12);
    const newSecret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    const updateRes = await query(
      `UPDATE endpoints
       SET subdomain = $1, secret = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, subdomain, destination_url, secret, is_active, created_at, updated_at;`,
      [newSubdomain, newSecret, id, userId]
    );

    const endpoint = updateRes.rows[0];
    endpoint.public_url = buildPublicUrl(endpoint.subdomain);

    return res.status(200).json({
      success: true,
      data: endpoint,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * List events for a specific endpoint with pagination, filtering, and sorting
 * GET /api/endpoints/:id/events
 */
export async function getEndpointEvents(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify endpoint ownership
    const epCheck = await query('SELECT id FROM endpoints WHERE id = $1 AND user_id = $2;', [id, userId]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint '${id}' does not exist or does not belong to your account.`,
        },
      });
    }

    // Pagination query parameters
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    // Filtering query parameters
    const { method, source, provider, sort } = req.query;
    const filterProvider = provider || source;

    const whereClauses = ['endpoint_id = $1'];
    const queryParams = [id];
    let paramIdx = 2;

    if (method) {
      whereClauses.push(`method = $${paramIdx}`);
      queryParams.push(method.toUpperCase());
      paramIdx++;
    }

    if (filterProvider) {
      whereClauses.push(`(COALESCE(source, provider) ILIKE $${paramIdx} OR provider ILIKE $${paramIdx} OR payload::text ILIKE $${paramIdx})`);
      queryParams.push(`%${filterProvider}%`);
      paramIdx++;
    }

    const whereSql = whereClauses.join(' AND ');

    // Sorting
    let sortSql = 'received_at DESC';
    if (sort) {
      if (sort === 'receivedAt' || sort === 'received_at') {
        sortSql = 'received_at ASC';
      } else if (sort === '-receivedAt' || sort === '-received_at') {
        sortSql = 'received_at DESC';
      } else if (sort === 'status') {
        sortSql = 'status ASC';
      } else if (sort === '-status') {
        sortSql = 'status DESC';
      }
    }

    // Count Total Query
    const countRes = await query(
      `SELECT COUNT(*) FROM events WHERE ${whereSql};`,
      queryParams
    );
    const total = parseInt(countRes.rows[0].count, 10);

    // Data Query
    const dataQueryParams = [...queryParams, limit, offset];
    const eventsRes = await query(
      `SELECT id, endpoint_id, event_id, provider, COALESCE(source, provider) AS source, method, headers, payload, ip_address, status, response_status, response_headers, response_body, latency_ms, received_at
       FROM events
       WHERE ${whereSql}
       ORDER BY ${sortSql}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1};`,
      dataQueryParams
    );

    res.setHeader('X-Total-Count', total.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');

    return res.status(200).json({
      success: true,
      data: eventsRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Fire a synthetic test webhook event for an endpoint
 * POST /api/endpoints/:id/test-event
 */
export async function sendTestEvent(req, res, next) {
  try {
    const { id } = req.params;

    const epCheck = await query('SELECT id, subdomain FROM endpoints WHERE (id::text = $1 OR subdomain = $1);', [id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'ENDPOINT_NOT_FOUND', message: `Endpoint '${id}' not found.` },
      });
    }

    const endpoint = epCheck.rows[0];
    const eventId = `test_evt_${crypto.randomBytes(6).toString('hex')}`;
    const testPayload = req.body && Object.keys(req.body).length > 0 ? req.body : {
      event: 'test.webhook_fired',
      message: 'Hello from WebhookRelay Onboarding Wizard!',
      timestamp: new Date().toISOString(),
      sample_data: { user_id: 101, status: 'active', amount: 49.00 }
    };

    const headers = {
      'content-type': 'application/json',
      'user-agent': 'WebhookRelay-TestTrigger/1.0',
      'x-relay-test-event': 'true',
    };

    const eventRes = await query(
      `INSERT INTO events (endpoint_id, event_id, provider, source, method, headers, payload, ip_address, status)
       VALUES ($1, $2, 'generic', 'generic', 'POST', $3, $4, '127.0.0.1', 'pending')
       RETURNING id, endpoint_id, event_id, provider, source, method, headers, payload, status, received_at;`,
      [endpoint.id, eventId, JSON.stringify(headers), JSON.stringify(testPayload)]
    );

    const event = eventRes.rows[0];
    const eventEnvelope = {
      id: event.id,
      event_id: event.event_id,
      endpoint_id: endpoint.id,
      subdomain: endpoint.subdomain,
      provider: 'generic',
      source: 'generic',
      method: 'POST',
      headers,
      body: testPayload,
      payload: testPayload,
      timestamp: event.received_at,
    };

    await publishEvent(`endpoint:${endpoint.id}`, eventEnvelope);
    await publishEvent(`tunnel:${endpoint.subdomain}`, eventEnvelope);

    return res.status(201).json({
      success: true,
      message: 'Test webhook event dispatched successfully',
      data: eventEnvelope,
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  listEndpoints,
  createEndpoint,
  getEndpointById,
  deleteEndpoint,
  resetEndpoint,
  getEndpointEvents,
  sendTestEvent,
};

