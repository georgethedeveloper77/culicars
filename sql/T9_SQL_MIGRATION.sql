-- T9: Payments + Unlock Flow
-- Run in Supabase SQL Editor

-- ─── credit_transactions (append-only ledger) ───────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL,                  -- positive = credit, negative = debit
  type            TEXT NOT NULL,                     -- 'purchase' | 'unlock' | 'refund' | 'admin_grant'
  provider        TEXT,                              -- 'mpesa' | 'stripe' | 'paypal' | null for debits
  provider_ref    TEXT UNIQUE,                       -- idempotency key from payment provider
  pack_id         TEXT,                              -- which credit pack was purchased
  report_id       UUID REFERENCES "report"(id),      -- linked if type = 'unlock'
  status          TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'failed'
  meta_json       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO UPDATE or DELETE ever — append-only ledger
);

-- ─── report_unlocks (idempotent access records) ──────────────────────────────
-- May already exist from T1/T8 — CREATE IF NOT EXISTS is safe
CREATE TABLE IF NOT EXISTS report_unlock (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id   UUID NOT NULL REFERENCES "report"(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_provider_ref ON credit_transactions(provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_tx_status ON credit_transactions(status);
CREATE INDEX IF NOT EXISTS idx_report_unlock_user ON report_unlock(user_id);

-- ─── Seed admin config keys for T9 ──────────────────────────────────────────
-- Upsert default payment config if not already set
INSERT INTO admin_config (key, value, updated_by) VALUES
  ('payment_providers_web', '["mpesa","stripe"]', 'system'),
  ('payment_providers_app', '["mpesa","stripe"]', 'system'),
  ('credit_packs_web', '[
    {"id":"starter","label":"Starter","credits":5,"price_kes":250,"price_usd":2},
    {"id":"standard","label":"Standard","credits":15,"price_kes":600,"price_usd":5},
    {"id":"pro","label":"Pro","credits":40,"price_kes":1400,"price_usd":11}
  ]', 'system'),
  ('credit_packs_app', '[
    {"id":"starter","label":"Starter","credits":5,"price_kes":250,"price_usd":2},
    {"id":"standard","label":"Standard","credits":15,"price_kes":600,"price_usd":5},
    {"id":"pro","label":"Pro","credits":40,"price_kes":1400,"price_usd":11}
  ]', 'system')
ON CONFLICT (key) DO NOTHING;
