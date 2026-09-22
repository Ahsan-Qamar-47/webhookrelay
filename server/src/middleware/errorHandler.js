import { logger } from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'Internal Server Error';
  const details = err.details || null;

  logger.error(`HTTP ${status} Error: ${message}`, {
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    status,
    code,
    stack: err.stack,
  });

  res.status(status).json({
    success: false,
    error: err.error || {
      code,
      message,
      details,
    },
    statusCode: status,
    requestId: req.id || null,
  });
}
