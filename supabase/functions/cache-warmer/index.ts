// GTBP Cache Warmer — pre-searches popular products so users get instant results.
// Runs on a schedule. Calls price-scrape for each product with skip_cache: false,
// which populates price_cache. Next user to search gets results in <1s.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Top products to keep warm — ordered by expected search volume
const WARM_PRODUCTS = [
  // ── Iconic sneakers ──────────────────────────────────────────
  { product_name: "Nike Air Force 1 Low Triple White", estimated_retail_price: 109.95, retailers: ["nike.com","jdsports.co.uk","footlocker.co.uk","size.co.uk","footasylum.com","schuh.co.uk","offspring.co.uk","asos.com","end.clothing","stockx.com","goat.com"] },
  { product_name: "Adidas Samba OG White Black Gum", estimated_retail_price: 100, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","offspring.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com","klekt.com","laced.com"] },
  { product_name: "New Balance 550 White Green", estimated_retail_price: 110, retailers: ["newbalance.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com","klekt.com","offspring.co.uk"] },
  { product_name: "Adidas Gazelle Indoor Green Gum", estimated_retail_price: 100, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com","offspring.co.uk"] },
  { product_name: "Nike Air Max 95 Triple Black", estimated_retail_price: 169.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"] },
  { product_name: "Nike Dunk Low Retro White Black Panda", estimated_retail_price: 109.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","offspring.co.uk","stockx.com","goat.com","klekt.com","laced.com"] },
  { product_name: "Air Jordan 1 Retro High OG", estimated_retail_price: 169.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","thesolesupplier.co.uk","endclothing.com","stockx.com","goat.com","klekt.com","kershkicks.com"] },
  { product_name: "New Balance 990v6 Grey", estimated_retail_price: 230, retailers: ["newbalance.co.uk","size.co.uk","endclothing.com","offspring.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"] },
  { product_name: "Adidas Campus 00s Cloud White", estimated_retail_price: 95, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","asos.com","offspring.co.uk","stockx.com"] },
  { product_name: "ASICS Gel-1130 White Silver", estimated_retail_price: 110, retailers: ["asics.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","asos.com","footlocker.co.uk","stockx.com"] },
  { product_name: "Salomon XT-6 Black", estimated_retail_price: 180, retailers: ["size.co.uk","endclothing.com","offspring.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"] },
  { product_name: "New Balance 574 Grey", estimated_retail_price: 80, retailers: ["newbalance.co.uk","jdsports.co.uk","schuh.co.uk","zalando.co.uk","asos.com","next.co.uk"] },
  { product_name: "Converse Chuck Taylor All Star White", estimated_retail_price: 90, retailers: ["converse.com","jdsports.co.uk","size.co.uk","schuh.co.uk","asos.com","zalando.co.uk","footlocker.co.uk"] },
  { product_name: "Vans Old Skool Black White", estimated_retail_price: 80, retailers: ["vans.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","asos.com","zalando.co.uk","offspring.co.uk"] },
  { product_name: "Nike Air Max 1 White Grey", estimated_retail_price: 130, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","stockx.com","goat.com"] },
  // ── Popular clothing ─────────────────────────────────────────
  { product_name: "Nike Tech Fleece Joggers Black", estimated_retail_price: 89.99, retailers: ["nike.com","jdsports.co.uk","footlocker.co.uk","footasylum.com","asos.com","size.co.uk","next.co.uk"] },
  { product_name: "North Face Nuptse 700 Jacket Black", estimated_retail_price: 280, retailers: ["thenorthface.com","jdsports.co.uk","asos.com","endclothing.com","selfridges.com","zalando.co.uk","size.co.uk"] },
  { product_name: "Carhartt WIP Michigan Coat Black", estimated_retail_price: 200, retailers: ["carhartt-wip.com","endclothing.com","asos.com","urbanoutfitters.com","selfridges.com","mrporter.com","zalando.co.uk"] },
  { product_name: "Ralph Lauren Polo Shirt White", estimated_retail_price: 90, retailers: ["ralphlauren.co.uk","selfridges.com","asos.com","next.co.uk","zalando.co.uk","flannels.com"] },
  { product_name: "Stone Island Patch Crewneck Navy", estimated_retail_price: 290, retailers: ["stoneisland.com","endclothing.com","selfridges.com","farfetch.com","flannels.com","mrporter.com"] },
  // ── Additional high-traffic ──────────────────────────────────
  { product_name: "Nike Air Max 97 Silver Bullet", estimated_retail_price: 169.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","stockx.com","goat.com","klekt.com"] },
  { product_name: "Air Jordan 4 Retro Black Cat", estimated_retail_price: 189.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","thesolesupplier.co.uk","stockx.com","goat.com","klekt.com","laced.com"] },
  { product_name: "Adidas Handball Spezial Blue Gum", estimated_retail_price: 100, retailers: ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","offspring.co.uk","zalando.co.uk","endclothing.com","stockx.com"] },
  { product_name: "ASICS Gel-Kayano 14 White Silver", estimated_retail_price: 120, retailers: ["asics.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","offspring.co.uk","stockx.com","goat.com"] },
  { product_name: "Nike Killshot 2 White Gum", estimated_retail_price: 79.95, retailers: ["nike.com","jdsports.co.uk","size.co.uk","schuh.co.uk","offspring.co.uk","asos.com"] },
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
