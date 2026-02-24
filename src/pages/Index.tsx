import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera, ArrowRight, Loader2 } from "lucide-react";
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
import { sizeOptions } from "@/lib/mockData";
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Predictive text: fetch suggestions as user types
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await searchProduct(query);
        setSuggestions(result.suggestions || []);
        setShowSuggestions(true);
      } catch {
        // Silently fail for autocomplete
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setShowSuggestions(false);
    setIsSearching(true);

    try {
      // Identify the product first
      const product = await searchProduct(q);
      // Navigate to results with product data in state
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
      <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          {/* Bold orange logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-1"
          >
            <h1 className="font-display text-8xl uppercase leading-none tracking-wider text-primary sm:text-9xl">
              GTBP
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-12 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
          >
            Get The Best Price
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="relative mb-5 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Paste a URL, SKU, brand, or describe any item…"
                className="h-13 rounded-md border-border bg-card pr-10 text-base shadow-xs transition-shadow focus-visible:shadow-md"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={isSearching}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary">
                <Camera className="h-5 w-5" />
              </button>

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

            <div className="flex gap-2">
              <Select defaultValue="shoes" onValueChange={(v) => setSizeType(v as "clothing" | "shoes")}>
                <SelectTrigger className="h-13 w-24 rounded-md text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="10">
                <SelectTrigger className="h-13 w-20 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(sizeType === "clothing" ? sizeOptions.clothing : sizeOptions.shoes).map(
                    (size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <Button
                onClick={() => handleSearch()}
                disabled={isSearching}
                className="h-13 rounded-md px-6 font-display text-lg uppercase tracking-wider"
              >
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {isSearching ? "Searching…" : "Search"}
              </Button>
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
                className="group flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm disabled:opacity-50"
              >
                {term}
                <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
