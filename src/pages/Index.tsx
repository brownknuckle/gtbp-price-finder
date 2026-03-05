import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ArrowRight, Loader2, ShieldCheck, Zap, Globe, Camera, X, CheckCircle, AlertTriangle, Edit3 } from "lucide-react";
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
import { searchProduct, fetchTrending, type ProductInfo, type TrendingItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";

const fallbackTrending = [
  "Nike Air Force 1 Triple White",
  "New Balance 550 White Grey",
  "Stone Island Patch Crewneck Navy",
  "Adidas Samba OG White Black",
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<"men" | "women" | "unisex">("men");
  const [sizeType, setSizeType] = useState<"clothing" | "shoes">("shoes");
  const [sizeRegion, setSizeRegion] = useState<SizeRegion>("UK");
  const [size, setSize] = useState(sizeType === "shoes" ? "9" : "M");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<ProductInfo | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch trending items on mount
  useEffect(() => {
    fetchTrending()
      .then((items) => setTrendingItems(items))
      .catch(() => {
        // Use fallback if trending fetch fails
        setTrendingItems(fallbackTrending.map((name) => ({ name, category: "shoes" as const, emoji: "👟" })));
      });
  }, []);

  // Reset size to sensible default when sizeType changes
  useEffect(() => {
    setSize(sizeType === "shoes" ? "9" : "M");
  }, [sizeType]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB image size.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const processDroppedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please drop an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB image size.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processDroppedFile(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setPendingProduct(null);
    setEditingName(false);
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() && !imageBase64) return;

    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    try {
      const product = await searchProduct(q || "Identify this product", imageBase64 || undefined);

      // If image search, show confirmation step instead of navigating immediately
      if (imageBase64 && !pendingProduct) {
        setPendingProduct(product);
        setEditedName(product.product_name);
        setIsSearching(false);
        return;
      }

      navigate(`/results?q=${encodeURIComponent(product.product_name || q)}`, {
        state: { product, sizing: { gender, sizeType, sizeRegion, size } },
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

  const handleConfirmProduct = () => {
    if (!pendingProduct) return;
    const finalProduct = { ...pendingProduct, product_name: editedName || pendingProduct.product_name };
    navigate(`/results?q=${encodeURIComponent(finalProduct.product_name)}`, {
      state: { product: finalProduct, sizing: { gender, sizeType, sizeRegion, size } },
    });
  };

  const handleRejectAndRetry = async () => {
    setPendingProduct(null);
    setEditingName(false);
    // Re-search with the edited name as a text query for better accuracy
    if (editedName && editedName !== pendingProduct?.product_name) {
      setQuery(editedName);
      clearImage();
      setIsSearching(true);
      try {
        const product = await searchProduct(editedName);
        navigate(`/results?q=${encodeURIComponent(product.product_name)}`, {
          state: { product, sizing: { gender, sizeType, sizeRegion, size } },
        });
      } catch (e: any) {
        toast({ title: "Search failed", description: e.message, variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
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
              className={`relative mb-5 rounded-xl transition-all duration-200 ${isDraggingOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              <AnimatePresence>
                {isDraggingOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-8 w-8 text-primary" />
                      <p className="text-sm font-semibold text-primary">Drop image to search</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Image preview */}
              <AnimatePresence>
                {imagePreview && !pendingProduct && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-2"
                  >
                    <img src={imagePreview} alt="Upload preview" className="h-14 w-14 rounded object-cover" />
                    <span className="flex-1 text-xs text-muted-foreground">Image attached — we'll identify this product</span>
                    <button onClick={clearImage} className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirmation step after image identification */}
              <AnimatePresence>
                {pendingProduct && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {imagePreview && (
                        <img src={imagePreview} alt="Identified product" className="h-16 w-16 rounded-md object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {pendingProduct.confidence >= 0.8 ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="text-xs font-medium text-muted-foreground">
                            {pendingProduct.confidence >= 0.8 ? "High confidence match" : "Low confidence — please verify"}
                            {" "}({Math.round(pendingProduct.confidence * 100)}%)
                          </span>
                        </div>

                        {editingName ? (
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="mb-2 h-9 text-sm font-semibold"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditingName(false);
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingName(true)}
                            className="mb-2 flex items-center gap-1.5 text-left text-sm font-semibold text-foreground hover:text-primary"
                          >
                            {editedName || pendingProduct.product_name}
                            <Edit3 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}

                        {pendingProduct.identification_notes && (
                          <p className="mb-2 text-[11px] text-muted-foreground">{pendingProduct.identification_notes}</p>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleConfirmProduct} className="h-8 gap-1 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Correct — Search Prices
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleRejectAndRetry} className="h-8 gap-1 text-xs">
                            <Edit3 className="h-3 w-3" />
                            Wrong — Use Edited Name
                          </Button>
                          <button onClick={clearImage} className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Search input row */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                    placeholder="e.g. Nike Air Force 1 Triple White UK 9, or paste a URL…"
                    className="h-12 rounded-md border-border bg-card pl-4 pr-12 text-sm shadow-xs transition-shadow focus-visible:shadow-md sm:h-13 sm:text-base"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={isSearching}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSearching}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    title="Search by image"
                  >
                    <Camera className="h-4 w-4" />
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

              {/* Colorway hint */}
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                💡 Include the <span className="font-semibold">colorway</span> for precise results — e.g. <em>Adidas Samba White Black</em>
              </p>

              {/* Size selectors - secondary row on mobile */}
              <div className="mt-2 flex flex-wrap gap-2 sm:mt-0 sm:hidden">
                <Select value={gender} onValueChange={(v) => setGender(v as "men" | "women" | "unisex")}>
                  <SelectTrigger className="h-10 flex-1 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">👨 Men's</SelectItem>
                    <SelectItem value="women">👩 Women's</SelectItem>
                    <SelectItem value="unisex">⚡ Unisex</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sizeType} onValueChange={(v) => setSizeType(v as "clothing" | "shoes")}>
                  <SelectTrigger className="h-10 flex-1 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                  </SelectContent>
                </Select>

                {sizeType === "shoes" && (
                  <Select value={sizeRegion} onValueChange={(v) => setSizeRegion(v as SizeRegion)}>
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

                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-10 w-20 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(sizeType === "clothing" ? sizeOptions.clothing : shoeSizes[sizeRegion]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop size selectors inline - hidden on mobile */}
              <div className="hidden sm:mt-3 sm:flex sm:gap-2">
                <Select value={gender} onValueChange={(v) => setGender(v as "men" | "women" | "unisex")}>
                  <SelectTrigger className="h-10 w-28 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">👨 Men's</SelectItem>
                    <SelectItem value="women">👩 Women's</SelectItem>
                    <SelectItem value="unisex">⚡ Unisex</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sizeType} onValueChange={(v) => setSizeType(v as "clothing" | "shoes")}>
                  <SelectTrigger className="h-10 w-24 rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                  </SelectContent>
                </Select>

                {sizeType === "shoes" && (
                  <Select value={sizeRegion} onValueChange={(v) => setSizeRegion(v as SizeRegion)}>
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

                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-10 w-20 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(sizeType === "clothing" ? sizeOptions.clothing : shoeSizes[sizeRegion]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
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
              className="space-y-2"
            >
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                🔥 Trending Now
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {(trendingItems.length > 0
                  ? trendingItems
                  : fallbackTrending.map((name) => ({ name, category: "shoes" as const, emoji: "👟" }))
                ).map((item, i) => (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.07 }}
                    disabled={isSearching}
                    onClick={() => {
                      setQuery(item.name);
                      handleSearch(item.name);
                    }}
                    className="group flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm disabled:opacity-50 sm:px-4 sm:text-sm"
                  >
                    <span>{item.emoji}</span>
                    {item.name}
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </motion.button>
                ))}
              </div>
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
                  title: "We Search 30+ Retailers",
                  desc: "We search Nike, JD Sports, Size?, Foot Locker, END., StockX, ASOS, Schuh, GOAT, Farfetch and 20+ more to find every listing.",
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
              { icon: Globe, label: "30+ UK & EU retailers" },
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
                  a: "We use AI to search across 30+ UK and international retailers in real-time, extracting actual product page prices — not estimates.",
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
            <p className="mt-3 text-xs text-muted-foreground/80">
              GTBP is a price comparison service. We are not affiliated with any retailer.
              Prices are indicative — always verify on the retailer's site before purchasing.
            </p>
            <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground/60">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} GTBP. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;