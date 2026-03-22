-- 003_reports_sections_unlocks.sql

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin text NOT NULL REFERENCES vehicles(vin) ON DELETE CASCADE,
  status "ReportStatus" DEFAULT 'draft',
  risk_score integer,
  risk_level "RiskLevel",
  recommendation "Recommendation",
  sources_checked integer DEFAULT 0,
  records_found integer DEFAULT 0,
  generated_at timestamptz,
  updated_at timestamptz
);

CREATE INDEX idx_reports_vin ON reports(vin);

CREATE TABLE report_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_type "SectionType" NOT NULL,
  data jsonb,
  is_locked boolean DEFAULT true,
  record_count integer DEFAULT 0,
  data_status "DataStatus" DEFAULT 'not_checked',
  updated_at timestamptz
);

CREATE TABLE report_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  report_id uuid NOT NULL REFERENCES reports(id),
  credits_spent integer NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, report_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports readable by all" ON reports FOR SELECT USING (true);
CREATE POLICY "Sections readable by all" ON report_sections FOR SELECT USING (true);
CREATE POLICY "Unlocks readable by owner" ON report_unlocks FOR SELECT USING (auth.uid()::uuid = user_id);
