import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { BEST_PRICE_PRODUCTS } from "@/lib/bestPriceProducts";

const BestPriceIndex = () => {
  useEffect(() => {
    document.title = "Best Prices on Trainers & Clothing UK — Compare All Retailers | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "Find the best price on Nike, Adidas, New Balance, ASICS and more across every major UK retailer. Price comparison updated regularly — includes delivery costs.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const shoes = BEST_PRICE_PRODUCTS.filter(p => p.category === "shoes");
  const clothing = BEST_PRICE_PRODUCTS.filter(p => p.category === "clothing");

  const brandGroups = ["Nike", "Jordan", "Adidas", "New Balance", "ASICS", "The North Face"];

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Price Comparison</p>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">Best Prices in the UK</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Price comparisons across Nike, Adidas, New Balance, ASICS and more — covering every major UK retailer.
            Each page shows the current cheapest price, full retailer breakdown, and includes delivery costs so the total is what you actually pay.
          </p>
        </motion.div>

        {/* Trainers */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-foreground">Trainers & Sneakers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {shoes.map((p, i) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <Link
                  to={`/best-price/${p.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-sm"
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.brand}</p>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">RRP £{p.rrp}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    Compare <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Clothing */}
        {clothing.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-foreground">Clothing</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {clothing.map((p, i) => (
                <motion.div
                  key={p.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                >
                  <Link
                    to={`/best-price/${p.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-sm"
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.brand}</p>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">RRP £{p.rrp}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                      Compare <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Browse by brand */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">Browse by Brand</h2>
          <div className="flex flex-wrap gap-2">
            {brandGroups.map(brand => {
              const count = BEST_PRICE_PRODUCTS.filter(p => p.brand === brand).length;
              if (!count) return null;
              const first = BEST_PRICE_PRODUCTS.find(p => p.brand === brand)!;
              return (
                <Link
                  key={brand}
                  to={`/best-price/${first.slug}`}
                  className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5"
                >
                  {brand} ({count})
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="mb-2 font-bold text-foreground">Can't find what you're looking for?</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Search any trainer, clothing item, or accessory — we compare 30+ UK retailers in real time.
          </p>
          <Link to="/" className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            Search any product <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default BestPriceIndex;
