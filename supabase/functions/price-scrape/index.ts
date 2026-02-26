import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Constants ───────────────────────────────────────────────
const EXCLUDED_DOMAINS = [
  "pricespy", "pricerunner", "idealo", "shopzilla", "bizrate",
  "google.com/shopping", "shopping.google", "kelkoo", "nextag",
  "pricegrabber", "shopbot", "skinflint", "camelcamelcamel",
  "keepa.com", "prisjakt", "pricehunter",
  "lyst.co.uk", "lyst.com", "shopstyle.co.uk", "shopstyle.com",
  "pricecheck", "price-compare", "comparethemarket",
];

const UK_COM_RETAILERS = new Set([
  "asos.com", "flannels.com", "footasylum.com", "endclothing.com",
  "selfridges.com", "harveynichols.com", "mrporter.com", "matchesfashion.com",
  "farfetch.com", "sportsdirect.com", "jdsports.com", "very.co.uk",
]);

const NON_PRODUCT_PATH_PATTERNS = [
  /\/collection\//i, /\/collections\//i, /\/category\//i, /\/categories\//i,
  /\/brand\//i, /\/brands\//i, /\/release-dates?\//i, /\/search[?/]/i,
  /\/shop\/[^/]*$/i, /\/cat\//i, /\/cat\?/i, /\/silhouette\//i, /\/refine\//i,
  /^\/b\/bn_/i, /^\/b\/[^/]+$/i,
  /\/w\?q=/i, /\/w\/[^/]*\?/i, /\/search\?/i, /\/s\?k=/i, /\/s\/ref=/i,
  /\/browse\//i, /\/listing/i, /\/results\?/i, /\/shop\?/i,
  /\/plp\//i, /\/c\//i,
  /\/campaign\//i, /\/best-sellers/i, /\/new-arrivals/i, /\/sale\//i,
  /\/colour\//i, /\/color\//i, /\/gender\//i,
  /\/p\/trainers/i, /\/p\/shoes/i, /\/p\/clothing/i,
];

const PRODUCT_STOPWORDS = new Set([
  "shoes", "shoe", "trainers", "trainer", "sneakers", "sneaker",
  "mens", "men", "womens", "women", "unisex", "kids", "junior",
  "adult", "size", "uk", "us", "eu", "new", "with", "and", "for", "the", "og",
]);

const COLOR_TOKENS = new Set([
  "black", "white", "red", "blue", "green", "yellow", "orange", "purple", "pink",
  "brown", "grey", "gray", "beige", "cream", "navy", "khaki", "tan", "silver", "gold",
]);

const COLOR_QUALIFIERS = new Set(["core", "cloud", "dark", "light", "bright", "pale", "deep"]);

const MIN_REALISTIC_PRICE = 20;
const MIN_CACHE_RESULTS = 6;

// Known Trustpilot ratings for popular retailers
const TRUST_RATINGS: Record<string, number> = {
  "nike.com": 1.6, "adidas.co.uk": 1.5, "adidas.com": 1.5,
  "jdsports.co.uk": 1.9, "footlocker.co.uk": 1.7, "asos.com": 4.0,
  "endclothing.com": 4.1, "size.co.uk": 1.7, "offspring.co.uk": 1.8,
  "schuh.co.uk": 4.4, "amazon.co.uk": 4.0, "ebay.co.uk": 3.5,
  "flannels.com": 4.2, "selfridges.com": 2.3, "footasylum.com": 4.0,
  "sportsdirect.com": 4.0, "stockx.com": 4.4, "goat.com": 3.0,
  "office.co.uk": 4.1, "solebox.com": 2.5, "sneakersnstuff.com": 3.8,
};

// ─── Helpers ─────────────────────────────────────────────────
function isComparisonSite(url: string): boolean {
  const lower = url.toLowerCase();
  return EXCLUDED_DOMAINS.some((d) => lower.includes(d));
}

function isLikelyProductPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const { pathname, search } = parsed;
    if (NON_PRODUCT_PATH_PATTERNS.some((p) => p.test(pathname))) return false;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 1) return false;
    // Reject search result pages (e.g. ?q=xxx, ?search=xxx)
    if (/[?&](q|query|search|s)=/i.test(search)) return false;
    // Accept pages with at least 2 segments, or 1 segment with product-like identifiers
    const lastSegment = segments[segments.length - 1];
    if (segments.length === 1) {
      // Single segment must look like a product slug (has numbers or is long)
      const hasProductIdentifier = /\d/.test(lastSegment) || lastSegment.length > 20;
      if (!hasProductIdentifier) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeRetailerDomain(input: string): string | null {
  const cleaned = (input || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/^www\./, "")
    .split("/")[0].replace(/\s+/g, "");
  if (!cleaned || !cleaned.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(cleaned)) return null;
  return cleaned;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
  } catch {
    return "";
  }
}

function retailerNameFromDomain(domain: string): string {
  // Strip mobile subdomain prefix before extracting name
  const cleanDomain = domain.replace(/^m\./, "");
  const root = cleanDomain.split(".")[0].replace(/[-_]+/g, " ");
  return root.split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || "Unknown Retailer";
}

function isUkDomain(domain: string): boolean {
  return domain.endsWith(".uk") || domain.includes(".co.uk") || UK_COM_RETAILERS.has(domain);
}

function extractAllGbpPrices(text: string): number[] {
  const normalized = (text || "").replace(/,/g, "");
  const values: number[] = [];
  for (const match of normalized.matchAll(/£\s?(\d{1,4}(?:\.\d{1,2})?)/gi)) {
    const v = Number(match[1]);
    if (!Number.isNaN(v) && v >= 5 && v <= 5000) values.push(v);
  }
  for (const match of normalized.matchAll(/(\d{1,4}(?:\.\d{1,2})?)\s?(?:GBP)/gi)) {
    const v = Number(match[1]);
    if (!Number.isNaN(v) && v >= 5 && v <= 5000) values.push(v);
  }
  return Array.from(new Set(values.map((v) => Number(v.toFixed(2)))));
}

function tokenizeProductName(productName: string): string[] {
  return (productName || "").toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ").replace(/[/-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !PRODUCT_STOPWORDS.has(t));
}

function matchesProduct(productName: string, url: string, text: string, title?: string): boolean {
  const fullHaystack = `${url}\n${title || ""}\n${text}`.toLowerCase();
  const tokens = tokenizeProductName(productName);
  if (!tokens.length) return true;

  const mainTokens = tokens.filter((t) => !COLOR_QUALIFIERS.has(t));
  const nonColorTokens = mainTokens.filter((t) => !COLOR_TOKENS.has(t));
  const matchedNonColor = nonColorTokens.filter((t) => fullHaystack.includes(t));

  // Need brand + model at minimum (relaxed: 40% of non-color tokens)
  const required = nonColorTokens.length <= 3
    ? Math.max(1, nonColorTokens.length - 1)
    : Math.max(2, Math.ceil(nonColorTokens.length * 0.4));
  if (matchedNonColor.length < required) return false;

  // Color check: require MAJORITY of colors (not all) — check URL + title + first 500 chars
  const colors = mainTokens.filter((t) => COLOR_TOKENS.has(t));
  if (colors.length > 0) {
    const colorHaystack = `${url}\n${title || ""}\n${text.slice(0, 500)}`.toLowerCase();
    const matchedColors = colors.filter((c) => colorHaystack.includes(c));
    // Require at least half the colors to match (was: all)
    if (matchedColors.length < Math.ceil(colors.length / 2)) return false;
  }

  return true;
}

function isOutOfStock(text: string): boolean {
  return /\b(sold out|out of stock|currently unavailable|notify me when available)\b/i.test(text || "");
}

function getTrustRating(domain: string): number {
  return TRUST_RATINGS[domain] || 4.0;
}

// ─── Price extraction from a single Firecrawl search result ──
function extractResultFromSource(
  source: { url: string; markdown?: string; description?: string; title?: string },
  productName: string,
  priceFloor: number
): any | null {
  const url = source.url;
  if (!url || isComparisonSite(url) || !isLikelyProductPage(url)) return null;

  const domain = extractDomain(url);
  if (!domain) return null;

  const content = `${source.title || ""}\n${source.markdown || ""}\n${source.description || ""}`;

  // Check product match
  if (!matchesProduct(productName, url, content)) return null;

  // Check not sold out
  if (isOutOfStock(content)) return null;

  // Extract prices from the ACTUAL scraped content
  const prices = extractAllGbpPrices(content).filter((p) => p >= priceFloor);
  if (!prices.length) return null;

  // Pick the most likely current/sale price (lowest reasonable price above floor)
  const sortedPrices = prices.sort((a, b) => a - b);
  const itemPrice = sortedPrices[0];

  // Check if there's an original/RRP price (must be plausible — within 3x of item price)
  const candidateOriginal = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1] : null;
  const originalPrice = candidateOriginal && candidateOriginal > itemPrice * 1.1 && candidateOriginal < itemPrice * 3
    ? candidateOriginal
    : null;

  const uk = isUkDomain(domain);
  const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
  const duties = uk ? 0 : Number((itemPrice * 0.2).toFixed(2));
  const totalYouPay = Number((itemPrice + shipping + duties).toFixed(2));

  return {
    retailer: retailerNameFromDomain(domain),
    country: uk ? "UK" : "International",
    flag: uk ? "🇬🇧" : "🌍",
    itemPrice,
    shipping,
    duties,
    totalYouPay,
    originalPrice,
    delivery: uk ? "2-5 days" : "7-14 days",
    trustRating: getTrustRating(domain),
    currency: "GBP",
    url,  // ALWAYS the real URL from Firecrawl, never AI-generated
  };
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, retailers, skip_cache, estimated_retail_price } = await req.json();

    if (!product_name || !Array.isArray(retailers) || !retailers.length) {
      return new Response(JSON.stringify({ error: "product_name and retailers are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedRetailers = Array.from(
      new Set((retailers as string[]).map(normalizeRetailerDomain).filter(Boolean) as string[])
    );

    if (!normalizedRetailers.length) {
      return new Response(JSON.stringify({ error: "No valid retailer domains provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip sizing info for search queries
    const searchName = product_name
      .replace(/\b(men'?s?|women'?s?|unisex)\b/gi, "")
      .replace(/\b(UK|US|EU)\s*\d+\.?\d*/gi, "")
      .replace(/\bsize\s*\d+\.?\d*/gi, "")
      .replace(/\s{2,}/g, " ").trim();

    // ── Cache check ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);
    const cacheKey = searchName.toLowerCase().trim();

    let cachedResults: any[] = [];
    let cachedCreatedAt: string | undefined;

    if (!skip_cache) {
      const { data: cached } = await sb
        .from("price_cache")
        .select("results, created_at")
        .eq("product_key", cacheKey)
        .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      cachedResults = Array.isArray(cached?.results) ? cached.results : [];
      cachedCreatedAt = cached?.created_at;

      if (cachedResults.length >= MIN_CACHE_RESULTS) {
        console.log(`Cache hit for: ${cacheKey} (${cachedResults.length} results)`);
        return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, cached_at: cachedCreatedAt }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Firecrawl search ──
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const doSearch = async (query: string, limit: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ query, limit, lang: "en", country: "gb", scrapeOptions: { formats: ["markdown"] } }),
        });
        return await response.json();
      } catch { return { data: [] }; }
      finally { clearTimeout(timeout); }
    };

    console.log(`Searching for: "${searchName}" across ${normalizedRetailers.length} retailers`);

    // ── Build search queries ──
    const seenUrls = new Set<string>();
    const allSources: any[] = [];

    // Batch retailer-specific searches
    const BATCH_SIZE = 8;
    const retailerBatches: string[][] = [];
    for (let i = 0; i < normalizedRetailers.length; i += BATCH_SIZE) {
      retailerBatches.push(normalizedRetailers.slice(i, i + BATCH_SIZE));
    }

    const batchPromises = retailerBatches.map((batch) => {
      const siteQuery = batch.map((r) => `site:${r}`).join(" OR ");
      return doSearch(`${searchName} buy price £ ${siteQuery}`, Math.min(batch.length * 3, 24));
    });

    // Broad searches for coverage
    const searchNameShort = searchName.split(/[-–\/]/).map(s => s.trim()).filter(Boolean)[0] || searchName;
    const broadSearches = [
      doSearch(`${searchName} buy UK price GBP £`, 20),
      doSearch(`"${searchName}" shop price £`, 15),
      doSearch(`${searchName} price £`, 15),
      doSearch(`"${searchNameShort}" buy £ site:.co.uk`, 20),
      doSearch(`${searchName} price £ site:.co.uk OR site:.uk`, 20),
      doSearch(`${searchName} buy online UK`, 15),
    ];

    const allSearchResults = await Promise.all([...batchPromises, ...broadSearches]);

    for (const result of allSearchResults) {
      for (const item of (result.data || [])) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allSources.push(item);
        }
      }
    }

    console.log(`Firecrawl returned ${allSources.length} unique URLs`);

    // ── Gap-fill missing UK retailers ──
    const coveredDomains = new Set(allSources.map((s) => extractDomain(s.url)).filter(Boolean));
    const missingUk = normalizedRetailers.filter(
      (r) => (r.endsWith(".uk") || r.includes(".co.uk")) && !coveredDomains.has(r)
    );

    if (missingUk.length > 0) {
      console.log(`Gap-filling ${missingUk.length} missing UK retailers`);
      const GAP_BATCH = 4;
      const gapBatches: string[][] = [];
      for (let i = 0; i < missingUk.length; i += GAP_BATCH) {
        gapBatches.push(missingUk.slice(i, i + GAP_BATCH));
      }
      const gapResults = await Promise.all(gapBatches.map((batch) => {
        const siteQuery = batch.map((r) => `site:${r}`).join(" OR ");
        return doSearch(`${searchName} ${siteQuery}`, batch.length * 3);
      }));
      for (const result of gapResults) {
        for (const item of (result.data || [])) {
          if (item.url && !seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allSources.push(item);
          }
        }
      }
    }

    // ── Extract prices deterministically ──
    const priceFloor = estimated_retail_price
      ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.2))
      : MIN_REALISTIC_PRICE;

    console.log(`Price floor: £${priceFloor} (RRP: ${estimated_retail_price || "unknown"})`);

    const extracted: any[] = [];
    for (const source of allSources) {
      const result = extractResultFromSource(source, searchName, priceFloor);
      if (result) extracted.push(result);
    }

    console.log(`Extracted ${extracted.length} valid results from ${allSources.length} sources`);

    // ── Deduplicate by domain (keep cheapest) ──
    const byDomain = new Map<string, any>();
    for (const entry of extracted) {
      const domain = extractDomain(entry.url);
      if (!domain) continue;
      const existing = byDomain.get(domain);
      if (!existing || entry.totalYouPay < existing.totalYouPay) {
        byDomain.set(domain, entry);
      }
    }

    const finalResults = Array.from(byDomain.values())
      .sort((a, b) => a.totalYouPay - b.totalYouPay)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    console.log(`Final: ${finalResults.length} unique retailers`);

    // Return better stale cache if fresh results are poor
    if (finalResults.length < MIN_CACHE_RESULTS && cachedResults.length > finalResults.length) {
      console.log(`Returning stale cache (${cachedResults.length} > ${finalResults.length})`);
      return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, stale: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Cache results ──
    if (finalResults.length > 0) {
      sb.from("price_cache")
        .upsert(
          { product_key: cacheKey, results: finalResults, product_info: { product_name, retailers: normalizedRetailers } },
          { onConflict: "product_key" }
        )
        .then(({ error }) => { if (error) console.error("Cache write error:", error); });
    }

    return new Response(JSON.stringify({ success: true, results: finalResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("price-scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
