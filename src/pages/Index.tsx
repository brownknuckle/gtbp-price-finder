import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, ArrowRight, Loader2, ShieldCheck, Zap, Globe, Camera, X, CheckCircle, AlertTriangle, Edit3, Bell, Heart, Clock, Tag } from "lucide-react";
import { toProductSlug } from "@/lib/utils";
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
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";

const fallbackTrending = [
  "Nike Air Force 1 Triple White",
  "New Balance 550 White Grey",
  "Stone Island Patch Crewneck Navy",
  "Adidas Samba OG White Black",
];

const PLACEHOLDER_EXAMPLES = [
  "Nike Air Force 1 Triple White UK 9",
  "Adidas Samba OG White Black",
  "New Balance 550 White Grey",
  "Air Jordan 4 Retro Bred",
  "Salomon XT-6 Black",
  "Carhartt WIP Active Jacket Black",
  "Nike Dunk Low Panda",
  "Stone Island Garment Dyed Hoodie",
  "ASICS Gel-Kayano 14 Cream",
  "New Balance 1906R Protection Pack",
  "Adidas Campus 00s Cloud White",
  "Hoka Bondi 8 White",
  "Puma Palermo White Gum",
  "Converse Chuck 70 High Black",
  "On Cloudmonster Undyed White",
];

// Expanded local catalogue for autocomplete — no API call needed
const LOCAL_PRODUCT_CATALOGUE = [
  // Nike sneakers
  "Nike Air Force 1 Low Triple White", "Nike Air Force 1 Low Black", "Nike Air Force 1 Low White Grey",
  "Nike Dunk Low Retro White Black Panda", "Nike Dunk Low Retro Black White", "Nike Dunk Low University Red",
  "Nike Air Max 95 Triple Black", "Nike Air Max 95 White", "Nike Air Max 95 Grey",
  "Nike Air Max 97 Silver Bullet", "Nike Air Max 97 Triple Black", "Nike Air Max 97 White",
  "Nike Air Max 1 White Grey", "Nike Air Max 1 Black", "Nike Air Max 1 Lucky Green",
  "Nike Air Max 90 White", "Nike Air Max 90 Black",
  "Nike Killshot 2 White", "Nike Cortez White",
  "Nike Air Max Plus Triple Black", "Nike Air Max Plus White",
  "Nike Pegasus 41", "Nike React Infinity Run",
  // Jordan
  "Air Jordan 1 Retro High OG", "Air Jordan 1 Low", "Air Jordan 1 Mid Chicago Black Toe",
  "Air Jordan 4 Retro", "Air Jordan 4 Retro Military Black", "Air Jordan 3 Retro",
  "Air Jordan 6 Retro", "Air Jordan 11 Retro",
  // Adidas sneakers
  "Adidas Samba OG White Black Gum", "Adidas Samba OG Black", "Adidas Samba OG White Blue",
  "Adidas Gazelle Indoor Green Gum", "Adidas Gazelle Indoor Black", "Adidas Gazelle Black",
  "Adidas Campus 00s Cloud White", "Adidas Campus 00s Black", "Adidas Campus 00s Green",
  "Adidas Stan Smith White Green", "Adidas Stan Smith White",
  "Adidas Handball Spezial Blue", "Adidas Handball Spezial Black",
  "Adidas Forum Low White Blue", "Adidas Forum Low Black",
  "Adidas Ultraboost 1.0 White",
  "Adidas NMD R1 Triple Black", "Adidas NMD R1 White",
  "Adidas Superstar White Black",
  // New Balance
  "New Balance 550 White Green", "New Balance 550 White Grey", "New Balance 550 White Navy",
  "New Balance 990v6 Grey", "New Balance 990v6 Black",
  "New Balance 991 Grey", "New Balance 992 Grey",
  "New Balance 574 Grey", "New Balance 574 Green",
  "New Balance 327 White", "New Balance 530 White",
  "New Balance 1080 White", "New Balance 2002R White",
  // ASICS
  "ASICS Gel-1130 White Silver", "ASICS Gel-1130 Black", "ASICS Gel-1130 Cream",
  "ASICS Gel-Kayano 14 White", "ASICS Gel-Kayano 14 Black",
  "ASICS Gel-Nimbus 9 White", "ASICS Gel-Lyte III White",
  "ASICS GT-2160 White", "ASICS GT-2160 Black",
  // Salomon
  "Salomon XT-6 Black", "Salomon XT-6 White", "Salomon ACS Pro Black",
  // On Running
  "On Cloudmonster Black", "On Cloudrunner 2 Black",
  // Converse & Vans
  "Converse Chuck Taylor All Star White", "Converse Chuck Taylor All Star Black",
  "Converse Chuck 70 White", "Converse Run Star Hike White",
  "Vans Old Skool Black White", "Vans Old Skool White", "Vans Sk8-Hi Black",
  "Vans Authentic Black", "Vans Authentic White",
  // Other brands
  "Timberland 6-Inch Premium Boot Wheat",
  "Dr. Martens 1460 Pascal Black", "Dr. Martens 1461 Black",
  "Reebok Classic Leather White", "Reebok Club C 85 White",
  // Nike clothing
  "Nike Tech Fleece Joggers Black", "Nike Tech Fleece Hoodie Black",
  "Nike Tech Fleece Full-Zip Hoodie", "Nike Tech Fleece Joggers Grey",
  "Nike Essential Fleece Joggers", "Nike Club Fleece Hoodie",
  // Jordan clothing
  "Jordan Essentials Fleece Joggers", "Jordan Flight Fleece Hoodie",
  // North Face
  "The North Face Nuptse 700 Jacket Black", "The North Face Nuptse 700 Jacket White",
  "The North Face 700 Down Gilet Black", "The North Face Denali Fleece Jacket",
  // Carhartt WIP
  "Carhartt WIP Michigan Coat Black", "Carhartt WIP Michigan Coat Brown",
  "Carhartt WIP OG Santa Fe Jacket", "Carhartt WIP Hooded Chase Sweat",
  // Stone Island
  "Stone Island Patch Crewneck Navy", "Stone Island Patch Crewneck Black",
  "Stone Island Ghost Piece Hoodie", "Stone Island Membrana Jacket",
  // CP Company
  "CP Company Goggle Jacket Black", "CP Company Metropolis Fleece Jacket",
  // Ralph Lauren
  "Ralph Lauren Polo Shirt White", "Ralph Lauren Polo Shirt Black", "Ralph Lauren Polo Shirt Navy",
  // Fred Perry
  "Fred Perry M12 Polo Shirt White", "Fred Perry M12 Polo Shirt Black",
  // Lacoste
  "Lacoste L1212 Polo Shirt White", "Lacoste L1212 Polo Shirt Navy",
  // Levi's
  "Levi's 501 Original Jeans", "Levi's 511 Slim Jeans", "Levi's 550 Relaxed Jeans",
  // Other clothing
  "Represent Owners Club Hoodie", "Represent Owners Club T-Shirt",
  "Essentials Fear of God Hoodie", "Essentials Fear of God Joggers",
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is GTBP free to use?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, completely free. We don't charge you anything — just search and buy directly from the retailer." } },
    { "@type": "Question", "name": "How do you find the prices?", "acceptedAnswer": { "@type": "Answer", "text": "We use AI to search across 30+ UK and international retailers in real-time, extracting actual product page prices — not estimates." } },
    { "@type": "Question", "name": "Are shipping costs included?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. We show shipping and import duties for non-UK retailers so the Total You Pay is the real landed cost — not just the item price." } },
    { "@type": "Question", "name": "Do you cover resale platforms like StockX and GOAT?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. We include StockX, GOAT, Klekt, Laced, and Stadium Goods alongside retail prices so you can compare everything in one place. Resale shipping and applicable duties are included in the total." } },
    { "@type": "Question", "name": "How accurate are the prices?", "acceptedAnswer": { "@type": "Answer", "text": "Prices are sourced directly from retailer product pages in real-time. Most results show high confidence — where we're less certain, we show a 'low confidence' indicator so you always know what to trust." } },
    { "@type": "Question", "name": "Which retailers do you search?", "acceptedAnswer": { "@type": "Answer", "text": "We cover Nike, JD Sports, Size?, Foot Locker, Schuh, END., Offspring, Footasylum, ASOS, Zalando, Selfridges, MR PORTER, StockX, GOAT, Klekt, Laced, The Sole Supplier, KershKicks, and 15+ more." } },
    { "@type": "Question", "name": "Do you sell products?", "acceptedAnswer": { "@type": "Answer", "text": "No. GTBP is a price comparison tool. When you click Buy Now, you go directly to the retailer's website." } },
    { "@type": "Question", "name": "Can I search for clothing as well as sneakers?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — we cover sneakers, trainers, clothing and accessories. Works for Stone Island, Carhartt WIP, North Face, Ralph Lauren, Nike Tech Fleece, and more." } },
  ],
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const prefill = (location.state as any)?.prefill as string | undefined;
    if (prefill) setQuery(prefill);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "gtbp-faq-ld";
    script.text = JSON.stringify(FAQ_SCHEMA);
    if (!document.getElementById("gtbp-faq-ld")) document.head.appendChild(script);
    return () => { document.getElementById("gtbp-faq-ld")?.remove(); };
  }, []);
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

  // Recent searches from localStorage
  const getRecentSearches = (): string[] => {
    try { return JSON.parse(localStorage.getItem("gtbp_recent_searches") || "[]"); } catch { return []; }
  };
  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    try {
      const existing = getRecentSearches().filter(s => s !== q);
      localStorage.setItem("gtbp_recent_searches", JSON.stringify([q, ...existing].slice(0, 5)));
    } catch { /* quota */ }
  };
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  // Rotate placeholder every 3s with a fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  // Predictive suggestions from local catalogue + trending items — no API call needed
  useEffect(() => {
    if (isSearching) { setSuggestions([]); setShowSuggestions(false); return; }
    if (query.length < 2) {
      // Show recent searches when input is focused but empty
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = query.toLowerCase();
    const trendingNames = trendingItems.map(i => i.name);
    const allProducts = Array.from(new Set([...trendingNames, ...LOCAL_PRODUCT_CATALOGUE]));
    const matched = allProducts
      .filter(name => name.toLowerCase().includes(q))
      .slice(0, 8);
    setSuggestions(matched);
    setShowSuggestions(matched.length > 0);
  }, [query, isSearching, trendingItems]);

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

  const searchInFlightRef = useRef(false);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() && !imageBase64) return;
    if (searchInFlightRef.current) return; // Prevent duplicate calls

    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    searchInFlightRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    try {
      analytics.search(q || "image-search");
      if (q) { saveRecentSearch(q); setRecentSearches(getRecentSearches()); }
      const product = await searchProduct(q || "Identify this product", imageBase64 || undefined);

      // If image search, show confirmation step instead of navigating immediately
      if (imageBase64 && !pendingProduct) {
        setPendingProduct(product);
        setEditedName(product.product_name);
        setIsSearching(false);
        return;
      }

      navigate(`/product/${toProductSlug(product.product_name || q)}`, {
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
      searchInFlightRef.current = false;
    }
  };

  const handleConfirmProduct = () => {
    if (!pendingProduct) return;
    const finalProduct = { ...pendingProduct, product_name: editedName || pendingProduct.product_name };
    navigate(`/product/${toProductSlug(finalProduct.product_name)}`, {
      state: { product: finalProduct, sizing: { gender, sizeType, sizeRegion, size } },
    });
  };

  const handleRejectAndRetry = async () => {
    const nameToSearch = editedName?.trim();
    setPendingProduct(null);
    setEditingName(false);
    clearImage();
    // If user edited the name, search with it; otherwise just return to search box
    if (nameToSearch && nameToSearch !== pendingProduct?.product_name) {
      setQuery(nameToSearch);
      setIsSearching(true);
      try {
        analytics.search(nameToSearch);
        const product = await searchProduct(nameToSearch);
        navigate(`/product/${toProductSlug(product.product_name)}`, {
          state: { product, sizing: { gender, sizeType, sizeRegion, size } },
        });
      } catch (e: any) {
        toast({ title: "Search failed", description: e.message, variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
    } else {
      setQuery("");
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-57px)] flex-col">
        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 [background-image:radial-gradient(ellipse_70%_60%_at_15%_25%,_rgba(0,0,0,0.045)_0%,_transparent_70%),radial-gradient(ellipse_55%_65%_at_85%_75%,_rgba(0,0,0,0.03)_0%,_transparent_70%),radial-gradient(ellipse_90%_40%_at_50%_90%,_rgba(0,0,0,0.025)_0%,_transparent_70%)]">
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
              className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
            >
              Get The Best Price
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mb-6 mt-3 text-sm text-muted-foreground"
            >
              Search any sneaker or clothing item — we instantly compare prices across UK retailers so you never overpay.
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
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                      else if (query.length < 2 && recentSearches.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                    placeholder={`e.g. ${PLACEHOLDER_EXAMPLES[placeholderIndex]}`}
                    className={`h-12 rounded-md border-border bg-card pl-4 pr-12 text-sm shadow-xs transition-all duration-300 focus-visible:shadow-md sm:h-13 sm:text-base ${placeholderVisible ? "placeholder:opacity-100" : "placeholder:opacity-0"}`}
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
                    {showSuggestions && (suggestions.length > 0 || (query.length < 2 && recentSearches.length > 0)) && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-card shadow-lg"
                      >
                        {query.length < 2 && recentSearches.length > 0 && (
                          <>
                            <div className="px-4 pt-2 pb-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent searches</span>
                            </div>
                            {recentSearches.map((s, i) => (
                              <button
                                key={`recent-${i}`}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                                onMouseDown={() => { setQuery(s); setShowSuggestions(false); handleSearch(s); }}
                              >
                                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                {s}
                              </button>
                            ))}
                          </>
                        )}
                        {suggestions.length > 0 && (
                          <>
                            {query.length < 2 && recentSearches.length > 0 && (
                              <div className="mx-4 my-1 border-t" />
                            )}
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                                onMouseDown={() => { setQuery(s); setShowSuggestions(false); handleSearch(s); }}
                              >
                                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                {s}
                              </button>
                            ))}
                          </>
                        )}
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
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                💡 Include the <span className="font-semibold">colorway</span> for precise results — e.g. <em>Adidas Samba White Black</em>
              </p>

              {/* Size selectors - secondary row on mobile */}
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:mt-0 sm:hidden">
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
              <div className="hidden sm:mt-3 sm:flex sm:justify-center sm:gap-2">
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

            {/* Trending products */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="space-y-3"
            >
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                🔥 Trending Now
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {(trendingItems.length > 0
                  ? trendingItems
                  : fallbackTrending.map((name) => ({ name, category: "shoes" as const, emoji: "👟" }))
                ).slice(0, 8).map((item, i) => (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                    disabled={isSearching}
                    onClick={() => {
                      setQuery(item.name);
                      handleSearch(item.name);
                    }}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-all hover:border-primary hover:shadow-md disabled:opacity-50 sm:text-sm"
                  >
                    {item.emoji} {item.name}
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

        {/* Member benefits */}
        <section className="border-t px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-center text-2xl font-bold text-foreground">Free Account — More Power</h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">Sign up free in seconds. No card required.</p>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { icon: Bell, title: "Price Drop Alerts", desc: "Save any product to your Watchlist and get notified the moment the price drops. Never miss a deal." },
                { icon: Heart, title: "Personal Watchlist", desc: "Track your favourite sneakers and clothing in one place. Drag to reorder, check prices any time." },
                { icon: Clock, title: "Search History", desc: "Your recent searches are saved so you can revisit any product comparison without searching again." },
                { icon: Tag, title: "Exclusive Deals", desc: "Members get early access to coupon codes and retailer promotions we find during our price checks." },
              ].map((benefit) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-4 rounded-xl border bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-foreground">{benefit.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/watchlist"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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
                  a: "Yes. We show shipping and import duties for non-UK retailers so the 'Total You Pay' is the real landed cost — not just the item price.",
                },
                {
                  q: "Do you cover resale platforms like StockX and GOAT?",
                  a: "Yes. We include StockX, GOAT, Klekt, Laced, and Stadium Goods alongside retail prices so you can compare everything in one place. Resale shipping and applicable duties are included in the total.",
                },
                {
                  q: "How accurate are the prices?",
                  a: "Prices are sourced directly from retailer product pages in real-time. Most results show high confidence — where we're less certain, we show a 'low confidence' indicator so you always know what to trust.",
                },
                {
                  q: "Which retailers do you search?",
                  a: "We cover Nike, JD Sports, Size?, Foot Locker, Schuh, END., Offspring, Footasylum, ASOS, Zalando, Selfridges, MR PORTER, StockX, GOAT, Klekt, Laced, The Sole Supplier, KershKicks, and 15+ more.",
                },
                {
                  q: "Do you sell products?",
                  a: "No. GTBP is a price comparison tool. When you click 'Buy Now', you go directly to the retailer's website.",
                },
                {
                  q: "Can I search for clothing as well as sneakers?",
                  a: "Yes — we cover sneakers, trainers, clothing and accessories. Search by brand, product name, or colourway. Works for Stone Island, Carhartt WIP, North Face, Ralph Lauren, Nike Tech Fleece, and more.",
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

      </div>
    </PageTransition>
  );
};

export default Index;