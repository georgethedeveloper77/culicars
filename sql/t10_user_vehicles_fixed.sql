-- ============================================================
-- T10 FIX: user_vehicles table
-- Run STEP 1 first to find your actual User table name,
-- then run STEP 2 with the correct name.
-- ============================================================

-- STEP 1: Find your actual user table name
-- Run this query alone first to see what tables exist:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name ILIKE '%user%'
ORDER BY table_name;

-- ============================================================
-- STEP 2: After confirming the table name above, run this.
-- Prisma typically creates tables as "User" (quoted, PascalCase)
-- but yours may differ. Common names:
--   "User"   ← Prisma default
--   users    ← lowercase
--   profiles ← if auth is handled via Profile only
--
-- Replace YOUR_USER_TABLE below with whatever STEP 1 returned.
-- If you see "User" (with capital U), keep it quoted as "User".
-- If you see "users" (lowercase), use users (no quotes).
-- ============================================================

-- STEP 2a: Create user_vehicles (no FK constraint — avoids cross-schema issues)
CREATE TABLE IF NOT EXISTS user_vehicles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL,
  plate             TEXT,
  vin               TEXT,
  relationship_type TEXT        NOT NULL DEFAULT 'owner'
                    CHECK (relationship_type IN ('owner','driver','tracker','watchlist')),
  nickname          TEXT,
  alert_radius_km   INTEGER     DEFAULT 10,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_vehicles_unique UNIQUE (user_id, plate, vin)
);

-- STEP 2b: Indexes
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_plate   ON user_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_vin     ON user_vehicles(vin);

-- STEP 2c: Add preferred location columns to Profile
-- First check if Profile table exists:
-- SELECT table_name FROM information_schema.tables WHERE table_name ILIKE 'profile%';
ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS preferred_lat           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_lng           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS preferred_location_name TEXT;

-- STEP 2d: RLS
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_vehicles_select_own" ON user_vehicles;
DROP POLICY IF EXISTS "user_vehicles_insert_own" ON user_vehicles;
DROP POLICY IF EXISTS "user_vehicles_update_own" ON user_vehicles;
DROP POLICY IF EXISTS "user_vehicles_delete_own" ON user_vehicles;
DROP POLICY IF EXISTS "user_vehicles_admin_all"  ON user_vehicles;

CREATE POLICY "user_vehicles_select_own"
  ON user_vehicles FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_vehicles_insert_own"
  ON user_vehicles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "user_vehicles_update_own"
  ON user_vehicles FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "user_vehicles_delete_own"
  ON user_vehicles FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Bypass for admins (reads role from your User/users table — adjust table name if needed)
CREATE POLICY "user_vehicles_admin_all"
  ON user_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id::text = auth.uid()::text
        AND u.role = 'admin'
    )
  );
