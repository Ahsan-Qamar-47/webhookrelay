import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

// Input Validation Schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register a new user account
 * POST /api/auth/signup
 */
export async function signup(req, res, next) {
  try {
    // 1. Validate Input
    const parseResult = signupSchema.safeParse(req.body);
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

    const { email, password, name } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check for existing user
    const existingUserRes = await query('SELECT id FROM users WHERE email = $1;', [normalizedEmail]);
    if (existingUserRes.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email address already exists.',
        },
      });
    }

    // 3. Hash Password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert User
    const insertUserRes = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, name, role, created_at;`,
      [normalizedEmail, passwordHash, name || normalizedEmail.split('@')[0]]
    );

    const user = insertUserRes.rows[0];

    // 5. Create default subscription (Free tier)
    await query(
      `INSERT INTO subscriptions (user_id, plan, status)
       VALUES ($1, 'free', 'active')
       ON CONFLICT (user_id) DO NOTHING;`,
      [user.id]
    );

    // 6. Generate JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Authenticate user credentials
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    // 1. Validate Input
    const parseResult = loginSchema.safeParse(req.body);
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

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Fetch User from Database
    const userRes = await query(
      'SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1;',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password provided.',
        },
      });
    }

    const user = userRes.rows[0];

    // 3. Verify Password Hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password provided.',
        },
      });
    }

    // 4. Generate Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Omit password_hash from response
    delete user.password_hash;

    return res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/me or GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const userRes = await query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1;',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
        },
      });
    }

    const subRes = await query(
      'SELECT plan, status, current_period_start, current_period_end FROM subscriptions WHERE user_id = $1;',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        user: userRes.rows[0],
        subscription: subRes.rows[0] || { plan: 'free', status: 'active' },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  signup,
  login,
  getMe,
};
