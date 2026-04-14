import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_KEY = "__upcoming_releases__";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ─── Image helpers ──────────────────────────────────────────
const KNOWN_IMAGE_CDNS = /static\.nike\.com|assets\.adidas|nb\.scene7|images\.stockx|image\.goat|images\.asos|media\.jdsports|images\.footlocker|images\.zalando|endclothing\.com|selfridges\.com|cdn-images\.farfetch|puma\.com|hoka\.com|newbalance\.com|asics\.com|converse\.com|vans\.com|images\.ssense|images\.mrporter|cdn\.shopify|cdninstagram|photo\.goat|media\.karousell/i;

function looksLikeImage(url: string): boolean {
  return /^https:\/\/.{15,}\.(?:jpg|jpeg|png|webp)(?:[?#][^\s]*)?$/i.test(url);
}

// Fill missing images using Serper Image Search (1 credit per product, reliable CDN URLs)
async function fillMissingImages(items: any[], serperKey: string): Promise<void> {
  // Clear obviously hallucinated URLs: keep only URLs that look like real images
  items.forEach(item => {
    if (item.image_url && !looksLikeImage(item.image_url) && !KNOWN_IMAGE_CDNS.test(item.image_url)) {
      item.image_url = "";
    }
  });

  const needsImage = items.filter(i => !i.image_url);
  if (!needsImage.length || !serperKey) return;

  console.log(`Fetching images for ${needsImage.length} items via Serper…`);

  await Promise.all(
    needsImage.map(async (item) => {
      try {
        const r = await fetch("https://google.serper.dev/images", {
          method: "POST",
          headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: `${item.name} product image`, gl: "gb", hl: "en", num: 5 }),
          signal: AbortSignal.timeout(6000),
        });
        if (!r.ok) return;
        const data = await r.json();

        // Prefer known CDN images (most reliable, won't 404 due to hotlink protection)
        for (const img of (data.images || [])) {
          const url = img.imageUrl || "";
          if (url && KNOWN_IMAGE_CDNS.test(url)) {
            item.image_url = url;
            console.log(`CDN image for "${item.name}": ${url.slice(0, 80)}`);
            return;
          }
        }
        // Fallback: any valid image URL — the frontend onError handler covers broken images
        for (const img of (data.images || [])) {
          const url = img.imageUrl || "";
          if (url && looksLikeImage(url)) {
            item.image_url = url;
            console.log(`Fallback image for "${item.name}": ${url.slice(0, 80)}`);
            return;
          }
        }
      } catch { /* timeout */ }
    })
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await sb
      .from("price_cache")
      .select("results, created_at")
      .eq("product_key", CACHE_KEY)
      .gte("created_at", new Date(Date.now() - CACHE_TTL_MS).toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ success: true, releases: cached.results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY") || "";

    const today = new Date().toISOString().split("T")[0];

    // Search for upcoming releases via Firecrawl (snippet-only — no scrapeOptions)
    const searches = [
      `upcoming sneaker releases UK ${today} release dates`,
      "new trainer releases UK 2026 Nike Adidas Jordan New Balance ASICS",
      "upcoming streetwear drops UK Supreme Palace Stone Island Carhartt 2026",
      "upcoming shoe releases UK Salomon New Balance On Running Hoka 2026",
    ];

    const searchResults = await Promise.all(
      searches.map((query) =>
        fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 5, lang: "en", country: "gb" }),
          signal: AbortSignal.timeout(10000),
        }).then((r) => r.json()).catch(() => ({ data: [] }))
      )
    );

    const content = searchResults
      .flatMap((r) => (r.data || []).map((d: any) => d.description || d.markdown?.slice(0, 500) || ""))
      .filter(Boolean)
      .join("\n---\n");

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GEMINI_API_KEY}` },
        body: JSON.stringify({
          model: "gemini-2.5-flash-lite",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a UK sneaker and streetwear release calendar expert. Today is ${today}.

Extract upcoming product releases from the content below, or use your knowledge of confirmed upcoming UK releases.

Return ONLY valid JSON:
{
  "releases": [
    {
      "name": "Full product name including colourway",
      "brand": "Brand name",
      "category": "shoes" | "clothing" | "accessories",
      "releaseDate": "YYYY-MM-DD or null if unknown",
      "retailPrice": 120,
      "emoji": "👟",
      "searchQuery": "Optimised search query for this product"
    }
  ]
}

Rules:
- Include 20-25 releases
- Mix of shoes (at least 12) and clothing (at least 6)
- Prioritise UK-confirmed releases with known dates
- releaseDate must be today or in the future, or null if unconfirmed
- retailPrice in GBP (integer)
- searchQuery should be the best search term to find this product on GTBP
- REQUIRED brand coverage — must include items from at least 10 different brands
- Specific colourways only — no duplicates`,
            },
            {
              role: "user",
              content: content || `No fresh data — use your knowledge of confirmed upcoming UK releases for ${today} and beyond.`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) throw new Error("Gemini releases fetch failed");

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No releases result from Gemini");

    const { releases } = JSON.parse(jsonMatch[0]);

    // Fill images via Serper Image Search (1 credit per product — much cheaper than Firecrawl scraping)
    await fillMissingImages(releases, SERPER_API_KEY);

    // Cache results
    await sb.from("price_cache").upsert(
      { product_key: CACHE_KEY, results: releases, product_info: { type: "releases", updated: today } },
      { onConflict: "product_key" }
    );

    return new Response(JSON.stringify({ success: true, releases }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("releases error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
