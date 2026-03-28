-- T4 schema additions
-- Run in Supabase SQL Editor if these tables don't already exist.
-- After running, do: pnpm --filter @culicars/database exec prisma db pull

-- ────────────────────────────────────────────────────────────────────
-- raw_records
-- Stores every ingested data record before/after normalisation.
-- Owner PII is never stored here.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin             TEXT,
  plate           TEXT,
  source          TEXT NOT NULL,          -- e.g. 'ntsa_cor', 'jiji', 'beforward'
  source_id       TEXT,                   -- unique ID within source (for dedup)
  raw_json        JSONB,                  -- original payload (may be large)
  normalised_json JSONB,                  -- cleaned, structured fields
  confidence      NUMERIC(3,2) DEFAULT 0, -- 0.00 – 1.00
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS raw_records_vin_idx    ON raw_records (vin);
CREATE INDEX IF NOT EXISTS raw_records_plate_idx  ON raw_records (plate);
CREATE INDEX IF NOT EXISTS raw_records_source_idx ON raw_records (source);
CREATE UNIQUE INDEX IF NOT EXISTS raw_records_source_id_uidx
  ON raw_records (source, source_id)
  WHERE source_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────
-- admin_config
-- Key-value store for admin-controlled platform settings.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed the ntsa_fetch_enabled toggle (on by default)
INSERT INTO admin_config (key, value)
VALUES ('ntsa_fetch_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
