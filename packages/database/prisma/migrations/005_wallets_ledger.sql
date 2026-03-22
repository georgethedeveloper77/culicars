-- 005_wallets_ledger.sql
-- credit_ledger is APPEND ONLY — never UPDATE or DELETE

CREATE TABLE wallets (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz
);

CREATE TABLE credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type "LedgerType" NOT NULL,
  credits_delta integer NOT NULL,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  source text,
  report_id uuid REFERENCES reports(id),
  tx_ref text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ledger_user ON credit_ledger(user_id);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wallet readable by owner" ON wallets FOR SELECT USING (auth.uid()::uuid = user_id);
CREATE POLICY "Ledger readable by owner" ON credit_ledger FOR SELECT USING (auth.uid()::uuid = user_id);
