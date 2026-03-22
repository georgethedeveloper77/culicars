-- 001_users_profiles.sql
-- CuliCars Thread 1 — Users, Profiles, and all enums

-- ENUMS
CREATE TYPE "UserRole" AS ENUM ('guest', 'user', 'admin', 'dealer');
CREATE TYPE "InspStatus" AS ENUM ('passed', 'failed', 'expired', 'unknown');
CREATE TYPE "CaveatSt" AS ENUM ('clear', 'caveat', 'unknown');
CREATE TYPE "CorSource" AS ENUM ('user_webview', 'admin');
CREATE TYPE "PvmSource" AS ENUM ('ntsa_cor', 'kra_import', 'scraper', 'contribution', 'ocr', 'admin');
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'ready', 'stale');
CREATE TYPE "RiskLevel" AS ENUM ('clean', 'low', 'medium', 'high', 'critical');
CREATE TYPE "Recommendation" AS ENUM ('proceed', 'caution', 'avoid');
CREATE TYPE "SectionType" AS ENUM (
  'IDENTITY', 'PURPOSE', 'THEFT', 'ODOMETER', 'LEGAL',
  'DAMAGE', 'SPECS_EQUIPMENT', 'IMPORT', 'OWNERSHIP',
  'SERVICE', 'PHOTOS', 'TIMELINE', 'STOLEN_REPORTS', 'RECOMMENDATION'
);
CREATE TYPE "DataStatus" AS ENUM ('found', 'not_found', 'not_checked');
CREATE TYPE "EventType" AS ENUM (
  'MANUFACTURED', 'REGISTERED', 'INSPECTED', 'INSPECTION_FAILED',
  'DAMAGED', 'REPAIRED', 'SERVICED',
  'STOLEN', 'RECOVERED', 'WANTED',
  'IMPORTED', 'EXPORTED', 'KRA_CLEARED',
  'OWNERSHIP_CHANGE', 'PSV_LICENSED', 'PSV_REVOKED',
  'LISTED_FOR_SALE', 'SOLD', 'AUCTIONED',
  'CONTRIBUTION_ADDED', 'ADMIN_NOTE'
);
CREATE TYPE "EventSource" AS ENUM (
  'ntsa_cor', 'kra',
  'scraper_jiji', 'scraper_pigiame', 'scraper_olx',
  'scraper_autochek', 'scraper_autoexpress', 'scraper_kra_ibid',
  'scraper_auction', 'scraper_beforward',
  'contribution', 'community_stolen_report', 'admin'
);
CREATE TYPE "StolenStatus" AS ENUM ('pending', 'active', 'recovered', 'rejected', 'duplicate');
CREATE TYPE "ReporterType" AS ENUM ('owner', 'family', 'witness', 'police');
CREATE TYPE "LedgerType" AS ENUM ('purchase', 'spend', 'bonus', 'refund', 'admin_grant', 'admin_deduct');
CREATE TYPE "ProviderSlug" AS ENUM ('mpesa', 'paypal', 'stripe', 'google_pay', 'apple_iap', 'revenuecat', 'card');
CREATE TYPE "PayStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE "ContribType" AS ENUM (
  'MILEAGE_RECORD', 'DAMAGE_REPORT', 'SERVICE_RECORD',
  'OWNERSHIP_TRANSFER', 'LISTING_PROOF', 'INSPECTION_RECORD',
  'IMPORT_DOCUMENT', 'THEFT_REPORT', 'PHOTO_EVIDENCE', 'GENERAL_NOTE'
);
CREATE TYPE "ContribStatus" AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE "DocType" AS ENUM ('logbook', 'import_doc', 'dashboard', 'plate_photo', 'ntsa_cor');
CREATE TYPE "OcrSource" AS ENUM ('user_upload', 'ntsa_cor_auto', 'admin');
CREATE TYPE "ScraperSrc" AS ENUM (
  'JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK', 'AUTOSKENYA', 'KABA',
  'AUTO_EXPRESS', 'KRA_IBID', 'GARAM', 'MOGO', 'CAR_DUKA',
  'BEFORWARD', 'STC_JAPAN', 'MANUAL_IMPORT'
);
CREATE TYPE "JobStatus" AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE "JobTrigger" AS ENUM ('scheduled', 'manual');

-- USERS
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- PROFILES
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  avatar_url text,
  county text,
  preferred_lang text DEFAULT 'en',
  updated_at timestamptz
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row" ON users FOR SELECT USING (auth.uid()::uuid = id);
CREATE POLICY "Users can update own row" ON users FOR UPDATE USING (auth.uid()::uuid = id);
CREATE POLICY "Profiles readable by owner" ON profiles FOR SELECT USING (auth.uid()::uuid = user_id);
CREATE POLICY "Profiles updatable by owner" ON profiles FOR UPDATE USING (auth.uid()::uuid = user_id);
