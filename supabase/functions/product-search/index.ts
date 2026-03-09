import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEBUG = Deno.env.get("DEBUG") === "true";
const log = (...args: any[]) => { if (DEBUG) console.log(...args); };

// ─── Rate Limiter ────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

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
  // Cleanup old entries periodically
  if (rateLimits.size > 1000) {
    for (const [ip, e] of rateLimits) { if (now > e.resetAt) rateLimits.delete(ip); }
  }
  return null;
}

// Upgrade known CDN thumbnail URLs to full-size versions
function upgradeCdnUrl(url: string): string {
  // Nike: t_PDP_144_v1 → t_PDP_864_v1
  url = url.replace(/t_PDP_\d+_v\d+/i, "t_PDP_864_v1");
  // Adidas: w_60,h_60 → w_600,h_600
  url = url.replace(/w_\d{2,3},h_\d{2,3}/i, "w_600,h_600");
  // eBay: s-l140 → s-l960
  url = url.replace(/s-l\d{2,3}\./i, "s-l960.");
  return url;
}

serve(async (req) => {
  // corsHeaders is already a module-level const
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or empty request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { query, image } = body;

    // Input validation
    if (!query && !image) {
      return new Response(JSON.stringify({ error: "Query or image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (query !== undefined && typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Silently truncate long queries instead of rejecting
    const safeQuery = typeof query === "string" ? query.slice(0, 500) : query;
    if (image !== undefined && (typeof image !== "string" || image.length > 14_000_000)) {
      return new Response(JSON.stringify({ error: "image too large (max ~10MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("GEMINI_API_KEY not configured");

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
      text: safeQuery || "Identify this product from the image",
    });

    const aiPayload = JSON.stringify({
        model: "gemini-2.5-flash",
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

The user is based in the UK. You MUST return 25-30 retailers. Always prioritise UK retailers. Return plain domain names only (e.g. nike.com, not nike.com/gb).
Include a wide mix of:
- Brand official UK stores: nike.com, adidas.co.uk, newbalance.co.uk, asics.co.uk, puma.com, reebok.co.uk, converse.com, vans.co.uk, timberland.co.uk, drmartens.com, saucony.com, hoka.com, on-running.com
- UK high street: jdsports.co.uk, size.co.uk, footlocker.co.uk, schuh.co.uk, offspring.co.uk, flannels.com, selfridges.com, harveynichols.com, harrods.com, tessuti.co.uk, scottsmenswear.com, mainlinemenswear.co.uk, footpatrol.com, hanon-shop.com, sneakersnstuff.com
- UK online: endclothing.com, asos.com, zalando.co.uk, urbanoutfitters.com, matchesfashion.com, brownsfashion.com, stuartslondon.com, aphrodite1994.com, hipstore.com, woodhouseclothing.com, eightyeightstore.com, routeone.co.uk, urbanindustry.co.uk
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
      });

    // Retry with exponential backoff for Gemini 429s
    let response: Response | null = null;
    const MAX_RETRIES = 4;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: aiPayload,
      });

      if (response.status !== 429 || attempt === MAX_RETRIES) break;

      // Exponential backoff: 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt + 1) * 1000;
      log(`Gemini 429 — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
    }

    if (!response!.ok) {
      if (response!.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "AI service is busy. Please try again in a few seconds." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response!.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response!.text();
      console.error("AI error:", response!.status, text);
      throw new Error("AI gateway error");
    }

    const aiData = await response!.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No product identification result");
    }

    let product: any;
    try {
      product = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("AI returned malformed product data — please try again.");
    }

    // Use Gemini's suggested image URL if it's from a known official brand/retailer CDN
    const KNOWN_IMAGE_CDNS = /static\.nike\.com|assets\.adidas|nb\.scene7|asics\.com.*image|images\.asos|media\.jdsports|images\.footlocker|media\.schuh|images\.stockx|image\.goat|images\.zalando|offspring\.co\.uk.*image|size\.co\.uk.*image/i;
    if (product.image_url && KNOWN_IMAGE_CDNS.test(product.image_url)) {
      product.image_url = upgradeCdnUrl(product.image_url);
      log("Using AI-suggested CDN image:", product.image_url);
    } else {
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
