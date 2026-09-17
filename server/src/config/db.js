import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const user = process.env.POSTGRES_USER || process.env.DB_USER || 'relay';
  const password = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'relay_pass';
  const host = process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || process.env.DB_PORT || '5434';
  const database = process.env.POSTGRES_DB || process.env.DB_NAME || 'webhookrelay';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

const connectionString = getConnectionString();

export const pool = new pg.Pool({
  connectionString,
  max: parseInt(process.env.PG_MAX_POOL || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute SQL query with execution timing and error logging
 * @param {string} text - SQL Query text
 * @param {Array} [params] - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[DB Query] ${text.substring(0, 60).replace(/\s+/g, ' ')}... executed in ${duration}ms | rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[DB Query Error] ${err.message} | query: ${text}`);
    }
    throw err;
  }
}

/**
 * Healthcheck function to test PostgreSQL connectivity
 * @returns {Promise<{status: string, latency_ms?: number, timestamp?: Date, version?: string, error?: string}>}
 */
export async function checkDbHealth() {
  const start = Date.now();
  try {
    const res = await pool.query('SELECT NOW() as now, version();');
    const latencyMs = Date.now() - start;
    return {
      status: 'healthy',
      latency_ms: latencyMs,
      timestamp: res.rows[0].now,
      version: res.rows[0].version,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
    };
  }
}

export default {
  pool,
  query,
  checkDbHealth,
};
