/**
 * Migration 007: Performance Indexes for Webhook Events
 */
export async function up(pgm) {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_events_endpoint_received ON events (endpoint_id, received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_endpoint_source ON events (endpoint_id, source);
    CREATE INDEX IF NOT EXISTS idx_events_endpoint_method ON events (endpoint_id, method);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_events_endpoint_received;
    DROP INDEX IF EXISTS idx_events_endpoint_source;
    DROP INDEX IF EXISTS idx_events_endpoint_method;
  `);
}
