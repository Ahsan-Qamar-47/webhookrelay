import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'node:path';
import fs from 'node:fs';

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(customLevels.colors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const devConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, requestId, eventId, stack, ...meta }) => {
    const reqStr = requestId ? ` [req:${requestId}]` : '';
    const evtStr = eventId ? ` [evt:${eventId}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] [${level}]${reqStr}${evtStr}: ${message}${metaStr}${stackStr}`;
  })
);

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'relay-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '14d',
  level: process.env.LOG_LEVEL || 'debug',
  format: logFormat,
});

const fileRotateErrorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'relay-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '30d',
  level: 'error',
  format: logFormat,
});

const transports = [fileRotateTransport, fileRotateErrorTransport];

if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      format: process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json' ? logFormat : devConsoleFormat,
    })
  );
}

export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'debug',
  transports,
});

export default logger;
