-- 007_contributions_cor_consents.sql

CREATE TABLE contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin text NOT NULL REFERENCES vehicles(vin),
  user_id uuid REFERENCES users(id),
  type "ContribType" NOT NULL,
  title text NOT NULL,
  description text,
  data jsonb,
  evidence_urls text[],
  verification_doc_urls text[],
  status "ContribStatus" DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  confidence_score float,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cor_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  vin text NOT NULL,
  plate text NOT NULL,
  consented_at timestamptz DEFAULT now(),
  pdf_processed boolean DEFAULT false,
  processed_at timestamptz
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cor_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions readable by all" ON contributions FOR SELECT USING (true);
CREATE POLICY "Consents readable by owner" ON cor_consents FOR SELECT USING (auth.uid()::uuid = user_id);
