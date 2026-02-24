import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Star, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { scrapePrices, searchProduct, type PriceResult, type ProductInfo } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";

type SortKey = "price" | "delivery" | "trust";

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = searchParams.get("q") || "";
  const stateProduct = (location.state as any)?.product as ProductInfo | undefined;

  const [product, setProduct] = useState<ProductInfo | undefined>(stateProduct);
  const [results, setResults] = useState<PriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [domesticOnly, setDomesticOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const fetchedRef = useRef(false);
  const [activeRetailer, setActiveRetailer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"identifying" | "scraping" | "done">("identifying");
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const run = async () => {
      setIsLoading(true);
      try {
        // If no product from navigation state, fetch it from the query
        let prod = product;
        if (!prod) {
          if (!query) {
            navigate("/");
            return;
          }
          setPhase("identifying");
          prod = await searchProduct(query);
          setProduct(prod);
        }

        setPhase("scraping");
        setProgress(5);
        const data = await scrapePrices(prod.product_name, prod.retailers);
        setPhase("done");
        setProgress(100);
        setResults(data);
      } catch (e: any) {
        toast({
          title: "Price search failed",
          description: e.message || "Could not find prices. Try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  // Simulate progress ticking while scraping
  useEffect(() => {
    if (!isLoading || phase !== "scraping") return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, phase]);

  // Cycle through retailer names
  useEffect(() => {
    if (!isLoading || !product?.retailers?.length || phase !== "scraping") return;
    const interval = setInterval(() => {
      setActiveRetailer((i) => (i + 1) % product.retailers.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading, product, phase]);

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "price") return a.totalYouPay - b.totalYouPay;
    if (sortBy === "trust") return b.trustRating - a.trustRating;
    return 0;
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">
            {product?.product_name || query}
          </h1>
          <p className="text-sm text-muted-foreground">
            {product?.brand} · {product?.category}
          </p>
        </div>

        {/* Controls */}
        {!isLoading && results.length > 0 && (
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
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            {phase === "identifying" ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  Identifying product…
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  Searching retailers for the best prices…
                </p>
                <div className="mt-4 w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeRetailer}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 text-xs text-muted-foreground/70"
                  >
                    Checking {product?.retailers?.[activeRetailer] || "retailers"}…
                  </motion.p>
                </AnimatePresence>
                <p className="mt-2 text-xs text-muted-foreground/50">
                  {product?.retailers?.length || 0} retailers · may take 20–30s
                </p>
              </>
            )}
          </div>
        )}

        {/* No results */}
        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm font-medium text-muted-foreground">
              No prices found. Try a different search.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
              Back to Search
            </Button>
          </div>
        )}

        {/* Result cards */}
        <div className="space-y-3">
          {sorted.map((r, i) => (
            <motion.div
              key={`${r.retailer}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
              whileHover={{ scale: 1.01, y: -2 }}
              className={`w-full rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${
                i === 0 ? "border-primary/30 bg-primary/5 shadow-sm" : ""
              }`}
              style={{ opacity: i === 0 ? 1 : 1 - i * 0.06 }}
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
                        <Badge className="bg-primary text-primary-foreground">
                          Best Price
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Item: £{r.itemPrice.toFixed(2)}</span>
                      <span>Shipping: £{r.shipping.toFixed(2)}</span>
                      <span>Duties: £{r.duties.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{r.delivery}</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {r.trustRating} Trustpilot
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total You Pay</p>
                    <p className="text-2xl font-extrabold text-primary">
                      £{r.totalYouPay.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(r.url, "_blank")}
                  >
                    Buy Now
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Results;
