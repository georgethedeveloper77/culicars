-- T8: Report System Upgrade
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────────
-- vehicle_report  (canonical report per VIN)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_report (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin           TEXT NOT NULL,
  plate         TEXT,
  state         TEXT NOT NULL DEFAULT 'pending_enrichment',
  risk_score    INTEGER NOT NULL DEFAULT 0,
  risk_level    TEXT NOT NULL DEFAULT 'low',
  risk_flags    JSONB NOT NULL DEFAULT '[]',
  sections_json JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_report_vin   ON vehicle_report(vin);
CREATE INDEX IF NOT EXISTS idx_vehicle_report_plate ON vehicle_report(plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_report_state ON vehicle_report(state);

-- ─────────────────────────────────────────────
-- report_access  (who has unlocked what report)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES vehicle_report(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_access_report_user
  ON report_access(report_id, user_id);
CREATE INDEX IF NOT EXISTS idx_report_access_user
  ON report_access(user_id);

-- prevent exact duplicate unlock records (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_access_report_user
  ON report_access(report_id, user_id);
