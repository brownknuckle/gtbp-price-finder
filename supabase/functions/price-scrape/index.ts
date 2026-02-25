import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Price comparison / aggregator domains to exclude
const EXCLUDED_DOMAINS = [
  "pricespy", "pricerunner", "idealo", "shopzilla", "bizrate",
  "google.com/shopping", "shopping.google", "kelkoo", "nextag",
  "pricegrabber", "shopbot", "skinflint", "camelcamelcamel",
  "keepa.com", "prisjakt",
];

const MIN_CACHE_RESULTS = 6;

function isComparisonSite(url: string): boolean {
  const lower = url.toLowerCase();
  return EXCLUDED_DOMAINS.some(d => lower.includes(d));
}

function normalizeRetailerDomain(input: string): string | null {
  const cleaned = (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/\s+/g, "");

  if (!cleaned || !cleaned.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(cleaned)) return null;
  return cleaned;
}

function normalizeRetailerName(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractFirstGbpPrice(text: string): number | null {
  const normalized = (text || "").replace(/,/g, "");
  const gbpMatch = normalized.match(/£\s?(\d+(?:\.\d{1,2})?)/i);
  if (gbpMatch) return Number(gbpMatch[1]);

  const codeMatch = normalized.match(/(\d+(?:\.\d{1,2})?)\s?(?:GBP)/i);
  if (codeMatch) return Number(codeMatch[1]);

  return null;
}

function retailerNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const root = hostname.split(".")[0].replace(/[-_]+/g, " ");
    return root
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Unknown Retailer";
  } catch {
    return "Unknown Retailer";
  }
}

function buildSourceSnippet(source: any): string {
  const raw = `${source?.markdown || ""}\n${source?.description || ""}`.trim();
  if (!raw) return "No content";

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const relevant = lines
    .filter((line) => /£|\bgbp\b|\$|€|sale|now|was|in stock|out of stock|add to bag|add to cart/i.test(line))
    .slice(0, 16);

  return (relevant.length ? relevant.join("\n") : raw).slice(0, 900);
}

function buildFallbackResults(sources: any[]): any[] {
  return sources
    .map((source: any) => {
      const url = source?.url || "";
      if (!url || isComparisonSite(url)) return null;

      const text = `${source?.markdown || ""}\n${source?.description || ""}`;
      const itemPrice = extractFirstGbpPrice(text);
      if (itemPrice === null || Number.isNaN(itemPrice)) return null;

      let hostname = "";
      try {
        hostname = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return null;
      }

      const isUk = hostname.endsWith(".uk") || hostname.includes(".co.uk");
      const shipping = isUk ? 4.99 : 12.99;
      const duties = isUk ? 0 : Number((itemPrice * 0.2).toFixed(2));

      return {
        retailer: retailerNameFromUrl(url),
        country: isUk ? "UK" : "International",
        flag: isUk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
        originalPrice: null,
        delivery: isUk ? "2-5 days" : "7-14 days",
        trustRating: 4.0,
        currency: "GBP",
        url,
      };
    })
    .filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, retailers, skip_cache } = await req.json();

    if (!product_name || !Array.isArray(retailers) || !retailers.length) {
      return new Response(JSON.stringify({ error: "product_name and retailers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedRetailers = Array.from(
      new Set((retailers as string[]).map(normalizeRetailerDomain).filter(Boolean) as string[])
    );

    if (!normalizedRetailers.length) {
      return new Response(JSON.stringify({ error: "No valid retailer domains provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip sizing info for search queries (keep for display only)
    const searchName = product_name
      .replace(/\b(men'?s?|women'?s?|unisex)\b/gi, "")
      .replace(/\b(UK|US|EU)\s*\d+\.?\d*/gi, "")
      .replace(/\bsize\s*\d+\.?\d*/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);
    const cacheKey = searchName.toLowerCase().trim();

    let cachedResults: any[] = [];
    let hasSufficientCachedResults = false;

    if (!skip_cache) {
      const { data: cached } = await sb
        .from("price_cache")
        .select("results, created_at")
        .eq("product_key", cacheKey)
        .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      cachedResults = Array.isArray(cached?.results) ? cached.results : [];
      hasSufficientCachedResults = cachedResults.length >= MIN_CACHE_RESULTS;
    } else {
      console.log(`Cache bypass requested for: ${cacheKey}`);
    }

    if (hasSufficientCachedResults) {
      console.log(`Cache hit for: ${cacheKey} (${cachedResults.length} results)`);
      return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, cached_at: cached!.created_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cachedResults.length > 0) {
      console.log(`Low-quality cache hit for: ${cacheKey} (${cachedResults.length} results), refreshing`);
    } else {
      console.log("Cache miss for:", cacheKey);
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const doSearch = async (query: string, limit: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            limit,
            lang: "en",
            country: "gb",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        return await response.json();
      } catch {
        return { data: [] };
      } finally {
        clearTimeout(timeout);
      }
    };

    console.log(`Searching for: "${searchName}" across ${normalizedRetailers.length} retailers`);

    // Batch retailers into groups for efficient API fan-out
    const allResults: any[] = [];
    const seenUrls = new Set<string>();

    const BATCH_SIZE = 8;
    const retailerBatches: string[][] = [];
    for (let i = 0; i < normalizedRetailers.length; i += BATCH_SIZE) {
      retailerBatches.push(normalizedRetailers.slice(i, i + BATCH_SIZE));
    }

    // Build batched queries using cleaned search name (no sizing info)
    const batchPromises = retailerBatches.map((batch: string[]) => {
      const siteQuery = batch.map((r: string) => `site:${r}`).join(" OR ");
      return doSearch(`${searchName} buy price £ ${siteQuery}`, Math.min(batch.length * 3, 24));
    });
    // Three broad fallback searches for wider coverage
    const broadPromise1 = doSearch(`${searchName} buy UK price GBP £`, 15);
    const broadPromise2 = doSearch(`"${searchName}" shop price £`, 10);
    const broadPromise3 = doSearch(`${searchName} trainers price`, 8);

    const allSearchResults = await Promise.all([...batchPromises, broadPromise1, broadPromise2, broadPromise3]);

    for (const result of allSearchResults) {
      for (const item of (result.data || [])) {
        if (item.url && !seenUrls.has(item.url) && !isComparisonSite(item.url)) {
          seenUrls.add(item.url);
          allResults.push(item);
        }
      }
    }

    console.log(`Found ${allResults.length} direct retailer sources from ${normalizedRetailers.length} retailers`);

    // Deduplicate by domain to keep one result per retailer, limit total to avoid timeouts
    const byDomain = new Map<string, any>();
    for (const r of allResults) {
      try {
        const domain = new URL(r.url).hostname.replace("www.", "");
        if (!byDomain.has(domain)) {
          byDomain.set(domain, r);
        }
      } catch { /* skip invalid URLs */ }
    }
    const dedupedResults = Array.from(byDomain.values()).slice(0, 40);

    console.log(`Deduped to ${dedupedResults.length} unique retailer domains`);

    const scrapedContent = dedupedResults
      .map((r: any, i: number) => `[Source ${i + 1}: ${r.url}]\n${buildSourceSnippet(r)}`)
      .join("\n\n---\n\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a price extraction expert. Given scraped web content from DIRECT RETAILER websites, extract real prices.

CRITICAL RULES:
- Extract ALL retailers where an EXACT price is clearly stated in the scraped text. Aim for 8-15+ results.
- ONLY use prices that are EXPLICITLY written in the scraped content. If you cannot find a specific number in the text, DO NOT include that retailer.
- NEVER estimate, guess, or infer a price. If the scraped content says "£83" or "50% off £165" → use £83 as the item_price.
- If a page shows both a sale price and original price, ALWAYS use the SALE / current price as item_price and set original_price to the higher original/RRP price.
- ONLY return results from actual retailers (e.g. Nike, JD Sports, Foot Locker, END., ASOS, Size?, Offspring, Schuh, Selfridges, Flannels, StockX, GOAT, etc.)
- NEVER include price comparison or aggregator sites (PriceSpy, Pricerunner, Idealo, Google Shopping, Kelkoo, etc.)
- Each result must link to a product page where the user can actually buy the item.
- The user is based in the UK. Convert all prices to GBP (£).
- For UK retailers, duties = £0 (VAT included). For non-UK retailers, estimate shipping + duties to UK.
- For trust_rating, use the retailer's Trustpilot score (1-5). Estimate if unknown.
- Always prefer UK versions of retailers (nike.com/gb, endclothing.com/gb, etc.)
- The retailer field must contain ONLY the store name (e.g. "Nike UK", "JD Sports", "END."). Do NOT include prices, fields, or metadata in the retailer name.
- If a page shows "SOLD OUT" or "OUT OF STOCK", do NOT include that retailer.`,
          },
          {
            role: "user",
            content: `Product: ${searchName}\n\nScraped retailer pages:\n${scrapedContent}\n\nExtract prices from direct retailers only. Exclude any comparison or aggregator sites.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_prices",
              description: "Extract structured price data from direct retailer pages only",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        retailer: { type: "string", description: "Direct retailer name (e.g. 'Nike UK', 'JD Sports', 'END.') — never a comparison site" },
                        country: { type: "string", description: "Country of retailer" },
                        flag: { type: "string", description: "Country flag emoji" },
                        item_price: { type: "number", description: "Item price in GBP" },
                        shipping: { type: "number", description: "Estimated shipping cost to UK in GBP" },
                        duties: { type: "number", description: "Import duties/VAT for UK delivery in GBP (£0 for UK retailers)" },
                        total: { type: "number", description: "Total you pay in GBP" },
                        delivery: { type: "string", description: "Estimated delivery time to UK" },
                        trust_rating: { type: "number", description: "Trustpilot rating 1-5" },
                        currency: { type: "string", description: "Original currency code" },
                        url: { type: "string", description: "Direct product page URL on retailer site" },
                        original_price: { type: "number", description: "Original/RRP price in GBP before discount, or null if not on sale", nullable: true },
                      },
                      required: ["retailer", "country", "flag", "item_price", "total", "url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_prices" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await aiResponse.text();
      console.error("AI error:", aiResponse.status, text);
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];


    const { results: aiRawResults = [] } = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : { results: [] };

    if (!toolCall?.function?.arguments) {
      console.warn("No AI tool-call output, using deterministic fallback extraction");
    }

    // Final filter: remove any comparison sites that slipped through
    const filtered = Array.isArray(aiRawResults)
      ? aiRawResults.filter((r: any) => !isComparisonSite(r.url || ""))
      : [];

    const mapped = filtered.map((r: any) => ({
      retailer: (r.retailer || "Unknown").replace(/[,:].*?(retailer|item_price|shipping|total|flag|country)[:\s]*/gi, "").trim(),
      country: r.country || "Unknown",
      flag: r.flag || "🌍",
      itemPrice: r.item_price,
      shipping: r.shipping || 0,
      duties: r.duties || 0,
      totalYouPay: r.total || r.item_price + (r.shipping || 0) + (r.duties || 0),
      originalPrice: r.original_price || null,
      delivery: r.delivery || "5-10 days",
      trustRating: r.trust_rating || 4.0,
      currency: r.currency || "GBP",
      url: r.url || "#",
    }));

    const fallbackMapped = buildFallbackResults(dedupedResults);

    // Merge AI + deterministic fallback, keep cheapest per retailer
    const mergedByRetailer = new Map<string, any>();
    for (const entry of [...mapped, ...fallbackMapped]) {
      const key = normalizeRetailerName(entry.retailer);
      if (!key) continue;
      const existing = mergedByRetailer.get(key);
      if (!existing || entry.totalYouPay < existing.totalYouPay) {
        mergedByRetailer.set(key, entry);
      }
    }

    const sorted = Array.from(mergedByRetailer.values())
      .sort((a: any, b: any) => a.totalYouPay - b.totalYouPay)
      .map((r: any, i: number) => ({ ...r, rank: i + 1 }));

    if (sorted.length < MIN_CACHE_RESULTS && cachedResults.length > sorted.length) {
      console.log(`Returning better stale cache for ${cacheKey}: ${cachedResults.length} > ${sorted.length}`);
      return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, stale: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sorted.length > 0) {
      // Save to cache (fire and forget)
      sb.from("price_cache")
        .upsert(
          { product_key: cacheKey, results: sorted, product_info: { product_name, retailers: normalizedRetailers } },
          { onConflict: "product_key" }
        )
        .then(({ error }) => { if (error) console.error("Cache write error:", error); });
    }

    return new Response(JSON.stringify({ success: true, results: sorted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    return new Response(JSON.stringify({ success: true, results: sorted }), {
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
