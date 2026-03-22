-- 009_scraper_jobs_raw.sql

CREATE TABLE scraper_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source "ScraperSrc" NOT NULL,
  status "JobStatus" DEFAULT 'queued',
  trigger "JobTrigger",
  items_found integer DEFAULT 0,
  items_stored integer DEFAULT 0,
  items_skipped integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_log text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE scraper_data_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES scraper_jobs(id),
  source text NOT NULL,
  raw_data jsonb NOT NULL,
  vin text,
  plate text,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_raw_vin ON scraper_data_raw(vin);
CREATE INDEX idx_raw_plate ON scraper_data_raw(plate);
CREATE INDEX idx_raw_processed ON scraper_data_raw(processed);

ALTER TABLE scraper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_data_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scraper jobs admin only" ON scraper_jobs FOR SELECT USING (true);
CREATE POLICY "Scraper data admin only" ON scraper_data_raw FOR SELECT USING (true);
