import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface WatchlistEntry {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  search_query: string | null;
  best_price: number | null;
  previous_price: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("id, product_name, brand, category, search_query, best_price, previous_price, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true });
    if (!error && data) setItems(data as WatchlistEntry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (product: {
    product_name: string;
    brand?: string;
    category?: string;
    best_price?: number;
  }) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in to save items to your watchlist.", variant: "destructive" });
      return false;
    }
    // New items get a sort_order higher than the current max
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;
    const { error } = await supabase.from("watchlist").upsert(
      {
        user_id: user.id,
        product_name: product.product_name,
        brand: product.brand || null,
        category: product.category || null,
        best_price: product.best_price || null,
        sort_order: maxOrder + 1,
      },
      { onConflict: "user_id,product_name" }
    );
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Saved to watchlist", description: product.product_name });
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed from watchlist" });
  };

  const reorder = async (reorderedItems: WatchlistEntry[]) => {
    // Optimistically update local state
    setItems(reorderedItems);

    // Persist new sort_order values
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
      user_id: user!.id,
      product_name: item.product_name,
    }));

    for (const u of updates) {
      await supabase.from("watchlist").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
  };

  const isInWatchlist = (productName: string) =>
    items.some((i) => i.product_name.toLowerCase() === productName.toLowerCase());

  return { items, loading, add, remove, reorder, isInWatchlist, refresh: fetch };
}
