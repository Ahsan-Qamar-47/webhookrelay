import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/db.js';

const createTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required').max(100),
});

/**
 * Generate a new API token
 * POST /api/tokens
 */
export async function createToken(req, res, next) {
  try {
    const parseResult = createTokenSchema.safeParse(req.body);
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

    const { name } = parseResult.data;
    const userId = req.user.id;

    // Generate Raw Token: whr_token_<48_hex_chars>
    const rawToken = `whr_token_${crypto.randomBytes(24).toString('hex')}`;

    // Hash Token before database insertion
    const saltRounds = 10;
    const tokenHash = await bcrypt.hash(rawToken, saltRounds);

    const insertRes = await query(
      `INSERT INTO api_tokens (user_id, name, token_hash)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, last_used_at, expires_at, created_at;`,
      [userId, name, tokenHash]
    );

    const tokenRecord = insertRes.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        ...tokenRecord,
        token: rawToken, // Full token returned ONLY on creation
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * List API tokens for the authenticated user (masked)
 * GET /api/tokens
 */
export async function listTokens(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT id, name, token_hash, last_used_at, expires_at, created_at FROM api_tokens WHERE user_id = $1 ORDER BY created_at DESC;',
      [userId]
    );

    const tokens = result.rows.map((t) => ({
      id: t.id,
      name: t.name,
      masked_token: `whr_token_****${t.id.substring(0, 4)}`,
      last_used_at: t.last_used_at,
      expires_at: t.expires_at,
      created_at: t.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Revoke an API token by ID
 * DELETE /api/tokens/:id
 */
export async function deleteToken(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM api_tokens WHERE id = $1 AND user_id = $2 RETURNING id, name;',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: `API Token '${id}' does not exist or does not belong to your account.`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `API Token '${id}' successfully revoked.`,
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  createToken,
  listTokens,
  deleteToken,
};
