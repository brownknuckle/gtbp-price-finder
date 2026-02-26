-- Drop overly permissive INSERT policy on price_cache
DROP POLICY IF EXISTS "Anyone can insert cache" ON public.price_cache;

-- Replace with a policy that denies anonymous inserts (service role bypasses RLS anyway)
CREATE POLICY "Only service role can insert cache"
ON public.price_cache
FOR INSERT
WITH CHECK (false);

-- Also add UPDATE restriction (service role uses upsert)
CREATE POLICY "Only service role can update cache"
ON public.price_cache
FOR UPDATE
USING (false);

-- Keep the SELECT open since cache is public data
-- The existing "Anyone can read cache" policy is fine