import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Calendar, ArrowRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageTransition from "@/components/PageTransition";
import { fetchReleases, type ReleaseItem } from "@/lib/api";
import { toProductSlug } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  shoes: "Shoes",
  clothing: "Clothing",
  accessories: "Accessories",
};

const formatDate = (dateStr: string | null): { label: string; urgency: "today" | "soon" | "upcoming" | "tbc" } => {
  if (!dateStr) return { label: "TBC", urgency: "tbc" };
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (diffDays === 0) return { label: "Today", urgency: "today" };
  if (diffDays <= 7) return { label, urgency: "soon" };
  return { label, urgency: "upcoming" };
};

const Releases = () => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "shoes" | "clothing" | "accessories">("all");
  const [brandFilter, setBrandFilter] = useState("all");

  useEffect(() => {
    document.title = "Upcoming Sneaker & Clothing Releases UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (metaDesc) metaDesc.content = "Stay ahead of every UK sneaker and clothing drop. Track upcoming releases from Nike, Jordan, Adidas, New Balance and more — then compare prices instantly on GTBP.";
    return () => {
      document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly";
      if (metaDesc) metaDesc.content = "Find the cheapest price for sneakers, clothing and accessories across UK retailers.";
    };
  }, []);

  useEffect(() => {
    fetchReleases()
      .then(setReleases)
      .catch(() => setReleases([]))
      .finally(() => setIsLoading(false));
  }, []);

  const brands = ["all", ...Array.from(new Set(releases.map((r) => r.brand))).sort()];

  const filtered = releases.filter((r) => {
    if (filter !== "all" && r.category !== filter) return false;
    if (brandFilter !== "all" && r.brand !== brandFilter) return false;
    return true;
  });

  // Sort: known dates first (ascending), TBC at end
  const sorted = [...filtered].sort((a, b) => {
    if (!a.releaseDate && !b.releaseDate) return 0;
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Drop Calendar
          </p>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Upcoming Releases</h1>
          <p className="text-sm text-muted-foreground">
            Every confirmed UK sneaker and clothing drop. Click any release to compare prices across 30+ retailers instantly.
          </p>
        </motion.div>

        {/* Filters */}
        {!isLoading && releases.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            {/* Category pills */}
            <div className="flex gap-1 rounded-full border border-border bg-card p-0.5">
              {(["all", "shoes", "clothing", "accessories"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === cat ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Brand filter */}
            {brands.length > 2 && (
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
                  ))}
                </select>
              </div>
            )}

            {filtered.length !== releases.length && (
              <span className="self-center text-[10px] text-muted-foreground">
                {filtered.length} of {releases.length} releases
              </span>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching upcoming drops…</p>
          </div>
        )}

        {/* Release cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sorted.map((release, i) => {
              const { label: dateLabel, urgency } = formatDate(release.releaseDate);
              return (
                <motion.div
                  key={`${release.name}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
                  onClick={() => navigate(`/product/${toProductSlug(release.searchQuery || release.name)}`, {
                    state: { sizing: { gender: "men", sizeType: "shoes", sizeRegion: "UK", size: "9" } }
                  })}
                >
                  {/* Image area */}
                  <div className="flex h-44 items-center justify-center bg-secondary sm:h-52">
                    {release.image_url ? (
                      <img
                        src={release.image_url}
                        alt={release.name}
                        className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = "none";
                          el.parentElement!.innerHTML = `<span class="text-5xl select-none">${release.emoji}</span>`;
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-5xl select-none">{release.emoji}</span>
                    )}
                  </div>

                  {/* Info area */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground leading-tight">{release.name}</span>
                        {urgency === "today" && (
                          <Badge className="bg-green-500 text-[10px] text-white">Out Today</Badge>
                        )}
                        {urgency === "soon" && (
                          <Badge variant="secondary" className="text-[10px]">This Week</Badge>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{release.brand}</span>
                        <span className="capitalize">{release.category}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateLabel}
                        </span>
                        {release.retailPrice > 0 && (
                          <span className="font-medium">RRP £{release.retailPrice}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={urgency === "today" ? "default" : "outline"}
                      className="mt-3 w-full gap-1 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Compare Prices <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {sorted.length === 0 && !isLoading && (
              <div className="py-16 text-center">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm font-semibold text-foreground">No releases match your filters</p>
                <button onClick={() => { setFilter("all"); setBrandFilter("all"); }} className="mt-2 text-xs text-primary underline">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        {!isLoading && sorted.length > 0 && (
          <p className="mt-8 text-center text-[10px] text-muted-foreground/60">
            Release dates are indicative and subject to change. Always verify on the retailer's site.
          </p>
        )}
      </div>
    </PageTransition>
  );
};

export default Releases;
