/**
 * Migration 006: Add source column to events table
 */
export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'generic';

    UPDATE events SET source = provider WHERE (source IS NULL OR source = 'generic') AND provider IS NOT NULL AND provider != 'generic';

    CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_events_source;
    ALTER TABLE events DROP COLUMN IF EXISTS source;
  `);
}
