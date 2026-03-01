
ALTER TABLE public.watchlist ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Set initial sort_order based on created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM public.watchlist
)
UPDATE public.watchlist w SET sort_order = n.rn
FROM numbered n WHERE w.id = n.id;
