import { Heart, Trash2, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Skeleton } from "@/components/ui/skeleton";
import PageTransition from "@/components/PageTransition";

const Watchlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading, remove } = useWatchlist();

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Watchlist</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {user ? "Your saved products. Click to search for current prices." : "Sign in to save products and track prices."}
        </p>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
          >
            <Heart className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Sign in to use your watchlist</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Save products from search results to track prices over time.</p>
          </motion.div>
        )}

        {user && loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {user && !loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
          >
            <Heart className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Your watchlist is empty</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Search for a product and save it to start tracking prices.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
              Search Products
            </Button>
          </motion.div>
        )}

        {user && !loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand} · {item.category}
                    {item.best_price != null && (
                      <span className="ml-2 font-medium text-primary">£{Number(item.best_price).toFixed(2)}</span>
                    )}
                    {item.previous_price != null && item.best_price != null && item.previous_price !== item.best_price && (
                      <span className={`ml-1 text-[10px] ${Number(item.best_price) < Number(item.previous_price) ? "text-green-600" : "text-red-500"}`}>
                        {Number(item.best_price) < Number(item.previous_price) ? "↓" : "↑"} was £{Number(item.previous_price).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => navigate(`/results?q=${encodeURIComponent(item.product_name)}`)}
                  >
                    <Search className="h-3 w-3" />
                    Search
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Watchlist;
