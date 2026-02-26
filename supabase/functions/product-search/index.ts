import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, image } = await req.json();
    if (!query && !image) {
      return new Response(JSON.stringify({ error: "Query or image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build messages array - include image if provided
    const userContent: any[] = [];
    if (image) {
      userContent.push({
        type: "image_url",
        image_url: { url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}` },
      });
    }
    userContent.push({
      type: "text",
      text: query || "Identify this product from the image",
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: image ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an expert product identification specialist for fashion, footwear, and streetwear.

Given a user query (product name, brand, SKU, URL, description) OR an IMAGE of a product, identify the EXACT product with maximum precision.

${image ? `## IMAGE IDENTIFICATION INSTRUCTIONS
You are receiving a product image. Apply these steps IN ORDER:
1. **Brand identification**: Look for logos, brand markings, tags, labels, embossed text on sole/tongue/heel
2. **Model identification**: Identify the EXACT model by examining:
   - Sole shape and pattern (e.g. waffle sole = Nike, GEL cushioning = ASICS)
   - Silhouette profile (high-top, low-top, runner, boot, etc.)
   - Panel construction and overlays
   - Lacing system style
   - Tongue shape and padding level
   - Heel counter design
   - Midsole technology visible features
3. **Colourway identification**: Describe the EXACT colourway by listing each colour visible on each part (upper, swoosh/logo, midsole, outsole, laces, tongue, heel tab). Match to official colourway names where possible (e.g. "Sport Red/White" not just "red and white")
4. **Season/Year**: If identifiable from details, note the release year or season
5. **Distinguishing features**: Note any special editions, collaborations, or unique details (e.g. "Big Bubble", "OG", "Retro", "SE", "Premium")

Be EXTREMELY specific. For example:
- GOOD: "Nike Air Max 1 '86 OG Big Bubble Sport Red/White-Black"
- BAD: "Nike Air Max red"
- GOOD: "New Balance 550 White/Green BB550WT1"
- BAD: "New Balance sneaker"
- GOOD: "adidas Samba OG Cloud White/Core Black/Clear Granite"
- BAD: "adidas Samba"` : ''}

Return ONLY valid JSON with this schema:
{
  "product_name": "Full product name including colourway",
  "brand": "Brand name",
  "category": "shoes" or "clothing" or "accessories",
  "search_queries": ["query1 to search retailers", "query2", "query3"],
  "retailers": ["retailer1.co.uk", "retailer2.co.uk", ...at least 25-30 retailers],
  "estimated_retail_price": 120,
  "confidence": 0.95,
  "identification_notes": "Brief explanation of how the product was identified",
  "suggestions": ["Similar product 1", "Similar product 2", "Similar product 3"],
  "image_url": "Direct URL to a high-quality product image from an official retailer or brand website (e.g. from nike.com, adidas.co.uk, newbalance.co.uk CDN). Must be a real, publicly accessible image URL ending in .jpg/.png/.webp or from a known CDN. Do NOT fabricate URLs."
}

The "confidence" field should be a number between 0 and 1 indicating how confident you are in the identification. If confidence < 0.7, still provide your best guess but note uncertainty in identification_notes.

The user is based in the UK. You MUST return 25-30 retailers. Always prioritise UK versions of retailers (e.g. nike.com/gb, adidas.co.uk, footlocker.co.uk, jdsports.co.uk, size.co.uk).
Include a wide mix of:
- Brand official UK stores: nike.com/gb, adidas.co.uk, newbalance.co.uk, asics.co.uk, puma.com/gb, reebok.co.uk, converse.com/uk, vans.co.uk, timberland.co.uk, drmartens.com, saucony.com/en-gb, hoka.com/en/gb, on-running.com/en-gb
- UK high street: jdsports.co.uk, size.co.uk, footlocker.co.uk, schuh.co.uk, offspring.co.uk, flannels.com, selfridges.com, harveynichols.com, harrods.com, tessuti.co.uk, scottsmenswear.com, mainlinemenswear.co.uk, footpatrol.com, hanon-shop.com, sneakersnstuff.com/en
- UK online: endclothing.com, asos.com, zalando.co.uk, urbanoutfitters.com/en-gb, matchesfashion.com, brownsfashion.com, stuartslondon.com, aphrodite1994.com, hipstore.com, woodhouseclothing.com, eightyeightstore.com, routeone.co.uk, urbanindustry.co.uk
- European: asphaltgold.com, solebox.com, bstn.com, overkillshop.com, allikestore.com, titolo.ch, suppa.de, sivasdescalzo.com, nakedcph.com, rezet.dk, kickz.com, courir.com, snipes.com, footshop.eu, basketzone.net
- Global resellers: stockx.com, goat.com, farfetch.com, ssense.com, mrporter.com, klekt.com, laced.co.uk, ebay.co.uk, depop.com, grailed.com
For suggestions, provide predictive autocomplete suggestions related to the query.`,
          },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_product",
              description: "Identify a product from a search query or image",
              parameters: {
                type: "object",
                properties: {
                  product_name: { type: "string", description: "Full product name including colourway" },
                  brand: { type: "string" },
                  category: { type: "string", enum: ["shoes", "clothing", "accessories"] },
                  search_queries: { type: "array", items: { type: "string" } },
                  retailers: { type: "array", items: { type: "string" }, minItems: 25, description: "25-30 retailers, prioritise UK (.co.uk) retailers first, then EU, then global" },
                  estimated_retail_price: { type: "number" },
                  confidence: { type: "number", description: "0-1 confidence score for identification accuracy" },
                  identification_notes: { type: "string", description: "Brief explanation of how the product was identified" },
                  suggestions: { type: "array", items: { type: "string" } },
                  image_url: { type: "string", description: "Direct URL to a real product image from an official retailer CDN (e.g. nike.com, adidas.co.uk). Must be publicly accessible. Do not fabricate." },
                },
                required: ["product_name", "brand", "category", "search_queries", "retailers", "estimated_retail_price", "confidence", "identification_notes", "suggestions", "image_url"],
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

    // ── Find a REAL product image via Firecrawl search ──
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (FIRECRAWL_API_KEY) {
      try {
        console.log("Searching for real product image for:", product.product_name);
        
        // Search specifically for official product images
        const imgController = new AbortController();
        const imgTimeout = setTimeout(() => imgController.abort(), 10000);
        const imgResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          signal: imgController.signal,
          body: JSON.stringify({
            query: `${product.product_name} official product photo`,
            limit: 10,
            lang: "en",
            country: "gb",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });
        clearTimeout(imgTimeout);

        if (!imgResp.ok) {
          console.error("Firecrawl image search HTTP error:", imgResp.status);
          product.image_url = "";
        } else {
          const imgData = await imgResp.json();
          console.log("Firecrawl image search returned", (imgData.data || []).length, "results");
          
          // Extract product name tokens for matching
          const nameTokens = product.product_name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
            .filter((t: string) => t.length > 2 && !["the","and","for","with","shoes","shoe","trainers"].includes(t));
          
          let bestImage = "";
          let bestScore = 0;

          for (const item of (imgData.data || [])) {
            const md = (item.markdown || "") + "\n" + (item.description || "") + "\n" + (item.title || "");
            const itemUrl = (item.url || "").toLowerCase();
            
            // Skip comparison/aggregator sites
            if (/lyst|shopstyle|pricespy|pricerunner|idealo/i.test(itemUrl)) continue;

            // Extract image URLs from markdown
            const imgMatches = [
              ...md.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)[^\s)]*)\)/gi),
              ...md.matchAll(/(https?:\/\/[^\s"'<>\]]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?)/gi),
            ];

            for (const match of imgMatches) {
              let imgUrl = match[1];
              if (!imgUrl) continue;
              // Clean up malformed URLs — truncate at first `)` or `]` that's part of markdown syntax
              imgUrl = imgUrl.replace(/[)\]]\(https?:\/\/.*$/, "").replace(/[)\]]$/, "");
              
              // Skip tiny icons, logos, favicons, tracking pixels
              if (/favicon|logo|icon|badge|sprite|1x1|pixel|\.gif|data:|analytics|tracking|avatar|profile|banner|header/i.test(imgUrl)) continue;
              // Skip very short URLs (likely not product images)
              if (imgUrl.length < 50) continue;
              // Skip generic site assets
              if (/volumental|most_feet|size-guide|fit-finder|delivery|returns|footer|nav/i.test(imgUrl)) continue;
              // Skip tiny thumbnails (eBay s-l96, s-l140, etc.)
              if (/s-l\d{2,3}\.|thumb|_thumb|_small|_tiny|width=1[0-4]\d|w_1[0-4]\d/i.test(imgUrl)) continue;
              
              // Score this image
              let score = 0;
              const imgUrlLower = imgUrl.toLowerCase();
              
              // Bonus for known CDNs
              if (/static\.nike\.com|images\.asos|i\.ebayimg|media\.jdsports|images\.footlocker|cdn\.|assets\.adidas|nb\.scene7|asics\.com.*image|cms-cdn\.thesolesupplier|images\.stockx|image\.goat/i.test(imgUrl)) score += 3;
              
              // Bonus for product-like paths
              if (/product|pdp|PDP|item|catalog/i.test(imgUrl)) score += 2;
              
              // Bonus for product name tokens appearing in the image URL or surrounding text
              const contextText = (md.slice(Math.max(0, md.indexOf(imgUrl) - 200), md.indexOf(imgUrl) + 200)).toLowerCase();
              const tokenMatches = nameTokens.filter((t: string) => imgUrlLower.includes(t) || contextText.includes(t));
              score += tokenMatches.length;
              
              // Bonus for large image indicators
              if (/w_600|w_800|w_1200|width=|large|hero|main|primary|_01_|standard/i.test(imgUrl)) score += 1;
              
              if (score > bestScore) {
                bestScore = score;
                bestImage = imgUrl;
              }
            }
          }

          if (bestImage && bestScore >= 2) {
            product.image_url = bestImage;
            console.log("Found real product image (score:", bestScore, "):", bestImage);
          } else {
            console.log("No confident product image found (best score:", bestScore, ")");
            // Only keep AI URL if from known CDN
            if (product.image_url && /static\.nike\.com|assets\.adidas|nb\.scene7|asics\.com.*image/i.test(product.image_url)) {
              console.log("Keeping AI-suggested CDN image:", product.image_url);
            } else {
              product.image_url = "";
            }
          }
        }
      } catch (e) {
        console.error("Image search failed:", e);
        product.image_url = "";
      }
    } else {
      console.log("FIRECRAWL_API_KEY not available for image search");
      product.image_url = "";
    }

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
