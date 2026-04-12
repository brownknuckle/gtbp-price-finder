// GTBP Cache Warmer — pre-searches popular products so users get instant results.
// Runs on a schedule. Calls price-scrape for each product with skip_cache: false,
// which populates price_cache. Next user to search gets results in <1s.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Top products to keep warm — limited to 10 per run to stay within Supabase's 150s function timeout.
// The cron runs every 4 hours; products already cached return in <1s so subsequent runs finish fast.
const WARM_PRODUCTS = [
  { product_name: "Nike Air Force 1 Low Triple White", estimated_retail_price: 109.95, retailers: ["nike.com","jdsports.co.uk","footlocker.co.uk","size.co.uk","schuh.co.uk","offspring.co.uk","asos.com","stockx.com","goat.com"] },
  { product_name: "Adidas Samba OG White Black Gum", estimated_retail_price: 100, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"] },
  { product_name: "Nike Dunk Low Retro White Black Panda", estimated_retail_price: 109.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","stockx.com","goat.com","klekt.com"] },
  { product_name: "Air Jordan 1 Retro High OG", estimated_retail_price: 169.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"] },
  { product_name: "New Balance 550 White Green", estimated_retail_price: 110, retailers: ["newbalance.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"] },
  { product_name: "Adidas Gazelle Indoor Green Gum", estimated_retail_price: 100, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"] },
  { product_name: "Adidas Campus 00s Cloud White", estimated_retail_price: 95, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","asos.com","stockx.com"] },
  { product_name: "ASICS Gel-1130 White Silver", estimated_retail_price: 110, retailers: ["asics.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","stockx.com"] },
  { product_name: "Nike Tech Fleece Joggers Black", estimated_retail_price: 89.99, retailers: ["nike.com","jdsports.co.uk","footlocker.co.uk","footasylum.com","asos.com","next.co.uk"] },
  { product_name: "Adidas Handball Spezial Blue Gum", estimated_retail_price: 100, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com"] },
];

async function scrapeProduct(product: typeof WARM_PRODUCTS[0]): Promise<{ name: string; ok: boolean; cached?: boolean; results?: number }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/price-scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        product_name: product.product_name,
        estimated_retail_price: product.estimated_retail_price,
        retailers: product.retailers,
        skip_cache: false, // allow cache hits — only re-scrape if stale
      }),
      signal: AbortSignal.timeout(50_000),
    });
    if (!res.ok) return { name: product.product_name, ok: false };
    const data = await res.json();
    return { name: product.product_name, ok: true, cached: !!data.cached, results: data.results?.length ?? 0 };
  } catch (e: any) {
    return { name: product.product_name, ok: false };
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("force") === "true";

  console.log(`Cache warmer starting — ${WARM_PRODUCTS.length} products${forceRefresh ? " (force refresh)" : ""}`);

  // Process in batches of 3 to avoid overloading price-scrape
  const BATCH_SIZE = 3;
  const results: Array<{ name: string; ok: boolean; cached?: boolean; results?: number }> = [];

  for (let i = 0; i < WARM_PRODUCTS.length; i += BATCH_SIZE) {
    const batch = WARM_PRODUCTS.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(p => scrapeProduct(p)));
    results.push(...batchResults);

    const done = Math.min(i + BATCH_SIZE, WARM_PRODUCTS.length);
    console.log(`Warmed ${done}/${WARM_PRODUCTS.length}: ${batchResults.map(r => `${r.name.split(" ").slice(0,3).join(" ")} → ${r.ok ? (r.cached ? "cached" : `${r.results} results`) : "FAILED"}`).join(", ")}`);
  }

  const succeeded = results.filter(r => r.ok).length;
  const alreadyCached = results.filter(r => r.cached).length;
  const freshScraped = results.filter(r => r.ok && !r.cached).length;

  console.log(`Cache warmer done: ${succeeded}/${WARM_PRODUCTS.length} OK, ${alreadyCached} already cached, ${freshScraped} freshly scraped`);

  return new Response(
    JSON.stringify({ ok: true, total: WARM_PRODUCTS.length, succeeded, alreadyCached, freshScraped, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
