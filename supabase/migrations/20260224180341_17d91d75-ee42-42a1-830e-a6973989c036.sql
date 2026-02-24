
CREATE TABLE public.price_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_key TEXT NOT NULL UNIQUE,
  product_info JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_price_cache_product_key ON public.price_cache (product_key);

-- Auto-expire old cache entries (older than 6 hours)
CREATE OR REPLACE FUNCTION public.cleanup_price_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.price_cache WHERE created_at < now() - interval '6 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_cleanup_price_cache
AFTER INSERT ON public.price_cache
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_price_cache();

-- Public read/write since this is anonymous product data, no user data
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
ON public.price_cache FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert cache"
ON public.price_cache FOR INSERT
WITH CHECK (true);
