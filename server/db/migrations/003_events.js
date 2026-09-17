/**
 * Migration 003: Webhook Ingest Events Schema
 */
export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
        event_id VARCHAR(255),
        provider VARCHAR(100) DEFAULT 'generic' NOT NULL,
        method VARCHAR(10) DEFAULT 'POST' NOT NULL,
        headers JSONB DEFAULT '{}'::jsonb NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb NOT NULL,
        ip_address VARCHAR(45),
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        response_status INTEGER,
        response_headers JSONB DEFAULT '{}'::jsonb,
        response_body TEXT,
        latency_ms INTEGER,
        received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_endpoint_id ON events(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_events_received_at ON events(received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_events_provider ON events(provider);
    CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING gin (payload);
    CREATE INDEX IF NOT EXISTS idx_events_headers_gin ON events USING gin (headers);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS events CASCADE;
  `);
}
