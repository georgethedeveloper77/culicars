-- 010_stolen_reports.sql
-- Community stolen vehicle reporting — CuliCars exclusive

CREATE TABLE stolen_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL,
  plate_display text,
  vin text REFERENCES vehicles(vin),
  reporter_user_id uuid REFERENCES users(id),
  reporter_type "ReporterType",
  date_stolen date NOT NULL,
  county_stolen text NOT NULL,
  town_stolen text NOT NULL,
  police_ob_number text,
  police_station text,
  car_color text NOT NULL,
  identifying_marks text,
  photo_urls text[],
  contact_phone text,
  contact_email text,
  status "StolenStatus" DEFAULT 'pending',
  is_ob_verified boolean DEFAULT false,
  admin_note text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  recovery_date date,
  recovery_county text,
  recovery_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stolen_plate ON stolen_reports(plate);
CREATE INDEX idx_stolen_vin ON stolen_reports(vin);
CREATE INDEX idx_stolen_status ON stolen_reports(status);

ALTER TABLE stolen_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stolen reports readable by all" ON stolen_reports FOR SELECT USING (true);
CREATE POLICY "Stolen reports insertable by all" ON stolen_reports FOR INSERT WITH CHECK (true);
