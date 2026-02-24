import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use Firecrawl search to find prices across retailers
    const searchQuery = `${product_name} buy price`;
    
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 10,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error("Firecrawl error:", firecrawlData);
      throw new Error("Firecrawl search failed");
    }

    // Use AI to extract structured price data from the scraped results
    const scrapedContent = (firecrawlData.data || [])
      .map((r: any, i: number) => `[Source ${i + 1}: ${r.url}]\n${r.markdown?.slice(0, 1500) || r.description || "No content"}`)
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
            content: `You are a price extraction expert. Given scraped web content about a product, extract real retailer prices.

Extract prices from the content and return structured data. Only include results where you found an actual price.
The user is based in the UK. Convert all prices to GBP (£). Estimate shipping to a UK address and import duties/VAT where applicable (non-UK retailers).
For trust_rating, use the retailer's Trustpilot score (1-5 scale). If you don't know the exact score, estimate based on general Trustpilot reputation.
Use the actual prices found in the scraped content - do NOT make up prices.`,
          },
          {
            role: "user",
            content: `Product: ${product_name}\n\nScraped content:\n${scrapedContent}\n\nExtract all prices found for this product.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_prices",
              description: "Extract structured price data from scraped content",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        retailer: { type: "string", description: "Retailer name" },
                        country: { type: "string", description: "Country of retailer" },
                        flag: { type: "string", description: "Country flag emoji" },
                        item_price: { type: "number", description: "Item price in GBP" },
                        shipping: { type: "number", description: "Estimated shipping cost" },
                        duties: { type: "number", description: "Estimated import duties/VAT for UK delivery" },
                        total: { type: "number", description: "Total you pay" },
                        delivery: { type: "string", description: "Estimated delivery time" },
                        trust_rating: { type: "number", description: "Trustpilot rating 1-5" },
                        currency: { type: "string", description: "Original currency code" },
                        url: { type: "string", description: "URL to buy" },
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

    // Sort by total price ascending
    const sorted = results
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
