-- 004_vehicle_events.sql

CREATE TABLE vehicle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin text NOT NULL REFERENCES vehicles(vin) ON DELETE CASCADE,
  event_type "EventType" NOT NULL,
  event_date date NOT NULL,
  country text DEFAULT 'KE',
  county text,
  source "EventSource",
  source_ref text,
  confidence float DEFAULT 0.8,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_events_vin ON vehicle_events(vin);
CREATE INDEX idx_events_date ON vehicle_events(event_date);

ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events readable by all" ON vehicle_events FOR SELECT USING (true);
