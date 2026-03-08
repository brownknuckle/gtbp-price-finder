import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Star, Loader2, ExternalLink, Heart, RefreshCw, CheckCircle2, Tag, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { scrapePrices, searchProduct, type PriceResult, type ProductInfo } from "@/lib/api";
import { analytics } from "@/lib/analytics";
import { toAffiliateUrl } from "@/lib/affiliate";
import { useToast } from "@/hooks/use-toast";
import { useWatchlist } from "@/hooks/useWatchlist";
import PageTransition from "@/components/PageTransition";

type SortKey = "price" | "delivery" | "trust";

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = searchParams.get("q") || "";
  const stateProduct = (location.state as any)?.product as ProductInfo | undefined;
  const stateSizing = (location.state as any)?.sizing as {
    gender: string; sizeType: string; sizeRegion: string; size: string;
  } | undefined;

  const [product, setProduct] = useState<ProductInfo | undefined>(stateProduct);
  const [results, setResults] = useState<PriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [domesticOnly, setDomesticOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const fetchedRef = useRef(false);
  const [activeRetailer, setActiveRetailer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"identifying" | "scraping" | "done">("identifying");
  const { add: addToWatchlist, isInWatchlist } = useWatchlist();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<{ cached: boolean; cached_at?: string } | null>(null);
  const [thirtyDayLow, setThirtyDayLow] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const formatCheckedTime = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  };

  const refreshResults = useCallback(async () => {
    if (!product || isRefreshing) return;
    setIsRefreshing(true);
    setIsLoading(true);
    setPhase("scraping");
    setProgress(5);
    try {
      const sizeStr = stateSizing ? ` ${stateSizing.gender}'s ${stateSizing.sizeType === "shoes" ? `${stateSizing.sizeRegion} ${stateSizing.size}` : `size ${stateSizing.size}`}` : "";
      const resp = await scrapePrices(product.product_name + sizeStr, product.retailers, true, product.estimated_retail_price);
      setPhase("done");
      setProgress(100);
      setResults(resp.results);
      setDataSource({ cached: false });
      if (resp.thirtyDayLow != null) setThirtyDayLow(resp.thirtyDayLow);
      toast({ title: "Prices refreshed", description: `Found ${resp.results.length} results.` });
    } catch (e: any) {
      toast({ title: "Refresh failed", description: e.message || "Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [product, stateSizing, isRefreshing, toast]);
  // Dynamic page title
  useEffect(() => {
    const title = product?.product_name
      ? `${product.product_name} — Best Prices | GTBP`
      : "Searching… | GTBP";
    document.title = title;
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, [product]);

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
        const sizeStr = stateSizing ? ` ${stateSizing.gender}'s ${stateSizing.sizeType === "shoes" ? `${stateSizing.sizeRegion} ${stateSizing.size}` : `size ${stateSizing.size}`}` : "";
        const resp = await scrapePrices(prod.product_name + sizeStr, prod.retailers, false, prod.estimated_retail_price);
        setPhase("done");
        setProgress(100);
        setResults(resp.results);
        setDataSource({ cached: resp.cached, cached_at: resp.cached_at });
        if (resp.thirtyDayLow != null) setThirtyDayLow(resp.thirtyDayLow);
        analytics.viewResults(prod.product_name, resp.results.length);
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

  const domesticCountries = ["UK", "United Kingdom", "GB"];

  const filtered = results.filter((r) => {
    if (!domesticOnly) return true;
    return domesticCountries.some((c) => r.country?.toLowerCase() === c.toLowerCase()) || r.flag === "🇬🇧";
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price") return a.totalYouPay - b.totalYouPay;
    if (sortBy === "delivery") {
      // Parse delivery strings like "2-4 days" — sort by first number found
      const parseDelivery = (d: string) => {
        const m = d.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 999;
      };
      return parseDelivery(a.delivery) - parseDelivery(b.delivery);
    }
    if (sortBy === "trust") return (b.trustRating ?? 0) - (a.trustRating ?? 0);
    return 0;
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          {/* Product image */}
          {product?.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0"
            >
               <div className="h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-2xl border bg-secondary flex items-center justify-center">
                {product.image_url && !imageError ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="h-full w-full object-contain p-2"
                    onError={() => setImageError(true)}
                    loading="eager"
                  />
                ) : (
                  <span className="text-5xl select-none">{product.category === "shoes" ? "👟" : product.category === "clothing" ? "👕" : "🎒"}</span>
                )}
              </div>
            </motion.div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {product?.product_name || query}
            </h1>
            <p className="text-sm text-muted-foreground">
              {product?.brand} · {product?.category}
              {stateSizing && ` · ${stateSizing.gender}'s ${stateSizing.sizeType === "shoes" ? `${stateSizing.sizeRegion} ${stateSizing.size}` : `size ${stateSizing.size}`}`}
            </p>
          </div>
          {product && !isLoading && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={refreshResults}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant={isInWatchlist(product.product_name) ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (!isInWatchlist(product.product_name)) {
                    addToWatchlist({
                      product_name: product.product_name,
                      brand: product.brand,
                      category: product.category,
                      best_price: sorted[0]?.totalYouPay,
                    });
                    analytics.addWatchlist(product.product_name);
                  }
                }}
                disabled={isInWatchlist(product.product_name)}
              >
                <Heart className={`h-4 w-4 ${isInWatchlist(product.product_name) ? "fill-current" : ""}`} />
                {isInWatchlist(product.product_name) ? "Saved" : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        {!isLoading && results.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Freshness badge */}
            {dataSource && (() => {
              const inStockCount = sorted.filter(r => r.inStock === true).length;
              const ageLabel = dataSource.cached_at
                ? (() => {
                    const mins = Math.round((Date.now() - new Date(dataSource.cached_at).getTime()) / 60000);
                    return mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
                  })()
                : "";
              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={dataSource.cached ? "secondary" : "default"} className="text-[10px] gap-1">
                    {dataSource.cached ? `🕐 Prices from ${ageLabel}` : "⚡ Live prices"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {sorted.length} retailer{sorted.length !== 1 ? "s" : ""}
                  </span>
                  {inStockCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {inStockCount} verified in stock
                    </span>
                  )}
                </div>
              );
            })()}

            {/* 30-day low indicator */}
            {thirtyDayLow != null && sorted.length > 0 && (() => {
              const bestNow = sorted[0].totalYouPay;
              const isAtLow = bestNow <= thirtyDayLow * 1.03;
              return (
                <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  isAtLow
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}>
                  {isAtLow ? "📉 At 30-day low price" : `📊 30-day low was £${thirtyDayLow.toFixed(2)}`}
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span className={`text-xs font-medium transition-colors ${!domesticOnly ? "text-foreground" : "text-muted-foreground"}`}>
                  🌍 All Retailers
                </span>
                <Switch checked={domesticOnly} onCheckedChange={setDomesticOnly} />
                <span className={`text-xs font-medium transition-colors ${domesticOnly ? "text-foreground" : "text-muted-foreground"}`}>
                  🇬🇧 UK Only
                </span>
              </div>

              <div className="flex gap-1 rounded-full border border-border bg-card p-0.5">
                {([
                  ["price", "💰 Cheapest"],
                  ["delivery", "🚚 Fastest"],
                  ["trust", "⭐ Most Trusted"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      sortBy === key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading – identifying phase: centered spinner */}
        {isLoading && phase === "identifying" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Identifying product…
            </p>
          </div>
        )}

        {/* Loading – scraping phase: progress bar + skeleton cards */}
        {isLoading && phase === "scraping" && (
          <>
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Searching {product?.retailers?.length || 0} retailers…
                    </p>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeRetailer}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1.5 text-xs text-muted-foreground/70"
                    >
                      Checking {product?.retailers?.[activeRetailer] || "retailers"}…
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full rounded-xl border p-4"
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No results */}
        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm font-semibold text-foreground mb-1">No prices found</p>
            <p className="text-xs text-muted-foreground max-w-xs mb-5">
              Retailers may not carry this exact item, or the search timed out. Try a slightly different search term or include the colourway.
            </p>
            {product?.suggestions && product.suggestions.length > 0 && (
              <div className="mb-5 w-full max-w-sm">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Try instead</p>
                <div className="flex flex-col gap-2">
                  {product.suggestions.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => navigate(`/results?q=${encodeURIComponent(s)}`, { state: { sizing: (location.state as any)?.sizing } })}
                      className="rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  fetchedRef.current = false;
                  setIsLoading(true);
                  setPhase("scraping");
                  setProgress(5);
                  if (product) {
                    scrapePrices(product.product_name, product.retailers, true, product.estimated_retail_price)
                      .then((resp) => { setResults(resp.results); setDataSource({ cached: resp.cached, cached_at: resp.cached_at }); })
                      .catch((e: any) => { toast({ title: "Retry failed", description: e.message || "Please try again.", variant: "destructive" }); })
                      .finally(() => setIsLoading(false));
                  }
                }}
              >
                Retry Search
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                New Search
              </Button>
            </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {r.flag} {r.retailer}
                      </span>
                      {i === 0 && (
                        <Badge className="bg-primary text-primary-foreground">
                          Best Price
                        </Badge>
                      )}
                      {r.originalPrice && r.originalPrice > r.itemPrice && (
                        <Badge variant="destructive" className="text-[10px]">
                          {Math.round((1 - r.itemPrice / r.originalPrice) * 100)}% Off
                        </Badge>
                      )}
                      {r.inStock === true && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> In Stock
                        </span>
                      )}
                      {r.retailerTier === "authorised" && (
                        <span className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          <ShieldCheck className="h-3 w-3" /> Authorised
                        </span>
                      )}
                      {r.freeReturns && (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          ↩ Free Returns
                        </span>
                      )}
                      {r.retailerTier === "unverified" && (
                        <span className="text-[10px] text-amber-600">⚠ Unverified seller</span>
                      )}
                    </div>
                    {r.checkedAt && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                        Checked {formatCheckedTime(r.checkedAt)}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {r.originalPrice && r.originalPrice > r.itemPrice && (
                        <span className="line-through text-muted-foreground/50">£{r.originalPrice.toFixed(2)}</span>
                      )}
                      <span>Item: £{r.itemPrice.toFixed(2)}</span>
                      <span>Shipping: {r.shipping === 0 ? "Free" : `£${r.shipping.toFixed(2)}`}</span>
                      {r.duties > 0 && <span>Duties: £{r.duties.toFixed(2)}</span>}
                    </div>
                    {r.priceConfidence === "low" && (
                      <p className="mt-0.5 text-[10px] text-amber-600">⚠ Price estimated — verify on retailer site</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{r.delivery}</span>
                      {r.trustRating != null && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {r.trustRating} Trustpilot
                        </span>
                      )}
                    </div>
                    {r.couponCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded border border-green-200 bg-green-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-green-700">
                          <Tag className="h-2.5 w-2.5" /> {r.couponCode}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(r.couponCode!);
                            setCopiedCode(r.couponCode!);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {copiedCode === r.couponCode ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    )}
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
                    onClick={() => {
                      try {
                        const safe = new URL(r.url);
                        if (safe.protocol === "https:" || safe.protocol === "http:") {
                          const domain = safe.hostname.replace(/^www\./, "");
                          const dest = toAffiliateUrl(r.url, domain);
                          analytics.clickBuy(r.retailer, product?.product_name ?? "", r.itemPrice);
                          window.open(dest, "_blank", "noopener,noreferrer");
                        }
                      } catch {}
                    }}
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
