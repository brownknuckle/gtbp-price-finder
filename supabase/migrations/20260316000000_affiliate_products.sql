-- Affiliate product feed table — populated by feed-ingest edge function
CREATE TABLE IF NOT EXISTS affiliate_products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant     text NOT NULL,
  product_name text NOT NULL,
  brand        text,
  price        numeric(10,2) NOT NULL,
  rrp          numeric(10,2),
  currency     text NOT NULL DEFAULT 'GBP',
  deep_link    text NOT NULL,
  image_url    text,
  in_stock     boolean,
  sku          text,
  category     text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant, sku)
);

-- Full-text search index on product name + brand
CREATE INDEX IF NOT EXISTS affiliate_products_fts
  ON affiliate_products
  USING gin(to_tsvector('english', coalesce(brand, '') || ' ' || product_name));

-- Index for filtering by merchant
CREATE INDEX IF NOT EXISTS affiliate_products_merchant
  ON affiliate_products (merchant);

-- Index for stale feed cleanup
CREATE INDEX IF NOT EXISTS affiliate_products_updated
  ON affiliate_products (last_updated);
