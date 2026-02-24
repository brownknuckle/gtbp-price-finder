import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

const Watchlist = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Watchlist</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Save products to track prices over time. Coming soon.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
        >
          <Heart className="mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Your watchlist is empty
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Search for a product and save it to start tracking prices.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate("/")}
          >
            Search Products
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Watchlist;