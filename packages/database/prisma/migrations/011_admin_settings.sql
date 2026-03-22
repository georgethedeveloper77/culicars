-- 011_admin_settings.sql

CREATE TABLE admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings readable by all" ON admin_settings FOR SELECT USING (true);
