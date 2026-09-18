import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../config/db.js';
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

export default {
  listEndpoints,
  createEndpoint,
  getEndpointById,
  deleteEndpoint,
  resetEndpoint,
};
