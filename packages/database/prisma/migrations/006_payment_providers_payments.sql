-- 006_payment_providers_payments.sql

CREATE TABLE payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug "ProviderSlug" UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  config jsonb,
  updated_at timestamptz
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  provider text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'KES',
  credits integer NOT NULL,
  status "PayStatus" DEFAULT 'pending',
  provider_ref text UNIQUE,
  provider_meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers readable by all" ON payment_providers FOR SELECT USING (true);
CREATE POLICY "Payments readable by owner" ON payments FOR SELECT USING (auth.uid()::uuid = user_id);
