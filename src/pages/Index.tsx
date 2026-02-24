import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Loader2, ShieldCheck, Zap, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sizeOptions, shoeSizes, type SizeRegion } from "@/lib/mockData";
import { searchProduct } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";

const trendingSearches = [
  "Nike Air Max 1",
  "New Balance 550",
  "Stone Island Jacket",
  "Adidas Samba",
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [sizeType, setSizeType] = useState<"clothing" | "shoes">("shoes");
  const [sizeRegion, setSizeRegion] = useState<SizeRegion>("UK");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Predictive text: fetch suggestions as user types
  useEffect(() => {
    if (query.length < 3 || isSearching) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (isSearching) return;
      try {
        const result = await searchProduct(query);
        if (!isSearching) {
          setSuggestions(result.suggestions || []);
          setShowSuggestions(true);
        }
      } catch {
        // Silently fail for autocomplete
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isSearching]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    try {
      const product = await searchProduct(q);
      navigate(`/results?q=${encodeURIComponent(q)}`, {
        state: { product },
      });
    } catch (e: any) {
      toast({
        title: "Search failed",
        description: e.message || "Could not identify this product. Try a different query.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-57px)] flex-col">
        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-1"
            >
              <h1 className="font-display text-7xl uppercase leading-none tracking-wider text-primary sm:text-9xl">
                GTBP
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mb-10 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:mb-12"
            >
              Get The Best Price
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="relative mb-5"
            >
              {/* Search input row */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Paste a URL, SKU, brand, or describe any item…"
                    className="h-12 rounded-md border-border bg-card pr-4 text-sm shadow-xs transition-shadow focus-visible:shadow-md sm:h-13 sm:text-base"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={isSearching}
                  />

                  {/* Predictive suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-card shadow-lg"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                            onMouseDown={() => {
                              setQuery(s);
                              setShowSuggestions(false);
                              handleSearch(s);
                            }}
                          >
                            <Search className="h-3.5 w-3.5 text-muted-foreground" />
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                  className="h-12 rounded-md px-6 font-display text-base uppercase tracking-wider sm:h-13 sm:text-lg"
                >
                  {isSearching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  {isSearching ? "Searching…" : "Search"}
                </Button>
              </div>

              {/* Size selectors - secondary row on mobile */}
              <div className="mt-2 flex gap-2 sm:mt-0 sm:hidden">
                <Select defaultValue="shoes" onValueChange={(v) => setSizeType(v as "clothing" | "shoes")}>
                  <SelectTrigger className="h-10 flex-1 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                  </SelectContent>
                </Select>

                {sizeType === "shoes" && (
                  <Select defaultValue="UK" onValueChange={(v) => setSizeRegion(v as SizeRegion)}>
                    <SelectTrigger className="h-10 w-16 rounded-md text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="EU">EU</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select defaultValue={sizeType === "shoes" ? "9" : "M"}>
                  <SelectTrigger className="h-10 w-20 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(sizeType === "clothing" ? sizeOptions.clothing : shoeSizes[sizeRegion]).map(
                      (size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop size selectors inline - hidden on mobile */}
              <div className="hidden sm:mt-3 sm:flex sm:gap-2">
                <Select defaultValue="shoes" onValueChange={(v) => setSizeType(v as "clothing" | "shoes")}>
                  <SelectTrigger className="h-10 w-24 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                  </SelectContent>
                </Select>

                {sizeType === "shoes" && (
                  <Select defaultValue="UK" onValueChange={(v) => setSizeRegion(v as SizeRegion)}>
                    <SelectTrigger className="h-10 w-16 rounded-md text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="EU">EU</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select defaultValue={sizeType === "shoes" ? "9" : "M"}>
                  <SelectTrigger className="h-10 w-20 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(sizeType === "clothing" ? sizeOptions.clothing : shoeSizes[sizeRegion]).map(
                      (size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Trending chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {trendingSearches.map((term, i) => (
                <motion.button
                  key={term}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                  disabled={isSearching}
                  onClick={() => {
                    setQuery(term);
                    handleSearch(term);
                  }}
                  className="group flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm disabled:opacity-50 sm:px-4 sm:text-sm"
                >
                  {term}
                  <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* How It Works */}
        <section className="border-t bg-secondary/30 px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
              How It Works
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Search Any Product",
                  desc: "Paste a URL, type a product name, or enter a SKU. Our AI identifies exactly what you're looking for.",
                },
                {
                  icon: Globe,
                  title: "We Search 20+ Retailers",
                  desc: "We scrape Nike, JD Sports, Size?, Foot Locker, END., StockX and many more to find every available listing.",
                },
                {
                  icon: Zap,
                  title: "Get The Best Price",
                  desc: "Results ranked by total cost including shipping & duties. One click takes you straight to the retailer.",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="border-t px-4 py-12">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 text-center">
            {[
              { icon: ShieldCheck, label: "No sign-up required" },
              { icon: Zap, label: "Results in under 30s" },
              { icon: Globe, label: "20+ UK & EU retailers" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-4 w-4 text-primary" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t bg-secondary/30 px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "Is GTBP free to use?",
                  a: "Yes, completely free. We don't charge you anything — just search and buy directly from the retailer.",
                },
                {
                  q: "How do you find the prices?",
                  a: "We use AI to search across 20+ UK and international retailers in real-time, extracting actual product page prices — not estimates.",
                },
                {
                  q: "Are shipping costs included?",
                  a: "Yes. We estimate shipping and import duties for non-UK retailers so the 'Total You Pay' is the real landed cost.",
                },
                {
                  q: "Do you sell products?",
                  a: "No. GTBP is a price comparison tool. When you click 'Buy Now', you go directly to the retailer's website.",
                },
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="mb-1 text-sm font-bold text-foreground">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t px-4 py-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-display text-lg uppercase tracking-wider text-primary">GTBP</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get The Best Price — Compare prices across UK retailers instantly.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} GTBP. All rights reserved. Prices are indicative and may vary.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;