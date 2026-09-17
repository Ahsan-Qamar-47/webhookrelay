/**
 * Migration 002: Endpoints Schema
 */
export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        destination_url VARCHAR(500) NOT NULL,
        secret VARCHAR(255),
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_endpoints_user_id ON endpoints(user_id);
    CREATE INDEX IF NOT EXISTS idx_endpoints_subdomain ON endpoints(subdomain);
    CREATE INDEX IF NOT EXISTS idx_endpoints_is_active ON endpoints(is_active);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS endpoints CASCADE;
  `);
}
