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

function isComparisonSite(url: string): boolean {
  const lower = url.toLowerCase();
  return EXCLUDED_DOMAINS.some(d => lower.includes(d));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, retailers } = await req.json();

    if (!product_name || !retailers?.length) {
      return new Response(JSON.stringify({ error: "product_name and retailers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);
    const cacheKey = product_name.toLowerCase().trim();

    const { data: cached } = await sb
      .from("price_cache")
      .select("results, created_at")
      .eq("product_key", cacheKey)
      .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (cached) {
      console.log("Cache hit for:", cacheKey);
      return new Response(JSON.stringify({ success: true, results: cached.results, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache miss for:", cacheKey);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Search each retailer individually for best results
    const doSearch = (query: string, limit: number) =>
      fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit,
          lang: "en",
          country: "gb",
          scrapeOptions: { formats: ["markdown"] },
        }),
      }).then(r => r.json()).catch(() => ({ data: [] }));

    // Run individual site: searches for each retailer (max 5 concurrent)
    const allResults: any[] = [];
    const seenUrls = new Set<string>();
    const CONCURRENCY = 5;

    for (let i = 0; i < retailers.length; i += CONCURRENCY) {
      const batch = retailers.slice(i, i + CONCURRENCY);
      const batchPromises = batch.map((retailer: string) =>
        doSearch(`${product_name} buy site:${retailer}`, 5)
      );

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        for (const item of (result.data || [])) {
          if (item.url && !seenUrls.has(item.url) && !isComparisonSite(item.url)) {
            seenUrls.add(item.url);
            allResults.push(item);
          }
        }
      }

      if (i + CONCURRENCY < retailers.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Broad fallback search to catch retailers not in the list
    const broadSearch = await doSearch(`${product_name} buy UK price GBP`, 10);
    for (const item of (broadSearch.data || [])) {
      if (item.url && !seenUrls.has(item.url) && !isComparisonSite(item.url)) {
        seenUrls.add(item.url);
        allResults.push(item);
      }
    }

    console.log(`Found ${allResults.length} direct retailer sources from ${retailers.length} retailers`);

    const scrapedContent = allResults
      .map((r: any, i: number) => `[Source ${i + 1}: ${r.url}]\n${r.markdown?.slice(0, 2000) || r.description || "No content"}`)
      .join("\n\n---\n\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a price extraction expert. Given scraped web content from DIRECT RETAILER websites, extract real prices.

CRITICAL RULES:
- ONLY return results from actual retailers that sell the product directly (e.g. Nike, JD Sports, Foot Locker, END., ASOS, Size?, Offspring, Schuh, etc.)
- NEVER include price comparison or aggregator sites (PriceSpy, Pricerunner, Idealo, Google Shopping, Kelkoo, etc.)
- Each result must link to a product page where the user can actually buy the item
- The user is based in the UK. Convert all prices to GBP (£).
- For UK retailers, duties = £0 (VAT included). For non-UK retailers, estimate shipping + duties to UK.
- For trust_rating, use the retailer's Trustpilot score (1-5). Estimate if unknown.
- Use ONLY actual prices found in the scraped content — do NOT invent prices.
- Always prefer UK versions of retailers (nike.com/gb, endclothing.com/gb, etc.)
- The retailer name should be the actual store name (e.g. "Nike UK", "JD Sports", "END."), NOT the comparison site name.`,
          },
          {
            role: "user",
            content: `Product: ${product_name}\n\nScraped retailer pages:\n${scrapedContent}\n\nExtract prices from direct retailers only. Exclude any comparison or aggregator sites.`,
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

    if (!toolCall?.function?.arguments) {
      throw new Error("No price extraction result");
    }

    const { results } = JSON.parse(toolCall.function.arguments);

    // Final filter: remove any comparison sites that slipped through
    const filtered = results.filter((r: any) => !isComparisonSite(r.url || ""));

    // Sort by total price ascending
    const sorted = filtered
      .map((r: any, i: number) => ({
        rank: i + 1,
        retailer: r.retailer,
        country: r.country || "Unknown",
        flag: r.flag || "🌍",
        itemPrice: r.item_price,
        shipping: r.shipping || 0,
        duties: r.duties || 0,
        totalYouPay: r.total || r.item_price + (r.shipping || 0) + (r.duties || 0),
        delivery: r.delivery || "5-10 days",
        trustRating: r.trust_rating || 4.0,
        currency: r.currency || "GBP",
        url: r.url || "#",
      }))
      .sort((a: any, b: any) => a.totalYouPay - b.totalYouPay)
      .map((r: any, i: number) => ({ ...r, rank: i + 1 }));

    // Save to cache (fire and forget)
    sb.from("price_cache")
      .upsert({ product_key: cacheKey, results: sorted, product_info: { product_name, retailers } }, { onConflict: "product_key" })
      .then(({ error }) => { if (error) console.error("Cache write error:", error); });

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
