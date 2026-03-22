-- 002_vehicles_plates.sql
-- vehicles: VIN is the PRIMARY KEY for the entire system
-- plate_vin_map: bridges plate (user input) to VIN (database key)

CREATE TABLE vehicles (
  vin text PRIMARY KEY,
  chassis_number text,
  make text,
  model text,
  year integer,
  engine_cc integer,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  country_of_origin text,
  import_country text,
  is_imported boolean DEFAULT false,
  japan_auction_grade text,
  japan_auction_mileage integer,
  kra_pin text,
  ntsa_id text,
  inspection_status "InspStatus",
  last_inspection_date date,
  caveat_status "CaveatSt",
  psv_licensed boolean DEFAULT false,
  ntsa_cor_verified boolean DEFAULT false,
  ntsa_cor_date timestamptz,
  ntsa_cor_source "CorSource",
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE plate_vin_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL,
  plate_display text,
  vin text NOT NULL REFERENCES vehicles(vin) ON DELETE CASCADE,
  confidence float DEFAULT 0.5,
  source "PvmSource",
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pvm_plate ON plate_vin_map(plate);
CREATE INDEX idx_pvm_vin ON plate_vin_map(vin);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plate_vin_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicles readable by all" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Plate map readable by all" ON plate_vin_map FOR SELECT USING (true);
