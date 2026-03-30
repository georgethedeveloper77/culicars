-- =============================================================
-- CuliCars T13–T14 SQL
-- Run in Supabase SQL Editor
-- =============================================================

-- ─────────────────────────────────────────
-- T13: vehicle_verification
-- Stores verification attempts per user per plate.
-- Owner PII is NEVER stored — parser strips it before insert.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_verification (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate         TEXT NOT NULL,
  vin           TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','failed','manual_upload')),
  cor_fields    JSONB,                  -- parsed COR fields, PII stripped
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_verification_user_plate
  ON vehicle_verification (user_id, plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_verification_plate
  ON vehicle_verification (plate);

-- RLS
ALTER TABLE vehicle_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own verifications"
  ON vehicle_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
  ON vehicle_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications"
  ON vehicle_verification FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role bypass for API
CREATE POLICY "Service role full access verifications"
  ON vehicle_verification FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────
-- T14: contributions
-- Immutable records — no DELETE ever. Rejected records retained for audit.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate           TEXT NOT NULL,
  vin             TEXT,
  type            TEXT NOT NULL
                    CHECK (type IN ('odometer','service_record','damage','listing_photo')),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_json       JSONB NOT NULL DEFAULT '{}',
  evidence_urls   TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','disputed','needs_more_info','archived')),
  moderated_by    UUID REFERENCES auth.users(id),
  moderator_note  TEXT,
  moderated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_plate   ON contributions (plate);
CREATE INDEX IF NOT EXISTS idx_contributions_vin     ON contributions (vin) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contributions_status  ON contributions (status);
CREATE INDEX IF NOT EXISTS idx_contributions_user    ON contributions (user_id);

-- RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Users can read their own contributions regardless of status
CREATE POLICY "Users read own contributions"
  ON contributions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read approved contributions for any vehicle
CREATE POLICY "Public read approved contributions"
  ON contributions FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can insert own contributions"
  ON contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No user UPDATE — moderation only via service role
CREATE POLICY "Service role full access contributions"
  ON contributions FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- Trigger: updated_at maintenance
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vehicle_verification_updated_at'
  ) THEN
    CREATE TRIGGER trg_vehicle_verification_updated_at
      BEFORE UPDATE ON vehicle_verification
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contributions_updated_at'
  ) THEN
    CREATE TRIGGER trg_contributions_updated_at
      BEFORE UPDATE ON contributions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
