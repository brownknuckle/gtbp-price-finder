import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { searchResults, productImages } from "@/lib/mockData";
import PageTransition from "@/components/PageTransition";

type SortKey = "price" | "delivery" | "trust";

const Results = () => {
  const navigate = useNavigate();
  const [domesticOnly, setDomesticOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("price");

  const sorted = [...searchResults].sort((a, b) => {
    if (sortBy === "price") return a.totalYouPay - b.totalYouPay;
    if (sortBy === "trust") return b.trustRating - a.trustRating;
    return 0;
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
            <img src={productImages.cortez} alt="Nike Cortez" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nike Cortez White/Black</h1>
            <p className="text-sm text-muted-foreground">Men's Size 10</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">All Retailers</span>
            <Switch checked={domesticOnly} onCheckedChange={setDomesticOnly} />
            <span className="text-sm text-muted-foreground">Domestic Only</span>
          </div>

          <div className="flex gap-1">
            {([["price", "Price"], ["delivery", "Delivery"], ["trust", "Trust"]] as const).map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    sortBy === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Result cards */}
        <div className="space-y-3">
          {sorted.map((r, i) => (
            <motion.button
              key={r.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/detail")}
              className={`w-full rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${
                i === 0
                  ? "border-accent bg-accent/5 shadow-sm"
                  : ""
              }`}
              style={{ opacity: i === 0 ? 1 : 1 - i * 0.08 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {r.flag} {r.retailer}
                      </span>
                      {i === 0 && (
                        <Badge className="bg-accent text-accent-foreground">
                          Best Price
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Item: ${r.itemPrice.toFixed(2)}</span>
                      <span>Shipping: ${r.shipping.toFixed(2)}</span>
                      <span>Duties: ${r.duties.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{r.delivery}</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {r.trustRating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total You Pay</p>
                    <p className="text-2xl font-extrabold text-accent">
                      ${r.totalYouPay.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Results;
