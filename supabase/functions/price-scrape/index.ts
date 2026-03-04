import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ORIGINS = [
  "https://gtbp-best-price-browser.lovable.app",
  "https://id-preview--594d030a-3b52-45a2-9b9a-63596ba3610b.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const DEBUG = Deno.env.get("DEBUG") === "true";
const log = (...args: any[]) => { if (DEBUG) console.log(...args); };

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
  "laced.com", "klekt.com", "thesolesupplier.co.uk",
  "nike.com", "adidas.com", "newbalance.com", "puma.com", "reebok.com",
  "converse.com", "vans.com", "timberland.com", "ugg.com", "crocs.com",
  "stockx.com", "goat.com", "sneakersnstuff.com", "solebox.com",
]);

const NON_PRODUCT_PATH_PATTERNS = [
  /\/collection\//i, /\/collections\//i, /\/category\//i, /\/categories\//i,
  /\/brand\//i, /\/brands\//i, /\/release-dates?\//i, /\/search[?/]/i,
  /\/shop\/[^/]*$/i, /\/cat\//i, /\/cat\?/i, /\/silhouette\//i, /\/refine\//i,
  /^\/b\/bn_/i, /^\/b\/[^/]+$/i,
  /\/w\?q=/i, /\/w\/[^/]*$/i, /\/w\/[^/]*\?/i, /\/search\?/i, /\/s\?k=/i, /\/s\/ref=/i,
  /\/browse\//i, /\/listing/i, /\/results\?/i, /\/shop\?/i,
  /\/plp\//i, /\/c\//i,
  /\/campaign\//i, /\/best-sellers/i, /\/new-arrivals/i, /\/sale\//i,
  /\/colour\//i, /\/color\//i, /\/gender\//i,
  /\/p\/trainers/i, /\/p\/shoes/i, /\/p\/clothing/i,
  /\/shoes\/\?/i, /\/trainers\/\?/i, /\/footwear\/\?/i,
  // Category paths: /footwear/brand-name or /clothing/brand-name with no product ID (no digits or .html)
  /\/footwear\/[a-z-]+$/i, /\/clothing\/[a-z-]+$/i, /\/accessories\/[a-z-]+$/i,
];

const MIN_REALISTIC_PRICE = 20;
const MAX_REALISTIC_PRICE = 2000;
const MIN_CACHE_RESULTS = 4;

const NON_RETAIL_DOMAINS = [
  /\.org\b/, /\.edu\b/, /\.gov\b/, /\.nhs\b/, /charity/, /hospice/, /foundation/,
  /wikipedia/, /reddit\.com/, /youtube\.com/, /facebook\.com/, /instagram\.com/,
  /twitter\.com/, /x\.com/, /tiktok\.com/, /pinterest\.com/,
  /trustpilot/, /glassdoor/, /indeed\.com/, /linkedin\.com/,
];

// Unverified micro-resellers to exclude from results
const BLOCKED_DOMAINS = new Set([
  "findyourkicks.com", "luxurygoodslocker.com", "kicksmachine.com",
  "limitedresell.com", "crepcollectionclub.co.uk", "flipsupply.co.uk",
  "sportshowroom.co.uk", "hypedeconomy.co.uk", "4feetshoes.com",
]);

const AUTHORISED_RETAILERS = new Set([
  "nike.com", "adidas.co.uk", "adidas.com", "jdsports.co.uk",
  "footlocker.co.uk", "asos.com", "schuh.co.uk", "size.co.uk",
  "endclothing.com", "selfridges.com", "harveynichols.com",
  "mrporter.com", "flannels.com", "footasylum.com", "office.co.uk",
  "zalando.co.uk", "offspring.co.uk", "sneakersnstuff.com",
  "solebox.com", "stockx.com", "goat.com",
]);

const FREE_RETURNS_RETAILERS = new Set([
  "nike.com", "adidas.co.uk", "adidas.com", "jdsports.co.uk",
  "footlocker.co.uk", "asos.com", "schuh.co.uk", "size.co.uk",
  "endclothing.com", "selfridges.com", "harveynichols.com",
  "mrporter.com", "flannels.com", "footasylum.com", "office.co.uk",
  "zalando.co.uk",
]);

const KIDS_PATH_PATTERNS = [
  /\/kids?\//i, /\/toddler/i, /\/junior/i, /\/infant/i, /\/youth/i,
  /\/children/i, /\/boys?\//i, /\/girls?\//i, /\/baby/i,
  /[-_](kids?|junior|toddler|infant|youth|child|baby)[-_]/i,
];

const TRUST_RATINGS: Record<string, number> = {
  "nike.com": 1.6, "adidas.co.uk": 1.5, "adidas.com": 1.5,
  "jdsports.co.uk": 1.9, "footlocker.co.uk": 1.7, "asos.com": 4.0,
  "endclothing.com": 4.1, "size.co.uk": 1.7, "offspring.co.uk": 1.8,
  "schuh.co.uk": 4.4, "amazon.co.uk": 4.0, "ebay.co.uk": 3.5,
  "flannels.com": 4.2, "selfridges.com": 2.3, "footasylum.com": 4.0,
  "sportsdirect.com": 4.0, "stockx.com": 4.4, "goat.com": 3.0,
  "office.co.uk": 4.1, "solebox.com": 2.5, "sneakersnstuff.com": 3.8,
};

// ─── URL / Domain Helpers ────────────────────────────────────
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
    if (/[?&](q|query|search|s)=/i.test(search)) return false;
    const lastSegment = segments[segments.length - 1];
    if (segments.length === 1) {
      const hasProductIdentifier = /\d/.test(lastSegment) || lastSegment.length > 20;
      if (!hasProductIdentifier) return false;
    }
    // Adidas filter/category pages use underscore separators (e.g. /samba-trainers-leather_upper)
    // Real product pages have a numeric style code or end in .html
    const hostname = parsed.hostname.replace(/^www\./, "");
    if ((hostname === "adidas.co.uk" || hostname === "adidas.com")
        && !pathname.match(/\d/) && !pathname.endsWith(".html")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeRetailerDomain(input: string): string | null {
  const cleaned = (input || "").replace(/\s+/g, "").trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/^m\./, "")
    .split("/")[0];
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
  const cleanDomain = domain.replace(/^m\./, "");
  const root = cleanDomain.split(".")[0].replace(/[-_]+/g, " ");
  return root.split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || "Unknown Retailer";
}

function isUkDomain(domain: string): boolean {
  return domain.endsWith(".uk") || domain.includes(".co.uk") || UK_COM_RETAILERS.has(domain);
}

function isKidsProduct(url: string, text: string): boolean {
  if (KIDS_PATH_PATTERNS.some((p) => p.test(url))) return true;
  const titleArea = text.slice(0, 300).toLowerCase();
  return /\b(toddler|infant|kids?|junior|youth|children'?s?)\b/.test(titleArea);
}

function isSecondhand(url: string, text: string): boolean {
  if (/\/itm\/|condition=used/i.test(url)) return true;
  const topContent = text.slice(0, 600).toLowerCase();
  return /\b(used|pre-?owned|second.?hand|worn|condition:\s*(good|fair|poor|acceptable|very good))\b/i.test(topContent);
}

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = ["srsltid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "dclid", "msclkid", "ref", "affiliate"];
    for (const p of trackingParams) parsed.searchParams.delete(p);
    return parsed.toString();
  } catch { return url; }
}

function getTrustRating(domain: string): number {
  return TRUST_RATINGS[domain] || 4.0;
}

// ─── AI-based price extraction ───────────────────────────────
async function extractPricesWithAI(
  candidates: Array<{ url: string; markdown?: string; description?: string; title?: string }>,
  productName: string,
  apiKey: string,
  estimatedRrp?: number
): Promise<Array<{ index: number; current_price_gbp: number; original_price_gbp: number | null; in_stock: boolean | null; coupon_code: string | null }>> {
  if (!candidates.length) return [];

  const candidateText = candidates.map((s, i) =>
    `[${i + 1}] URL: ${s.url}\nTitle: ${s.title || "(no title)"}\nContent: ${(s.markdown || s.description || "").slice(0, 700)}`
  ).join("\n---\n");

  const rrpHint = estimatedRrp ? ` The estimated retail price is £${estimatedRrp}.` : "";
  const sizeHint = productName.match(/\b(UK|US|EU)\s*\d+\.?\d*/i)?.[0];
  const sizeInstruction = sizeHint
    ? ` The customer wants size ${sizeHint} — only mark in_stock: true if that specific size is available.`
    : "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a price extraction specialist for a UK price comparison website.${rrpHint}${sizeInstruction}

The user is searching for: "${productName}"

For each numbered candidate, extract price data and return a JSON array. Rules:
- is_correct_product: true only if this page sells the exact searched product, brand new. Use common sense with colourway names ("Triple White" = "White/White/White" = "Cloud White"). Reject: wrong model number, kids/junior version, secondhand/used, category/browse pages.
- current_price_gbp: the current selling price in GBP. Use sale price if shown. Convert if needed (EUR ×0.85, USD ×0.79). null if not a product page.
- original_price_gbp: crossed-out RRP if shown, else null.
- in_stock: true if available to buy, false if sold out, null if unknown.
- coupon_code: exact visible promo code (e.g. "SAVE10"), null if none.

Return ONLY a raw JSON array, no markdown, no explanation:
[{"index":1,"is_correct_product":true,"current_price_gbp":90.00,"original_price_gbp":null,"in_stock":true,"coupon_code":null},...]`,
          },
          { role: "user", content: candidateText },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI price extraction HTTP error:", response.status, errText.slice(0, 500));
      return [];
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    if (!content) {
      console.error("AI returned empty content. Response:", JSON.stringify(aiData).slice(0, 500));
      return [];
    }

    // Parse JSON — try array directly, then look for a "results" key
    let allResults: any[] = [];
    try {
      const parsed = JSON.parse(content);
      allResults = Array.isArray(parsed) ? parsed : (parsed.results || parsed.data || []);
    } catch {
      // Try extracting JSON array from text
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try { allResults = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    const valid = allResults.filter((r: any) =>
      r.is_correct_product && r.in_stock !== false && typeof r.current_price_gbp === "number"
    );

    log(`AI returned ${allResults.length} total, ${valid.length} valid.`);

    return valid;
  } catch (e) {
    console.error("AI price extraction failed:", e);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Rate Limiter ────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8; // 8 requests per minute per IP (most expensive function)

function checkRateLimit(req: Request): Response | null {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = rateLimits.get(clientIp);
  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      const headers = getCorsHeaders(req);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json", "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) },
      });
    }
    entry.count++;
  } else {
    rateLimits.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
  if (rateLimits.size > 1000) {
    for (const [ip, e] of rateLimits) { if (now > e.resetAt) rateLimits.delete(ip); }
  }
  return null;
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { product_name, retailers, skip_cache, estimated_retail_price } = body;

    // Input validation
    if (!product_name || typeof product_name !== "string") {
      return new Response(JSON.stringify({ error: "product_name is required and must be a string" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (product_name.length > 300) {
      return new Response(JSON.stringify({ error: "product_name too long (max 300 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(retailers) || !retailers.length) {
      return new Response(JSON.stringify({ error: "retailers array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (retailers.length > 30) {
      return new Response(JSON.stringify({ error: "Too many retailers (max 30)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate retailer format (must look like domain names)
    for (const r of retailers) {
      if (typeof r !== "string" || r.length > 100 || !/^[a-zA-Z0-9._\-:/]+$/.test(r)) {
        return new Response(JSON.stringify({ error: "Invalid retailer format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (estimated_retail_price !== undefined && (typeof estimated_retail_price !== "number" || estimated_retail_price < 0 || estimated_retail_price > 100000)) {
      return new Response(JSON.stringify({ error: "Invalid estimated_retail_price" }), {
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
    // Include size in cache key so UK 9 and UK 10 don't share the same cache
    const sizeMatch = product_name.match(/\b(UK|US|EU)\s*\d+\.?\d*/i) || product_name.match(/\bsize\s*\d+\.?\d*/i);
    const sizeKey = sizeMatch ? `-${sizeMatch[0].toLowerCase().replace(/\s+/g, "")}` : "";
    const cacheKey = `${searchName.toLowerCase().trim()}${sizeKey}`;

    // Query 30-day historical low from price_history table
    const getThirtyDayLow = async (key: string): Promise<number | null> => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await sb.from("price_history").select("results")
          .eq("product_key", key).gte("checked_at", thirtyDaysAgo).limit(50);
        let low: number | null = null;
        for (const row of (data || [])) {
          for (const r of (row.results as any[] || [])) {
            if (typeof r.totalYouPay === "number" && (low === null || r.totalYouPay < low)) low = r.totalYouPay;
          }
        }
        return low;
      } catch { return null; }
    };

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
        log(`Cache hit for: ${cacheKey}`);
        const thirtyDayLow = await getThirtyDayLow(cacheKey);
        return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, cached_at: cachedCreatedAt, thirtyDayLow }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Firecrawl search ──
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Targeted search WITH scraping — returns Google-cached content (reliable for SPAs)
    const doSearchContent = async (query: string, limit: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const r = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ query, limit, lang: "en", country: "gb", scrapeOptions: { formats: ["markdown"] } }),
        });
        return await r.json();
      } catch { return { data: [] }; }
      finally { clearTimeout(timeout); }
    };

    // Broad search WITHOUT scraping — fast, gets many URLs + short snippets
    const doSearchUrls = async (query: string, limit: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ query, limit, lang: "en", country: "gb" }),
        });
        return await r.json();
      } catch { return { data: [] }; }
      finally { clearTimeout(timeout); }
    };

    log(`Searching for: "${searchName}"`);

    // Content queries (with scraping) — targeted, fewer results but richer content
    const contentQueries = [
      `${searchName} buy UK price £`,
      `${searchName} site:.co.uk in stock`,
      `${searchName} jdsports size schuh footlocker asos`,
      `${searchName} endclothing stockx goat laced`,
    ];

    // URL queries (without scraping) — broader, more URLs, short snippets only
    const urlQueries = [
      `${searchName} buy new in stock`,
      `${searchName} nike adidas offspring footpatrol`,
      `${searchName} price GBP UK trainers`,
    ];

    // Run all searches in parallel
    const [contentResultSets, urlResultSets] = await Promise.all([
      Promise.all(contentQueries.map(q => doSearchContent(q, 8))),
      Promise.all(urlQueries.map(q => doSearchUrls(q, 20))),
    ]);

    const seenUrls = new Set<string>();
    const rawCandidates: Array<{ url: string; title: string; markdown: string; description: string }> = [];

    // Content results first (higher quality — markdown available for AI)
    for (const result of contentResultSets) {
      for (const item of (result.data || [])) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          rawCandidates.push({ url: item.url, title: item.title || "", markdown: item.markdown || "", description: item.description || "" });
        }
      }
    }

    // URL results next (description snippets may still contain prices)
    for (const result of urlResultSets) {
      for (const item of (result.data || [])) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          rawCandidates.push({ url: item.url, title: item.title || "", markdown: "", description: item.description || "" });
        }
      }
    }

    log(`Found ${rawCandidates.length} unique URLs`);

    // Filter to clean product pages only
    const candidates = rawCandidates.filter((s) => {
      if (!s.url || isComparisonSite(s.url)) return false;
      const domain = extractDomain(s.url);
      if (!domain || NON_RETAIL_DOMAINS.some((p) => p.test(domain))) return false;
      if (BLOCKED_DOMAINS.has(domain)) return false;
      if (!isLikelyProductPage(s.url)) return false;
      if (isKidsProduct(s.url, s.title + " " + s.description)) return false;
      if (isSecondhand(s.url, s.title + " " + s.description)) return false;
      return true;
    });

    log(`${candidates.length} candidates after filtering`);

    // ── AI extracts and validates prices ──
    const aiResults = await extractPricesWithAI(candidates, searchName, LOVABLE_API_KEY, estimated_retail_price);

    log(`AI validated ${aiResults.length} results`);

    // ── Regex fallback if AI returned nothing ──
    // This ensures users always get some results even if the AI call fails
    if (aiResults.length === 0 && candidates.length > 0) {
      log("AI returned 0 results, falling back to regex extraction");
      const priceFloor = estimated_retail_price
        ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.5))
        : MIN_REALISTIC_PRICE;
      const priceCeil = estimated_retail_price ? estimated_retail_price * 2 : MAX_REALISTIC_PRICE;
      log(`Regex price range: £${priceFloor}-£${priceCeil}`);

      // Extract colour words from the search name so we can reject wrong colourways
      const COLOR_LIST = ["black","white","red","blue","green","yellow","orange","purple","pink","brown","grey","gray","beige","cream","navy","khaki","tan","silver","gold"];
      const searchColors = COLOR_LIST.filter(c => searchName.toLowerCase().includes(c));
      const conflictColors = COLOR_LIST.filter(c => !searchColors.includes(c));
      log(`Search colors: [${searchColors}], conflict colors: [${conflictColors}]`);

      let colorRejects = 0, noPriceRejects = 0;
      const regexExtracted: any[] = [];
      for (const s of candidates) {
        // Reject non-product pages (collection, category, browse pages)
        if (!isLikelyProductPage(s.url)) continue;

        // Reject pages whose URL or title clearly show a different colourway
        if (searchColors.length > 0 && conflictColors.length > 0) {
          const slugAndTitle = `${s.url}\n${s.title || ""}`.toLowerCase();
          if (conflictColors.some(c => slugAndTitle.includes(c))) { colorRejects++; continue; }
        }

        const text = `${s.title || ""}\n${(s.markdown || "").slice(0, 2000)}\n${s.description || ""}`;
        const normalized = text.replace(/,/g, "");
        const prices: number[] = [];
        for (const m of normalized.matchAll(/£\s?(\d{1,4}(?:\.\d{1,2})?)/gi)) {
          const v = Number(m[1]);
          if (!isNaN(v) && v >= priceFloor && v <= priceCeil) prices.push(v);
        }
        if (!prices.length) { noPriceRejects++; continue; }

        prices.sort((a, b) => a - b);
        const itemPrice = estimated_retail_price
          ? prices.reduce((best, p) => Math.abs(p - estimated_retail_price) < Math.abs(best - estimated_retail_price) ? p : best, prices[0])
          : prices[0];
        const domain = extractDomain(s.url);
        const uk = isUkDomain(domain);
        const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
        const duties = uk ? 0 : Number((itemPrice * 0.2).toFixed(2));
        regexExtracted.push({
          retailer: retailerNameFromDomain(domain),
          country: uk ? "UK" : "International",
          flag: uk ? "🇬🇧" : "🌍",
          itemPrice,
          shipping,
          duties,
          totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
          originalPrice: null,
          delivery: uk ? "2-5 days" : "7-14 days",
          trustRating: getTrustRating(domain),
          currency: "GBP",
          url: cleanUrl(s.url),
          inStock: null,
          checkedAt: new Date().toISOString(),
          couponCode: null,
          retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
            : TRUST_RATINGS[domain] ? "trusted"
            : "unverified",
          freeReturns: FREE_RETURNS_RETAILERS.has(domain),
        });
      }
      // Deduplicate by domain
      const fallbackByDomain = new Map<string, any>();
      for (const e of regexExtracted) {
        const d = extractDomain(e.url);
        if (!fallbackByDomain.has(d) || e.totalYouPay < fallbackByDomain.get(d).totalYouPay) {
          fallbackByDomain.set(d, e);
        }
      }
      const fallbackResults = Array.from(fallbackByDomain.values())
        .sort((a, b) => a.totalYouPay - b.totalYouPay)
        .map((r, i) => ({ ...r, rank: i + 1 }));

      if (fallbackResults.length > 0) {
        log(`Regex fallback found ${fallbackResults.length} results`);
        sb.from("price_cache").upsert(
          { product_key: cacheKey, results: fallbackResults, product_info: { product_name, retailers: normalizedRetailers } },
          { onConflict: "product_key" }
        ).then(({ error }) => { if (error) console.error("Cache write error:", error); });
        const thirtyDayLow = await getThirtyDayLow(cacheKey);
        return new Response(JSON.stringify({ success: true, results: fallbackResults, thirtyDayLow }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        log(`Regex fallback found 0 results`);
      }
    }

    // ── Build final results from AI output ──
    const priceCeiling = estimated_retail_price ? estimated_retail_price * 2.5 : MAX_REALISTIC_PRICE;

    const extracted: any[] = [];
    for (const aiResult of aiResults) {
      const source = candidates[aiResult.index - 1];
      if (!source || !aiResult.current_price_gbp) continue;

      const itemPrice = aiResult.current_price_gbp;
      if (itemPrice < MIN_REALISTIC_PRICE || itemPrice > priceCeiling) continue;

      const domain = extractDomain(source.url);
      const uk = isUkDomain(domain);
      const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
      const duties = uk ? 0 : Number((itemPrice * 0.2).toFixed(2));
      const totalYouPay = Number((itemPrice + shipping + duties).toFixed(2));

      extracted.push({
        retailer: retailerNameFromDomain(domain),
        country: uk ? "UK" : "International",
        flag: uk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay,
        originalPrice: aiResult.original_price_gbp ?? null,
        delivery: uk ? "2-5 days" : "7-14 days",
        trustRating: getTrustRating(domain),
        currency: "GBP",
        url: cleanUrl(source.url),
        inStock: aiResult.in_stock === true ? true : null,
        checkedAt: new Date().toISOString(),
        couponCode: aiResult.coupon_code || null,
        retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
          : TRUST_RATINGS[domain] ? "trusted"
          : "unverified",
        freeReturns: FREE_RETURNS_RETAILERS.has(domain),
      });
    }

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

    log(`Final: ${finalResults.length} unique retailers`);

    // ── 30-day historical low ──
    const thirtyDayLow = await getThirtyDayLow(cacheKey);

    // ── Price history (fire-and-forget) ──
    if (finalResults.length > 0) {
      sb.from("price_history")
        .insert({ product_key: cacheKey, results: finalResults })
        .then(({ error }) => {
          if (error && !error.message?.includes("does not exist")) {
            console.error("History insert:", error.message);
          }
        });
    }

    // Return stale cache if fresh results are worse
    if (finalResults.length < MIN_CACHE_RESULTS && cachedResults.length > finalResults.length) {
      log(`Returning stale cache`);
      return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, stale: true, thirtyDayLow }), {
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

    return new Response(JSON.stringify({ success: true, results: finalResults, thirtyDayLow }), {
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
