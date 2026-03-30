-- ============================================================
-- T10: My Vehicles + Watchlist
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. user_vehicles table
CREATE TABLE IF NOT EXISTS user_vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  plate         TEXT,
  vin           TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'owner'
                  CHECK (relationship_type IN ('owner','driver','tracker','watchlist')),
  nickname      TEXT,
  alert_radius_km INTEGER DEFAULT 10,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_vehicles_unique UNIQUE (user_id, plate, vin)
);

CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_plate   ON user_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_vin     ON user_vehicles(vin);

-- 2. Add preferred location columns to Profile (if they don't exist)
ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS preferred_lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_lng  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_location_name TEXT;

-- 3. RLS policies
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own vehicles
CREATE POLICY "user_vehicles_select_own"
  ON user_vehicles FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own vehicles
CREATE POLICY "user_vehicles_insert_own"
  ON user_vehicles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own vehicles
CREATE POLICY "user_vehicles_update_own"
  ON user_vehicles FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Users can delete their own vehicles
CREATE POLICY "user_vehicles_delete_own"
  ON user_vehicles FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Admins bypass RLS
CREATE POLICY "user_vehicles_admin_all"
  ON user_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id::text = auth.uid()::text
        AND u.role = 'admin'
    )
  );
