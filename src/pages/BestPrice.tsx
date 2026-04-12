import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { getProductBySlug, BEST_PRICE_PRODUCTS, type BestPriceProduct } from "@/lib/bestPriceProducts";
import { toProductSlug } from "@/lib/utils";

const GTBP_URL = "https://jbftwbduusnjoufsotpq.supabase.co";
const GTBP_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZnR3YmR1dXNuam91ZnNvdHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTYyMDYsImV4cCI6MjA4Nzc3MjIwNn0.tOZMYXjsYZX24KIMM7IalVk3IOCT7BK_zwshYc7jHrI";

interface CachedResult {
  rank: number;
  retailer: string;
  flag: string;
  totalYouPay: number;
  itemPrice: number;
  shipping: number;
  url: string;
  inStock?: boolean | null;
  freeReturns?: boolean;
  retailerTier?: "authorised" | "trusted" | "unverified";
}

async function fetchFromCache(productName: string): Promise<{ results: CachedResult[]; cached_at: string } | null> {
  const key = productName.toLowerCase().trim();
  const url = `${GTBP_URL}/rest/v1/price_cache?product_key=eq.${encodeURIComponent(key)}&select=results,created_at`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: GTBP_ANON_KEY,
        Authorization: `Bearer ${GTBP_ANON_KEY}`,
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows?.length || !Array.isArray(rows[0]?.results)) return null;
    return { results: rows[0].results as CachedResult[], cached_at: rows[0].created_at };
  } catch {
    return null;
  }
}

function formatAge(isoString: string): string {
  const ageMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(ageMs / 3_600_000);
  if (hours < 1) return "less than 1 hour ago";
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

const BestPrice = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;

  const [results, setResults] = useState<CachedResult[]>([]);
  const [cachedAt, setCachedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!product) { setLoading(false); return; }

    // ── SEO: title + meta ──
    const cheapestStr = results.length > 0 ? ` from £${results[0].totalYouPay.toFixed(0)}` : "";
    document.title = `${product.name} — Best UK Price${cheapestStr} | GTBP`;
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = `Find the cheapest price for ${product.name} in the UK. We compare prices across ${product.retailers.length}+ retailers including JD Sports, ASOS, StockX and more. Updated regularly.`;

    // ── Schema: Product + FAQ ──
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "brand": { "@type": "Brand", "name": product.brand },
      "description": product.description,
      ...(results.length > 0 && {
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "GBP",
          "lowPrice": results[0].totalYouPay.toFixed(2),
          "highPrice": results[results.length - 1].totalYouPay.toFixed(2),
          "offerCount": results.length,
          "availability": "https://schema.org/InStock",
        },
      }),
    };
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": product.faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    };
    const s1 = document.createElement("script");
    s1.type = "application/ld+json";
    s1.id = "bp-product-ld";
    s1.text = JSON.stringify(productSchema);
    const s2 = document.createElement("script");
    s2.type = "application/ld+json";
    s2.id = "bp-faq-ld";
    s2.text = JSON.stringify(faqSchema);
    document.getElementById("bp-product-ld")?.remove();
    document.getElementById("bp-faq-ld")?.remove();
    document.head.appendChild(s1);
    document.head.appendChild(s2);

    return () => {
      document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly";
      document.getElementById("bp-product-ld")?.remove();
      document.getElementById("bp-faq-ld")?.remove();
    };
  }, [product, results]);

  useEffect(() => {
    if (!product) { setLoading(false); return; }
    setLoading(true);
    fetchFromCache(product.name).then(data => {
      if (data) {
        setResults(data.results);
        setCachedAt(data.cached_at);
      }
      setLoading(false);
    });
  }, [product?.name]);

  // 404 for unknown slugs
  if (!loading && !product) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Link to="/best-price" className="mt-4 inline-block text-sm text-primary hover:underline">
            Browse all products →
          </Link>
        </div>
      </PageTransition>
    );
  }

  if (!product) return null;

  const cheapest = results[0];
  const liveResultsUrl = `/product/${toProductSlug(product.name)}`;
  const relatedProducts = BEST_PRICE_PRODUCTS
    .filter(p => p.slug !== product.slug && (p.brand === product.brand || p.category === product.category))
    .slice(0, 4);

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/best-price" className="hover:text-foreground">Best Prices</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{product.brand}</p>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            Best Price for {product.name} in the UK
          </h1>

          {/* Hero price callout */}
          {!loading && cheapest && (
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-5 py-4">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400">Lowest price right now</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  £{cheapest.totalYouPay.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">at {cheapest.retailer} {cheapest.flag}</p>
              </div>
              <div className="ml-auto">
                <a href={cheapest.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1">
                    Buy Now <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
          )}

          <p className="mb-8 text-base leading-relaxed text-muted-foreground">{product.description}</p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Price comparison table */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">UK Price Comparison</h2>
              {cachedAt && (
                <span className="text-xs text-muted-foreground">Updated {formatAge(cachedAt)}</span>
              )}
            </div>

            {loading && (
              <div className="space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-14 rounded-xl border border-border bg-secondary/20 animate-pulse" />
                ))}
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Retailer</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                      <th className="px-4 py-2.5 text-right font-semibold hidden sm:table-cell">Shipping</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((r, i) => (
                      <tr key={i} className={`hover:bg-secondary/30 ${i === 0 ? "bg-green-50/50 dark:bg-green-950/20" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{r.flag}</span>
                            <span className="font-medium text-foreground">{r.retailer}</span>
                            {i === 0 && <span className="rounded-full bg-green-100 dark:bg-green-900 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-300">Best</span>}
                            {r.freeReturns && <span className="hidden sm:inline rounded-full bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-400">Free returns</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">£{r.itemPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                          {r.shipping === 0 ? <span className="text-green-600">Free</span> : `£${r.shipping.toFixed(2)}`}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">£{r.totalYouPay.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium">
                            Buy <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="rounded-xl border border-border bg-secondary/20 px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No cached prices yet for this product.</p>
                <Link to={liveResultsUrl}>
                  <Button variant="outline" size="sm">Search live prices →</Button>
                </Link>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Prices include shipping and applicable import duties. Totals are in GBP.{" "}
              <Link to={liveResultsUrl} className="text-primary hover:underline">
                See live prices →
              </Link>
            </p>
          </section>

          {/* Sizing note */}
          <section>
            <h2 className="mb-2 text-xl font-bold text-foreground">Sizing</h2>
            <p className="text-muted-foreground">{product.sizingNote}</p>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {product.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground mb-1">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">See live prices for {product.name}</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Our full search compares {product.retailers.length}+ retailers in real time, including delivery costs and import duties.
            </p>
            <Link to={liveResultsUrl}>
              <Button className="gap-1">
                Compare Live Prices <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </section>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-foreground">You Might Also Like</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedProducts.map(p => (
                  <Link
                    key={p.slug}
                    to={`/best-price/${p.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-sm"
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.brand}</p>
                      <p className="font-semibold text-foreground text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">RRP £{p.rrp}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default BestPrice;
