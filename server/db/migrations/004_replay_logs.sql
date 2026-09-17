-- Migration 004: Webhook Replay Execution Logs Table Definition
-- Webhook Relay Database Schema

CREATE TABLE IF NOT EXISTS replay_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_url VARCHAR(500) NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    response_headers JSONB DEFAULT '{}'::jsonb,
    latency_ms INTEGER,
    error_message TEXT,
    replayed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Performance and Audit Indexes
CREATE INDEX IF NOT EXISTS idx_replay_logs_event_id ON replay_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_replay_logs_user_id ON replay_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_replay_logs_replayed_at ON replay_logs(replayed_at DESC);
