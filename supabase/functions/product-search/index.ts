import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use AI to identify the product and suggest search terms
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a product identification expert for fashion and footwear.
Given a user query (which could be a product name, brand, SKU, URL, or description), identify the product and return structured JSON.

Return ONLY valid JSON with this schema:
{
  "product_name": "Full product name",
  "brand": "Brand name",
  "category": "shoes" or "clothing" or "accessories",
  "search_queries": ["query1 to search retailers", "query2", "query3"],
  "retailers": ["retailer1.co.uk", "retailer2.co.uk", "retailer3.com", ...at least 25-30 retailers],
  "estimated_retail_price": 120,
  "suggestions": ["Similar product 1", "Similar product 2", "Similar product 3"]
}

The user is based in the UK. You MUST return 25-30 retailers. Always prioritise UK versions of retailers (e.g. nike.com/gb, adidas.co.uk, footlocker.co.uk, jdsports.co.uk, size.co.uk).
Include a wide mix of:
- Brand official UK stores: nike.com/gb, adidas.co.uk, newbalance.co.uk, asics.co.uk, puma.com/gb, reebok.co.uk, converse.com/uk, vans.co.uk, timberland.co.uk, drmartens.com, saucony.com/en-gb, hoka.com/en/gb, on-running.com/en-gb
- UK high street: jdsports.co.uk, size.co.uk, footlocker.co.uk, schuh.co.uk, offspring.co.uk, flannels.com, selfridges.com, harveynichols.com, harrods.com, tessuti.co.uk, scottsmenswear.com, mainlinemenswear.co.uk, footpatrol.com, hanon-shop.com, sneakersnstuff.com/en
- UK online: endclothing.com, asos.com, zalando.co.uk, urbanoutfitters.com/en-gb, matchesfashion.com, brownsfashion.com, stuartslondon.com, aphrodite1994.com, hipstore.com, woodhouseclothing.com, eightyeightstore.com, routeone.co.uk, urbanindustry.co.uk
- European: asphaltgold.com, solebox.com, bstn.com, overkillshop.com, allikestore.com, titolo.ch, suppa.de, sivasdescalzo.com, nakedcph.com, rezet.dk, kickz.com, courir.com, snipes.com, footshop.eu, basketzone.net
- Global resellers: stockx.com, goat.com, farfetch.com, ssense.com, mrporter.com, klekt.com, laced.co.uk, ebay.co.uk, depop.com, grailed.com
For suggestions, provide predictive autocomplete suggestions related to the query.`,
          },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_product",
              description: "Identify a product from a search query",
              parameters: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  brand: { type: "string" },
                  category: { type: "string", enum: ["shoes", "clothing", "accessories"] },
                  search_queries: { type: "array", items: { type: "string" } },
                  retailers: { type: "array", items: { type: "string" }, minItems: 25, description: "25-30 retailers, prioritise UK (.co.uk) retailers first, then EU, then global" },
                  estimated_retail_price: { type: "number" },
                  suggestions: { type: "array", items: { type: "string" } },
                },
                required: ["product_name", "brand", "category", "search_queries", "retailers", "estimated_retail_price", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_product" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No product identification result");
    }

    const product = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, product }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("product-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
