
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_key TEXT NOT NULL,
  results JSONB NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_product_key ON public.price_history (product_key);
CREATE INDEX idx_price_history_checked_at ON public.price_history (checked_at);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price history"
ON public.price_history FOR SELECT
USING (true);

CREATE POLICY "Only service role can insert price history"
ON public.price_history FOR INSERT
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.cleanup_price_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.price_history WHERE checked_at < now() - interval '90 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_cleanup_price_history
AFTER INSERT ON public.price_history
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_price_history();
