import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication Middleware
 * Validates JWT token from Authorization header or cookies and injects req.user
 */
export function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization Header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.token) {
      // 2. Check Cookie (token=<token>)
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token missing. Please provide a valid Bearer token.',
        },
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired. Please log in again.',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token provided.',
      },
    });
  }
}

/**
 * Authorization Middleware by Role
 * @param {...string} allowedRoles - List of allowed user roles (e.g. 'admin', 'user')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
        },
      });
    }

    return next();
  };
}

export default {
  authenticate,
  requireRole,
};
