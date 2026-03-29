-- apps/api/prisma/migrations/t7a_search_demand_queue.sql
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS search_demand_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate         TEXT,
  vin           TEXT,
  result_state  TEXT NOT NULL DEFAULT 'pending_enrichment',  -- low_confidence | pending_enrichment
  times_requested INTEGER NOT NULL DEFAULT 1,
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enriched_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_plate_or_vin CHECK (plate IS NOT NULL OR vin IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sdq_plate ON search_demand_queue (plate) WHERE plate IS NOT NULL AND enriched_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sdq_vin   ON search_demand_queue (vin)   WHERE vin   IS NOT NULL AND enriched_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sdq_state        ON search_demand_queue (result_state);
CREATE INDEX IF NOT EXISTS idx_sdq_last_req     ON search_demand_queue (last_requested_at DESC);
