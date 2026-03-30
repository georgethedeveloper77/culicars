-- T11: Watch Alerts Table
-- Run in Supabase SQL Editor

CREATE TYPE watch_alert_type AS ENUM (
  'stolen_vehicle',
  'recovered_vehicle',
  'damage',
  'vandalism',
  'parts_theft',
  'suspicious_activity',
  'hijack'
);

CREATE TYPE watch_alert_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'disputed',
  'needs_more_info',
  'archived'
);

CREATE TABLE watch_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate           TEXT,
  vin             TEXT,
  type            watch_alert_type NOT NULL,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  location_name   TEXT,
  description     TEXT NOT NULL,
  status          watch_alert_status NOT NULL DEFAULT 'pending',
  submitted_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderation_note TEXT,
  moderated_at    TIMESTAMPTZ,
  evidence_urls   TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- All records are immutable — no DELETE. Status transitions only.
CREATE INDEX idx_watch_alerts_status   ON watch_alerts(status);
CREATE INDEX idx_watch_alerts_plate    ON watch_alerts(plate);
CREATE INDEX idx_watch_alerts_vin      ON watch_alerts(vin);
CREATE INDEX idx_watch_alerts_type     ON watch_alerts(type);
CREATE INDEX idx_watch_alerts_created  ON watch_alerts(created_at DESC);
CREATE INDEX idx_watch_alerts_location ON watch_alerts USING gist(
  ll_to_earth(lat, lng)
) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_watch_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watch_alerts_updated_at
  BEFORE UPDATE ON watch_alerts
  FOR EACH ROW EXECUTE FUNCTION update_watch_alerts_updated_at();

-- RLS
ALTER TABLE watch_alerts ENABLE ROW LEVEL SECURITY;

-- Public can read approved alerts
CREATE POLICY "watch_alerts_public_read" ON watch_alerts
  FOR SELECT USING (status = 'approved');

-- Authenticated users can insert
CREATE POLICY "watch_alerts_auth_insert" ON watch_alerts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can see their own pending/rejected submissions
CREATE POLICY "watch_alerts_own_read" ON watch_alerts
  FOR SELECT USING (submitted_by = auth.uid());
