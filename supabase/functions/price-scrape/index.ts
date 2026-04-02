// GTBP Price Scrape Edge Function — scrapes and compares prices across retailers
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  "crepsuk.com", "launches.co.uk", "samedaytrainers.co.uk",
  "fatbuddhastore.com", "shucentre.co.uk",
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
  // Category paths: /footwear/model-name or /clothing/model-name (single slug, no product code segment after)
  /\/footwear\/[a-z0-9-]+$/i, /\/clothing\/[a-z0-9-]+$/i, /\/accessories\/[a-z0-9-]+$/i,
];

const MIN_REALISTIC_PRICE = 20;
const MAX_REALISTIC_PRICE = 2000;
const MIN_CACHE_RESULTS = 6;

const NON_RETAIL_DOMAINS = [
  /\.org\b/, /\.edu\b/, /\.gov\b/, /\.nhs\b/, /charity/, /hospice/, /foundation/,
  /wikipedia/, /reddit\.com/, /youtube\.com/, /facebook\.com/, /instagram\.com/,
  /twitter\.com/, /x\.com/, /tiktok\.com/, /pinterest\.com/,
  /trustpilot/, /glassdoor/, /indeed\.com/, /linkedin\.com/,
];

// Domains excluded from results — marketplace sellers and unverified micro-resellers
const BLOCKED_DOMAINS = new Set([
  // Marketplace — prices from third-party sellers, not reliable retail prices
  "amazon.co.uk", "amazon.com",
  // Unverified micro-resellers
  "findyourkicks.com", "luxurygoodslocker.com", "kicksmachine.com",
  "limitedresell.com", "crepcollectionclub.co.uk", "flipsupply.co.uk",
  "sportshowroom.co.uk", "hypedeconomy.co.uk", "4feetshoes.com",
  "cphsurplus.com", "trainersplus.co.uk", "sneakerfiles.com",
  "nicekicks.com", "sneakernews.com", "highsnobiety.com",
  "complex.com", "hypebeast.com",
]);

const AUTHORISED_RETAILERS = new Set([
  // Brand direct
  "nike.com", "adidas.co.uk", "adidas.com", "newbalance.co.uk", "newbalance.com",
  "puma.com", "reebok.com", "reebok.co.uk", "converse.com", "vans.com", "vans.co.uk",
  "timberland.com", "timberland.co.uk", "ugg.com", "crocs.com",
  "asics.com", "asics.co.uk", "saucony.com", "brooks.com", "hoka.com",
  "on-running.com", "salomon.com", "drmartens.com",
  // UK high street
  "jdsports.co.uk", "footlocker.co.uk", "schuh.co.uk", "size.co.uk",
  "offspring.co.uk", "footasylum.com", "office.co.uk", "sportsdirect.com",
  "flannels.com", "tessuti.co.uk", "scottsmenswear.com", "mainlinemenswear.co.uk",
  // UK online
  "asos.com", "endclothing.com", "selfridges.com", "harveynichols.com",
  "mrporter.com", "zalando.co.uk", "very.co.uk", "next.co.uk",
  "urbanoutfitters.com", "matchesfashion.com", "brownsfashion.com",
  // Sneaker specialist
  "sneakersnstuff.com", "solebox.com", "footpatrol.com", "hanon-shop.com",
  "klekt.com", "laced.com", "laced.co.uk", "thesolesupplier.co.uk",
  "crepsuk.com", "samedaytrainers.co.uk", "whatsyoursize.co.uk",
  "aphrodite1994.com", "urbanindustry.co.uk", "eightyeightstore.com",
  // Resale / global
  "stockx.com", "goat.com", "farfetch.com", "ssense.com",
  "footshop.eu", "asphaltgold.com", "bstn.com", "overkillshop.com",
  "allikestore.com", "titolo.ch", "kickz.com", "courir.com",
  "snipes.com", "sivasdescalzo.com", "nakedcph.com",
]);

const FREE_RETURNS_RETAILERS = new Set([
  "nike.com", "adidas.co.uk", "adidas.com", "jdsports.co.uk",
  "footlocker.co.uk", "asos.com", "schuh.co.uk", "size.co.uk",
  "endclothing.com", "selfridges.com", "harveynichols.com",
  "mrporter.com", "flannels.com", "footasylum.com", "office.co.uk",
  "zalando.co.uk", "whatsyoursize.co.uk",
]);


const KIDS_PATH_PATTERNS = [
  /\/kids?\//i, /\/toddler/i, /\/junior/i, /\/infant/i, /\/youth/i,
  /\/children/i, /\/boys?\//i, /\/girls?\//i, /\/baby/i,
  /[-_](kids?|junior|toddler|infant|youth|child|baby)[-_]/i,
  // Nike/Adidas size codes for grade school, preschool, toddler
  /\/gs\//i, /\/ps\//i, /\/td\//i,
  /[-_]gs[-_]/i, /[-_]ps[-_]/i, /[-_]td[-_]/i,
  /-gs$/i, /_gs$/i, /-ps$/i,
  /\/grade-?school/i, /\/pre-?school/i,
  /kids?$/i, /junior$/i,
];

const TRUST_RATINGS: Record<string, number> = {
  // Brand direct (UK Trustpilot scores)
  "nike.com": 1.6, "adidas.co.uk": 1.9, "adidas.com": 1.9,
  "newbalance.com": 2.1, "newbalance.co.uk": 2.1, "puma.com": 2.3, "reebok.com": 2.0, "reebok.co.uk": 2.0,
  "converse.com": 1.8, "vans.com": 1.9, "vans.co.uk": 1.9, "timberland.com": 2.2, "timberland.co.uk": 2.2,
  "asics.com": 2.8, "asics.co.uk": 2.8, "hoka.com": 3.2, "on-running.com": 3.5, "saucony.com": 2.5,
  "drmartens.com": 2.4,
  // UK high street (Trustpilot UK scores — verified 2025)
  "jdsports.co.uk": 2.0, "footlocker.co.uk": 1.5, "asos.com": 1.9,
  "endclothing.com": 4.3, "size.co.uk": 3.9, "offspring.co.uk": 4.2,
  "schuh.co.uk": 4.6, "amazon.co.uk": 1.4, "ebay.co.uk": 1.3,
  "flannels.com": 2.0, "tessuti.co.uk": 2.1, "selfridges.com": 2.0, "footasylum.com": 4.2,
  "sportsdirect.com": 2.0, "office.co.uk": 1.7, "next.co.uk": 3.8,
  "zalando.co.uk": 2.3, "very.co.uk": 1.8, "urbanoutfitters.com": 2.5,
  "mainlinemenswear.co.uk": 4.5, "scottsmenswear.com": 4.3,
  // Sneaker specialist
  "stockx.com": 3.7, "goat.com": 3.4, "laced.com": 4.3, "laced.co.uk": 4.3,
  "klekt.com": 4.0, "thesolesupplier.co.uk": 4.3,
  "sneakersnstuff.com": 3.2, "solebox.com": 3.4, "whatsyoursize.co.uk": 4.1,
  "footpatrol.com": 4.0, "hanon-shop.com": 3.8,
  "crepsuk.com": 4.0, "samedaytrainers.co.uk": 4.9,
  "urbanindustry.co.uk": 4.1, "aphrodite1994.com": 3.9,
  // Luxury
  "harveynichols.com": 2.0, "mrporter.com": 3.6,
  "matchesfashion.com": 3.8, "farfetch.com": 4.0, "ssense.com": 3.2,
  "brownsfashion.com": 3.5,
  // European
  "asphaltgold.com": 4.1, "bstn.com": 3.8, "footshop.eu": 3.7,
  "overkillshop.com": 3.6, "snipes.com": 3.5, "courir.com": 3.2,
};

// ─── Delivery times per retailer ─────────────────────────────
const DELIVERY_TIMES: Record<string, string> = {
  // Express/next-day capable
  "asos.com": "1-3 days",
  "next.co.uk": "1-2 days",
  "very.co.uk": "2-3 days",
  // Standard UK retailers
  "jdsports.co.uk": "2-4 days",
  "footlocker.co.uk": "3-5 days",
  "size.co.uk": "2-4 days",
  "offspring.co.uk": "2-4 days",
  "schuh.co.uk": "2-4 days",
  "office.co.uk": "2-4 days",
  "footasylum.com": "2-4 days",
  "endclothing.com": "2-4 days",
  "flannels.com": "2-4 days",
  "selfridges.com": "2-4 days",
  "harveynichols.com": "2-4 days",
  "mrporter.com": "1-3 days",
  "zalando.co.uk": "2-3 days",
  "sportsdirect.com": "3-5 days",
  "tessuti.co.uk": "3-5 days",
  "whatsyoursize.co.uk": "2-4 days",
  "thesolesupplier.co.uk": "3-5 days",
  "laced.com": "2-4 days",
  "klekt.com": "3-6 days",
  "crepsuk.com": "2-4 days",
  "samedaytrainers.co.uk": "same day / next day",
  // Brand direct
  "nike.com": "3-5 days",
  "adidas.co.uk": "3-5 days",
  "adidas.com": "3-5 days",
  "newbalance.com": "3-5 days",
  "converse.com": "3-5 days",
  "vans.com": "3-5 days",
  // International resellers
  "stockx.com": "7-14 days",
  "goat.com": "7-14 days",
  "farfetch.com": "3-7 days",
  "sneakersnstuff.com": "5-10 days",
  "solebox.com": "5-10 days",
  "matchesfashion.com": "2-4 days",
};

function getDeliveryTime(domain: string, isUk: boolean): string {
  return DELIVERY_TIMES[domain] ?? (isUk ? "2-5 days" : "7-14 days");
}

// UK Import Duty rules (post-Brexit):
// - Items under £135: no customs duty (VAT collected at point of sale by retailer)
// - Items £135+: customs duty applies (~12% footwear/clothing) + 20% VAT on (item + duty)
// Most compliant international retailers collect UK VAT at checkout, so we only add duty for £135+
function calculateDuties(itemPrice: number, isUk: boolean): number {
  if (isUk) return 0;
  if (itemPrice < 135) return 0; // duty-free threshold
  return Number((itemPrice * 0.12).toFixed(2)); // ~12% for footwear/clothing
}

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
    if (segments.length === 1) {
      const last = segments[0];
      if (!/\d/.test(last) && last.length <= 20) return false;
    }
    // Adidas category pages have no product code and no .html extension
    const hostname = parsed.hostname.replace(/^www\./, "").replace(/^(uk|gb)\./i, "");
    if ((hostname === "adidas.co.uk" || hostname === "adidas.com")
        && !pathname.match(/\d/) && !pathname.endsWith(".html")) return false;
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
  // Strip mobile and locale/country subdomains: uk.puma.com → puma.com
  let cleanDomain = domain.replace(/^m\./, "");
  cleanDomain = cleanDomain.replace(/^(uk|us|eu|de|fr|it|es|nl|au|ca|en|gb)\./i, "");
  const root = cleanDomain.split(".")[0].replace(/[-_]+/g, " ");
  return root.split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || "Unknown Retailer";
}

function isUkDomain(domain: string): boolean {
  return domain.endsWith(".uk") || domain.includes(".co.uk") || UK_COM_RETAILERS.has(domain)
    || /^(uk|gb)\./i.test(domain); // e.g. uk.puma.com, gb.adidas.com
}

function isKidsProduct(url: string, text: string): boolean {
  if (KIDS_PATH_PATTERNS.some((p) => p.test(url))) return true;
  const titleArea = text.slice(0, 500).toLowerCase();
  // Standard keywords
  if (/\b(toddler|infant|kids?|junior|youth|children'?s?|grade\s*school|preschool)\b/.test(titleArea)) return true;
  // Common retailer-specific patterns: "(J)", "Juniors", "Junior Sizes", "GS", size ranges like "3Y-7Y"
  if (/\(j(unior)?\)|\bjuniors?\b|size\s*[0-9]+y\b|\b[0-9]y\s*-/.test(titleArea)) return true;
  return false;
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

function getTrustRating(domain: string): number | null {
  return TRUST_RATINGS[domain] ?? null;
}

// Coupon codes must be uppercase alphanumeric, 4-20 chars
// Rejects AI hallucinations like "EXTRA10OFF at checkout" or full sentences
function isValidCouponCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  return /^[A-Z0-9_-]{4,20}$/.test(trimmed);
}

// ─── AI-based price extraction ───────────────────────────────
async function extractPricesWithAI(
  candidates: Array<{ url: string; markdown?: string; description?: string; title?: string }>,
  productName: string,
  apiKey: string,
  estimatedRrp?: number
): Promise<Array<{ index: number; current_price_gbp: number; original_price_gbp: number | null; in_stock: boolean | null; coupon_code: string | null; price_confidence: string | null }>> {
  if (!candidates.length) return [];

  // Use more content for pages we fully scraped (markdown) vs snippet-only (description)
  const candidateText = candidates.map((s, i) => {
    const content = s.markdown
      ? s.markdown.slice(0, 3000)          // full scrape — use generous slice
      : (s.description || "").slice(0, 500); // snippet only — keep short
    return `[${i + 1}] URL: ${s.url}\nTitle: ${s.title || "(no title)"}\nContent: ${content}`;
  }).join("\n---\n");

  const rrpHint = estimatedRrp ? ` The estimated retail price is £${estimatedRrp}.` : "";
  const sizeHint = productName.match(/\b(UK|US|EU)\s*\d+\.?\d*/i)?.[0];
  const sizeInstruction = sizeHint
    ? ` The customer wants size ${sizeHint} — only mark in_stock: true if that specific size is available. If this page is for a different size, set is_correct_product: false.`
    : "";
  const genderRaw2 = productName.match(/\b(men'?s?|women'?s?)\b/i)?.[0]?.toLowerCase() ?? "";
  const wantsMens2 = !!genderRaw2 && genderRaw2.startsWith("men") && !genderRaw2.startsWith("women");
  const wantsWomens2 = !!genderRaw2 && genderRaw2.startsWith("women");
  const genderInstruction = wantsMens2
    ? " The customer wants MEN'S — reject women's, kids', grade school, and junior versions."
    : wantsWomens2
    ? " The customer wants WOMEN'S — reject men's, kids', grade school, and junior versions."
    : " Reject kids', grade school, junior, and toddler versions.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a strict price extraction specialist for a UK price comparison website.${rrpHint}${sizeInstruction}${genderInstruction}

The user is searching for: "${productName}"

For each numbered candidate, extract price data and return a JSON array. Rules:

is_correct_product: true ONLY if ALL of these are true:
  1. The page is a specific product listing (not a category, collection, or search results page)
  2. The model matches AND the colourway is compatible. Common equivalents: "Cloud White"="White"="Off White"="Triple White"="White/White/White", "Core Black"="Black"="Triple Black"="Black/Black/Black", "Cream"="Ivory"="Natural", "Grey"="Gray"="Smoke Grey". RULE: only reject if the page CLEARLY shows a DIFFERENT primary colour (e.g. searching White but page shows Red, Blue, Green, Yellow, Pink, Orange). If the colourway is not explicitly stated but the model name matches, set is_correct_product: true.
  3. Brand new condition (not used, pre-owned, or refurbished)
  4. Correct gender and age group (not kids, junior, grade school, toddler unless searched for)
  REJECT if: wrong colourway/model, kids/GS/PS/TD version, secondhand, category page, wrong gender.

current_price_gbp: the current selling/add-to-cart price in GBP.
  - If shown in £, use directly.
  - If EUR: multiply by 0.85, set price_confidence "low".
  - If USD: multiply by 0.79, set price_confidence "low".
  - Do NOT guess or estimate — if no price visible, return null.

price_confidence: "high" if price clearly stated in GBP. "low" if converted or uncertain. null if no price found.
original_price_gbp: the crossed-out/was price if explicitly shown and higher than current price, else null.
in_stock: true if the text explicitly says "in stock", "available", "add to bag/cart" or similar positive availability. false if "sold out", "out of stock", "unavailable", or "notify me" shown. null if stock status is not mentioned.
coupon_code: exact visible promo/discount code text (e.g. "EXTRA10"), null if none visible.

CRITICAL: Never hallucinate prices. Only return a price number if you can see it on the page.

Return ONLY a raw JSON array (no markdown, no explanation):
[{"index":1,"is_correct_product":true,"current_price_gbp":90.00,"price_confidence":"high","original_price_gbp":null,"in_stock":true,"coupon_code":null},...]`,
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

    const valid = allResults.filter((r: any) => {
      if (!r.is_correct_product) return false;
      if (r.in_stock === false) return false;
      if (typeof r.current_price_gbp !== "number") return false;
      // Price sanity: if we know the retail price, reject anything below 60% of it
      // (likely a junior/GS version or wrong product)
      if (estimatedRrp && r.current_price_gbp < estimatedRrp * 0.6) return false;
      return true;
    });

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
const RATE_LIMIT_MAX = 40; // 40 requests per minute per IP

function checkRateLimit(req: Request): Response | null {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = rateLimits.get(clientIp);
  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) },
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
  // corsHeaders is already a module-level const
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { product_name, retailers: retailersInput, skip_cache, estimated_retail_price, gender } = body;
    let retailers = retailersInput;

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
    if (retailers.length > 40) {
      retailers = retailers.slice(0, 40);
    }
    // Validate retailer format (must look like domain names)
    for (let i = 0; i < retailers.length; i++) {
      retailers[i] = typeof retailers[i] === "string" ? retailers[i].trim() : retailers[i];
      const r = retailers[i];
      if (typeof r !== "string" || r.length === 0 || r.length > 100 || !/^[a-zA-Z0-9._\-:/]+$/.test(r)) {
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

    // Strip sizing info and SKU/style codes for search queries
    // e.g. "Nike Air Max Dn 'All Night' (DV8212-001) Men's UK 9" → "Nike Air Max Dn All Night"
    const searchName = product_name
      .replace(/\b(men'?s?|women'?s?|unisex)\b/gi, "")
      .replace(/\b(UK|US|EU)\s*\d+\.?\d*/gi, "")
      .replace(/\bsize\s*\d+\.?\d*/gi, "")
      // Strip SKU/style codes in parentheses or brackets: (DV8212-001), [BQ6806-101]
      .replace(/[\[(][A-Z]{1,4}[-_]?\d{3,}[-]\d{3,}[\])]/gi, "")
      // Strip any remaining parenthesised codes shorter than 20 chars
      .replace(/\([^)]{1,20}\)/g, "")
      // Remove surrounding single quotes from colourway names: 'All Night' → All Night
      .replace(/'([^']+)'/g, "$1")
      .replace(/\s{2,}/g, " ").trim();

    // ── Cache check ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env vars not configured");
    const sb = createClient(supabaseUrl, supabaseKey);
    // Include size AND gender in cache key so Men's UK 9 and Women's UK 9 don't share a cache
    const sizeMatch = product_name.match(/\b(UK|US|EU)\s*\d+\.?\d*/i) || product_name.match(/\bsize\s*\d+\.?\d*/i);
    const sizeKey = sizeMatch ? `-${sizeMatch[0].toLowerCase().replace(/\s+/g, "")}` : "";
    const genderMatch = product_name.match(/\b(men'?s?|women'?s?|unisex)\b/i);
    const genderKey = genderMatch ? `-${genderMatch[0].toLowerCase().replace(/\W/g, "")}` : "";
    const cacheKey = `${searchName.toLowerCase().trim()}${genderKey}${sizeKey}`;

    // Query 30-day historical low + daily history from price_history table
    const getThirtyDayLow = async (key: string): Promise<{ low: number | null; history: Array<{ date: string; price: number }> }> => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await sb.from("price_history").select("results, checked_at")
          .eq("product_key", key).gte("checked_at", thirtyDaysAgo).order("checked_at", { ascending: true }).limit(100);
        let low: number | null = null;
        const dayMap = new Map<string, number>(); // date -> best price that day
        for (const row of (data || [])) {
          const date = (row.checked_at as string).slice(0, 10); // YYYY-MM-DD
          for (const r of (row.results as any[] || [])) {
            if (typeof r.totalYouPay === "number") {
              if (low === null || r.totalYouPay < low) low = r.totalYouPay;
              const existing = dayMap.get(date);
              if (existing === undefined || r.totalYouPay < existing) dayMap.set(date, r.totalYouPay);
            }
          }
        }
        const history = Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, price]) => ({ date, price }));
        return { low, history };
      } catch { return { low: null, history: [] }; }
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
        const { low: thirtyDayLow, history: priceHistory } = await getThirtyDayLow(cacheKey);
        return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, cached_at: cachedCreatedAt, thirtyDayLow, priceHistory }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Affiliate feed query (runs in parallel with Firecrawl) ──
    // Returns structured results from the affiliate_products table (populated by feed-ingest).
    // Falls back gracefully to [] if the table doesn't exist or is empty.
    const queryAffiliateFeed = async (): Promise<any[]> => {
      try {
        const { data, error } = await sb
          .from("affiliate_products")
          .select("merchant, product_name, brand, price, rrp, deep_link, in_stock")
          .textSearch("product_name", searchName, { type: "websearch", config: "english" })
          .order("price", { ascending: true })
          .limit(30);
        if (error || !data?.length) return [];
        const feedResults: any[] = [];
        for (const row of data) {
          const domain = extractDomain(row.deep_link);
          if (!domain) continue;
          const baseDomain = domain.replace(/^(uk|gb|us|eu|de|fr|m)\./i, "");
          const isKnown = normalizedRetailers.some(r => domain === r || baseDomain === r)
            || AUTHORISED_RETAILERS.has(domain) || AUTHORISED_RETAILERS.has(baseDomain);
          if (!isKnown) continue;
          const itemPrice = Number(row.price);
          if (!itemPrice || isNaN(itemPrice)) continue;
          const uk = isUkDomain(domain);
          const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
          const duties = calculateDuties(itemPrice, uk);
          feedResults.push({
            retailer: retailerNameFromDomain(domain),
            country: uk ? "UK" : "International",
            flag: uk ? "🇬🇧" : "🌍",
            itemPrice,
            shipping,
            duties,
            totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
            originalPrice: row.rrp && Number(row.rrp) > itemPrice ? Number(row.rrp) : null,
            delivery: getDeliveryTime(domain, uk),
            trustRating: getTrustRating(domain),
            currency: "GBP",
            url: row.deep_link,
            inStock: row.in_stock,
            checkedAt: new Date().toISOString(),
            couponCode: null,
            priceConfidence: "high",
            retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
              : TRUST_RATINGS[domain] ? "trusted" : "unverified",
            freeReturns: FREE_RETURNS_RETAILERS.has(domain),
          });
        }
        return feedResults;
      } catch { return []; }
    };

    // ── Firecrawl search ──
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Step 1: snippet search — finds URLs cheaply (1 credit/result)
    // includeDomains filters results to specific domains (Firecrawl native param — more reliable than site: in query)
    const doSearchUrls = async (query: string, limit: number, includeDomains?: string[]) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const r = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            query, limit, lang: "en", country: "gb",
            ...(includeDomains?.length ? { includeDomains } : {}),
          }),
        });
        return await r.json();
      } catch { return { data: [] }; }
      finally { clearTimeout(timeout); }
    };

    // JS-heavy retailers that need extra wait time for price to render
    const JS_HEAVY_RETAILERS = new Set([
      "jdsports.co.uk", "size.co.uk", "footlocker.co.uk", "schuh.co.uk",
      "offspring.co.uk", "footasylum.com", "sportsdirect.com",
    ]);

    // Direct resale platform search — scrapes search result pages to extract product URLs.
    // Bypasses Firecrawl's search index, so works even for niche/new/limited products.
    const scrapeResaleSearch = async (searchUrl: string, urlPattern: RegExp): Promise<Array<{ url: string; title: string; markdown: string; description: string }>> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ url: searchUrl, formats: ["markdown"], onlyMainContent: true, waitFor: 1500 }),
        });
        if (!r.ok) return [];
        const data = await r.json();
        const md: string = data?.data?.markdown || "";
        const links: Array<{ url: string; title: string; markdown: string; description: string }> = [];
        for (const m of md.matchAll(urlPattern)) {
          if (!links.some(l => l.url === m[0])) links.push({ url: m[0], title: "", markdown: "", description: "" });
          if (links.length >= 3) break;
        }
        return links;
      } catch { return []; }
      finally { clearTimeout(timeout); }
    };

    // Step 2: scrape a product page for real content (1 credit/page)
    const scrapeProductPage = async (url: string): Promise<string> => {
      const domain = extractDomain(url);
      const jsHeavy = JS_HEAVY_RETAILERS.has(domain);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), jsHeavy ? 15000 : 9000);
      try {
        const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            url, formats: ["markdown"], onlyMainContent: true,
            ...(jsHeavy ? { waitFor: 3000 } : {}),
          }),
        });
        if (!r.ok) return "";
        const data = await r.json();
        return data?.data?.markdown?.slice(0, 5000) || "";
      } catch { return ""; }
      finally { clearTimeout(timeout); }
    };

    log(`Searching for: "${searchName}"`);

    // ── Search strategy ──────────────────────────────────────────────────────
    // Broad queries for general discovery + two includeDomains queries targeting
    // UK high street and boutique retailers directly (replaces broken site: queries).
    const broadQueries = [
      `${searchName} buy UK price`,
      `${searchName} stockx goat klekt laced buy price`,
      `${searchName} selfridges farfetch ssense mrporter buy`,
    ];

    // includeDomains ensures results come only from these domains — far more reliable than site: in query string
    const UK_HIGHSTREET_DOMAINS = [
      "jdsports.co.uk", "size.co.uk", "schuh.co.uk", "footlocker.co.uk",
      "offspring.co.uk", "footasylum.com", "endclothing.com", "asos.com",
      "zalando.co.uk", "flannels.com", "tessuti.co.uk", "office.co.uk",
      "sportsdirect.com", "very.co.uk", "next.co.uk",
      "scottsmenswear.com", "mainlinemenswear.co.uk",
    ];
    const BRAND_DIRECT_DOMAINS = [
      "nike.com", "adidas.co.uk", "newbalance.co.uk", "asics.co.uk",
      "puma.com", "reebok.co.uk", "converse.com", "vans.co.uk",
      "timberland.co.uk", "hoka.com", "on-running.com", "saucony.com",
      "drmartens.com", "crocs.com",
    ];
    const LUXURY_DOMAINS = [
      "selfridges.com", "harveynichols.com", "mrporter.com",
      "matchesfashion.com", "farfetch.com", "ssense.com",
      "brownsfashion.com", "harrods.com",
    ];
    const BOUTIQUE_DOMAINS = [
      "sneakersnstuff.com", "solebox.com", "footpatrol.com", "hanon-shop.com",
      "asphaltgold.com", "bstn.com", "overkillshop.com", "allikestore.com",
      "snipes.com", "courir.com", "footshop.eu", "urbanindustry.co.uk",
      "aphrodite1994.com", "eightyeightstore.com", "nakedcph.com",
      "sivasdescalzo.com", "titolo.ch", "kickz.com",
    ];
    // Resale platforms carry virtually every sneaker — safety net for limited/exclusive releases
    const RESALE_DOMAINS = [
      "stockx.com", "goat.com", "klekt.com", "laced.com", "laced.co.uk",
      "thesolesupplier.co.uk", "crepsuk.com", "whatsyoursize.co.uk",
      "samedaytrainers.co.uk",
    ];

    // Strip colour words to get model-only name — UK retailers often omit the official colourway
    // e.g. "Nike Air Max DN All Night" → "Nike Air Max DN"
    //      "Adidas Samba OG Cloud White Core Black" → "Adidas Samba OG"
    const COLOUR_STRIP_RE = /\b(cloud\s+white|core\s+black|triple\s+white|triple\s+black|all\s+night|pure\s+platinum|volt|phantom|clear\s+granite|sail|natural|off\s+white|cream\s+white|ghost|light\s+bone|particle\s+grey|dark\s+grey|smoke\s+grey|medium\s+grey|light\s+grey|[a-z]+\s+grey|[a-z]+\s+gray|[a-z]+\s+blue|[a-z]+\s+red|[a-z]+\s+green|[a-z]+\s+black|[a-z]+\s+white|white|black|red|blue|green|yellow|orange|purple|pink|brown|grey|gray|beige|cream|navy|khaki|tan|silver|gold|olive|burgundy|coral|sage|slate|indigo|teal|mint|sand|stone|chalk)\b/gi;
    const modelOnly = searchName.replace(COLOUR_STRIP_RE, "").replace(/\s{2,}/g, " ").trim();

    const resaleQuery = encodeURIComponent(modelOnly && modelOnly !== searchName ? modelOnly : searchName);
    const [broadResultSets, ukAnchorResults, ukAnchorFallback, brandDirectResults, luxuryResults, boutiqueResults, resaleResults, feedResults, stockxLinks, klektLinks] = await Promise.all([
      Promise.all(broadQueries.map(q => doSearchUrls(q, 12))),
      doSearchUrls(`${searchName} buy`, 20, UK_HIGHSTREET_DOMAINS),
      modelOnly && modelOnly !== searchName ? doSearchUrls(`${modelOnly} buy`, 12, UK_HIGHSTREET_DOMAINS) : Promise.resolve({ data: [] }),
      doSearchUrls(`${searchName} buy`, 14, BRAND_DIRECT_DOMAINS),
      doSearchUrls(`${searchName} buy`, 10, LUXURY_DOMAINS),
      doSearchUrls(`${searchName} buy`, 14, BOUTIQUE_DOMAINS),
      doSearchUrls(searchName, 15, RESALE_DOMAINS),
      queryAffiliateFeed(),
      // Direct scrapes bypass Firecrawl index gaps — always find product pages on resale platforms
      scrapeResaleSearch(
        `https://stockx.com/search?s=${resaleQuery}`,
        /https?:\/\/stockx\.com\/(?!search|how-it|buy|sell|news|about|sneakers$|streetwear$)[a-z0-9][a-z0-9-]{8,}/gi
      ),
      scrapeResaleSearch(
        `https://klekt.com/search?q=${resaleQuery}`,
        /https?:\/\/(?:www\.)?klekt\.com\/[a-z0-9-]{8,}/gi
      ),
    ]);

    const seenUrls = new Set<string>();
    const rawCandidates: Array<{ url: string; title: string; markdown: string; description: string }> = [];

    // includeDomains + direct scrapes first (highest precision), then broad fallback
    for (const result of [...[ukAnchorResults, ukAnchorFallback, brandDirectResults, luxuryResults, boutiqueResults, resaleResults], ...broadResultSets]) {
      for (const item of (result.data || [])) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          rawCandidates.push({ url: item.url, title: item.title || "", markdown: item.markdown || "", description: item.description || "" });
        }
      }
    }
    // Inject direct resale scrape results
    for (const item of [...stockxLinks, ...klektLinks]) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        rawCandidates.push(item);
      }
    }

    log(`Found ${rawCandidates.length} unique URLs`);

    // Extract gender intent — prefer explicit param, fall back to product name
    const genderParam = (gender as string | undefined)?.toLowerCase().trim();
    const genderFromName = product_name.match(/\b(men'?s?|women'?s?)\b/i)?.[0]?.toLowerCase() ?? "";
    const wantsMens = genderParam === "men" || genderParam === "male"
      || (!genderParam && !!genderFromName && genderFromName.startsWith("men") && !genderFromName.startsWith("women"));
    const wantsWomens = genderParam === "women" || genderParam === "female"
      || (!genderParam && !!genderFromName && genderFromName.startsWith("women"));

    // Filter to clean product pages only
    const candidates = rawCandidates.filter((s) => {
      if (!s.url || isComparisonSite(s.url)) return false;
      const domain = extractDomain(s.url);
      if (!domain || NON_RETAIL_DOMAINS.some((p) => p.test(domain))) return false;
      if (BLOCKED_DOMAINS.has(domain)) return false;
      // Accept URLs from target retailers OR known authorised retailers
      // (broad queries may surface extra stockists beyond the requested list)
      const baseDomain = domain.replace(/^(uk|gb|us|eu|de|fr|m)\./i, "");
      const isKnownRetailer = normalizedRetailers.some(r => domain === r || baseDomain === r)
        || AUTHORISED_RETAILERS.has(domain) || AUTHORISED_RETAILERS.has(baseDomain);
      if (!isKnownRetailer) return false;
      if (!isLikelyProductPage(s.url)) return false;
      if (isKidsProduct(s.url, s.title + " " + s.description)) return false;
      if (isSecondhand(s.url, s.title + " " + s.description)) return false;
      // Reject non-GB storefronts (e.g. asos.com/us/, nike.com/us/)
      if (/\/(us|au|ca|de|fr|it|es|nl)\//.test(s.url) && !s.url.includes(".co.uk")) return false;
      // Gender filtering — reject opposite-gender URLs
      const urlLower = s.url.toLowerCase();
      if (wantsMens && /\/womens?[-_/]|[-_]womens?[-_/]|\/women\/|-w-|[-_]wmns/.test(urlLower)) return false;
      if (wantsWomens && /\/mens?[-_/]|[-_]mens?[-_/]|\/men\//.test(urlLower)) return false;
      return true;
    });

    // ── Colorway URL filtering — reject URLs containing conflicting colour words ──
    const COLOR_LIST = ["black","white","red","blue","green","yellow","orange","purple","pink","brown","grey","gray","beige","cream","navy","khaki","tan","silver","gold"];
    const searchColors = COLOR_LIST.filter(c => searchName.toLowerCase().includes(c));
    const conflictColors = COLOR_LIST.filter(c => !searchColors.includes(c));

    const colorFilteredCandidates = searchColors.length > 0
      ? candidates.filter((s) => {
          const slugAndTitle = `${s.url} ${s.title || ""}`.toLowerCase();
          return !conflictColors.some(c => {
            const pattern = new RegExp(`[-_/]${c}[-_/]|[-_]${c}$|^${c}[-_]`, "i");
            return pattern.test(slugAndTitle);
          });
        })
      : candidates;

    log(`${colorFilteredCandidates.length} candidates after colour filtering (${candidates.length - colorFilteredCandidates.length} colour conflicts removed)`);

    // Deduplicate by domain — keep one URL per retailer (the first/best found)
    const seenDomains = new Set<string>();
    const enrichedCandidates = colorFilteredCandidates.filter(c => {
      const d = extractDomain(c.url);
      if (seenDomains.has(d)) return false;
      seenDomains.add(d);
      return true;
    });

    log(`${enrichedCandidates.length} candidates after domain dedup`);

    // ── Step 2: smart scraping — skip pages whose snippet already has a clear price ──
    // This avoids wasting time scraping pages that already returned price data in their snippet.
    const TOP_N_SCRAPE = 20;
    const SNIPPET_PRICE_RE = /£\s?\d{2,4}(?:\.\d{2})?/;
    const toProcess = enrichedCandidates.slice(0, TOP_N_SCRAPE);
    const needsScraping = toProcess.filter(c => !SNIPPET_PRICE_RE.test((c.description || "") + " " + (c.markdown || "")));
    const hasSnippetPrice = toProcess.filter(c => SNIPPET_PRICE_RE.test((c.description || "") + " " + (c.markdown || "")));
    log(`Scraping ${needsScraping.length} pages (${hasSnippetPrice.length} already have price in snippet)`);
    const scrapedMarkdowns = await Promise.all(needsScraping.map(c => scrapeProductPage(c.url)));
    const scrapedCandidates = toProcess.map((c) => {
      const idx = needsScraping.findIndex(n => n.url === c.url);
      if (idx !== -1) return { ...c, markdown: scrapedMarkdowns[idx] || c.markdown || "" };
      return { ...c, markdown: c.markdown || c.description || "" };
    });
    log(`Scraped ${scrapedMarkdowns.filter(Boolean).length}/${needsScraping.length} pages`);

    // ── AI extracts and validates prices (parallel batches of 8) ──
    const BATCH_SIZE = 8;
    const batches: typeof scrapedCandidates[] = [];
    for (let i = 0; i < scrapedCandidates.length; i += BATCH_SIZE) {
      batches.push(scrapedCandidates.slice(i, i + BATCH_SIZE));
    }
    const batchResults = await Promise.all(
      batches.map((batch, bi) =>
        extractPricesWithAI(
          batch,
          product_name, LOVABLE_API_KEY, estimated_retail_price
        ).then(results => results.map(r => ({ ...r, index: bi * BATCH_SIZE + (typeof r.index === "number" ? r.index : 0) })))
      )
    );
    const aiResults = batchResults.flat();

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
        const duties = calculateDuties(itemPrice, uk);
        regexExtracted.push({
          retailer: retailerNameFromDomain(domain),
          country: uk ? "UK" : "International",
          flag: uk ? "🇬🇧" : "🌍",
          itemPrice,
          shipping,
          duties,
          totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
          originalPrice: null,
          delivery: getDeliveryTime(domain, uk),
          trustRating: getTrustRating(domain),
          currency: "GBP",
          url: cleanUrl(s.url),
          inStock: null,
          checkedAt: new Date().toISOString(),
          couponCode: null, // regex fallback never has coupon codes
          priceConfidence: "low",
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
        const { low: thirtyDayLow, history: priceHistory } = await getThirtyDayLow(cacheKey);
        return new Response(JSON.stringify({ success: true, results: fallbackResults, thirtyDayLow, priceHistory }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        log(`Regex fallback found 0 results`);
      }
    }

    // ── Build final results from AI output ──
    const priceCeiling = estimated_retail_price ? estimated_retail_price * 1.6 : MAX_REALISTIC_PRICE;
    const priceFloor = estimated_retail_price
      ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.5))
      : MIN_REALISTIC_PRICE;

    const extracted: any[] = [];
    for (const aiResult of aiResults) {
      const idx = (aiResult.index ?? 0) - 1;
      if (idx < 0 || idx >= scrapedCandidates.length) continue;
      const source = scrapedCandidates[idx];
      if (!source || !aiResult.current_price_gbp) continue;

      const itemPrice = aiResult.current_price_gbp;
      if (itemPrice < priceFloor || itemPrice > priceCeiling) continue;

      const domain = extractDomain(source.url);
      const uk = isUkDomain(domain);
      const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
      const duties = calculateDuties(itemPrice, uk);
      const totalYouPay = Number((itemPrice + shipping + duties).toFixed(2));

      extracted.push({
        retailer: retailerNameFromDomain(domain),
        country: uk ? "UK" : "International",
        flag: uk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay,
        originalPrice: (aiResult.original_price_gbp && aiResult.original_price_gbp > itemPrice
          && (!estimated_retail_price || aiResult.original_price_gbp <= estimated_retail_price * 1.3))
          ? aiResult.original_price_gbp : null,
        delivery: getDeliveryTime(domain, uk),
        trustRating: getTrustRating(domain),
        currency: "GBP",
        url: cleanUrl(source.url),
        inStock: aiResult.in_stock === true ? true : aiResult.in_stock === false ? false : null,
        checkedAt: new Date().toISOString(),
        couponCode: isValidCouponCode(aiResult.coupon_code) ? aiResult.coupon_code : null,
        priceConfidence: aiResult.price_confidence || "high",
        retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
          : TRUST_RATINGS[domain] ? "trusted"
          : "unverified",
        freeReturns: FREE_RETURNS_RETAILERS.has(domain),
      });
    }

    // ── Regex fallback for AUTHORISED_RETAILERS that AI couldn't price ──
    // JS-heavy pages (JD Sports, Size?, Foot Locker etc.) often return empty scrape markdown.
    // For trusted domains, extract price from snippet/title as low-confidence fallback.
    const aiCoveredDomains = new Set(extracted.map(e => extractDomain(e.url)));
    for (const c of enrichedCandidates) {
      const domain = extractDomain(c.url);
      if (aiCoveredDomains.has(domain)) continue;
      if (!AUTHORISED_RETAILERS.has(domain)) continue;
      const text = `${c.title || ""} ${c.markdown || ""} ${c.description || ""}`;
      const prices: number[] = [];
      for (const m of text.replace(/,/g, "").matchAll(/£\s?(\d{1,4}(?:\.\d{1,2})?)/gi)) {
        const v = Number(m[1]);
        if (!isNaN(v) && v >= priceFloor && v <= priceCeiling) prices.push(v);
      }
      if (!prices.length) continue;
      prices.sort((a, b) => a - b);
      const itemPrice = estimated_retail_price
        ? prices.reduce((best, p) => Math.abs(p - estimated_retail_price) < Math.abs(best - estimated_retail_price) ? p : best, prices[0])
        : prices[0];
      const uk = isUkDomain(domain);
      const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
      const duties = calculateDuties(itemPrice, uk);
      extracted.push({
        retailer: retailerNameFromDomain(domain),
        country: uk ? "UK" : "International",
        flag: uk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
        originalPrice: null,
        delivery: getDeliveryTime(domain, uk),
        trustRating: getTrustRating(domain),
        currency: "GBP",
        url: cleanUrl(c.url),
        inStock: null,
        checkedAt: new Date().toISOString(),
        couponCode: null,
        priceConfidence: "low",
        retailerTier: "authorised",
        freeReturns: FREE_RETURNS_RETAILERS.has(domain),
      });
      aiCoveredDomains.add(domain);
    }
    log(`After regex fallback for authorised retailers: ${extracted.length} total`);

    // Merge affiliate feed results — feed takes precedence over scraped (higher confidence)
    for (const feedEntry of feedResults) {
      const domain = extractDomain(feedEntry.url);
      const alreadySeen = extracted.some(e => extractDomain(e.url) === domain);
      if (!alreadySeen) extracted.push(feedEntry);
    }
    log(`After feed merge: ${extracted.length} total extracted`);

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

    const sorted = Array.from(byDomain.values())
      .filter(r => r.retailer && r.retailer.length > 2) // drop bogus names like "Uk", "Us"
      .sort((a, b) => a.totalYouPay - b.totalYouPay);

    // ── Price outlier filter: hide results > 80% above cheapest (only when 4+ results) ──
    const cheapest = sorted[0]?.totalYouPay ?? 0;
    const cutoff = cheapest * 1.8;
    const finalResults = (sorted.length >= 4 ? sorted.filter(r => r.totalYouPay <= cutoff) : sorted)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    log(`Final: ${finalResults.length} unique retailers (cutoff £${cutoff.toFixed(0)})`);

    // ── 30-day historical low + chart data ──
    const { low: thirtyDayLow, history: priceHistory } = await getThirtyDayLow(cacheKey);

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
      return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, stale: true, thirtyDayLow, priceHistory }), {
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

    return new Response(JSON.stringify({ success: true, results: finalResults, thirtyDayLow, priceHistory }), {
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
