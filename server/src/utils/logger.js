/**
 * Structured Logger utility for WebhookRelay
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL.toLowerCase()] || 2 : 2;

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();

  // Standard JSON structured log format
  if (process.env.LOG_FORMAT === 'json') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  }

  // Readable structured log format for console/dev
  const reqIdStr = meta.requestId ? ` [req:${meta.requestId}]` : '';
  const eventIdStr = meta.eventId ? ` [evt:${meta.eventId}]` : '';
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]${reqIdStr}${eventIdStr} ${message}${metaStr}`;
}

export const logger = {
  error(message, meta) {
    if (LOG_LEVELS.error <= currentLevel) {
      console.error(formatLog('error', message, meta));
    }
  },
  warn(message, meta) {
    if (LOG_LEVELS.warn <= currentLevel) {
      console.warn(formatLog('warn', message, meta));
    }
  },
  info(message, meta) {
    if (LOG_LEVELS.info <= currentLevel) {
      console.log(formatLog('info', message, meta));
    }
  },
  debug(message, meta) {
    if (LOG_LEVELS.debug <= currentLevel) {
      console.log(formatLog('debug', message, meta));
    }
  },
};

export default logger;
