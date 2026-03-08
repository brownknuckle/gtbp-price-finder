-- Run this in Supabase SQL Editor for project jbftwbduusnjoufsotpq
-- Enables the 30-day price low feature

CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL,
  results jsonb NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS price_history_product_key_checked_at
  ON price_history (product_key, checked_at);
