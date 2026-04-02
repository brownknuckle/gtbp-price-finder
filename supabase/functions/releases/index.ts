import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_KEY = "__upcoming_releases__";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(req: Request): Response | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 20) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    entry.count++;
  } else {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
  }
  return null;
}

// ─── Image helpers ──────────────────────────────────────────
const KNOWN_IMAGE_CDNS = /static\.nike\.com|assets\.adidas|nb\.scene7|images\.stockx|image\.goat|images\.asos|media\.jdsports|images\.footlocker|images\.zalando|endclothing\.com|selfridges\.com|cdn-images\.farfetch|puma\.com|hoka\.com|newbalance\.com|asics\.com|converse\.com|vans\.com|images\.ssense|images\.mrporter/i;

function looksLikeImage(url: string): boolean {
  return /^https:\/\/.{15,}\.(?:jpg|jpeg|png|webp)(?:[?#][^\s]*)?$/i.test(url) || KNOWN_IMAGE_CDNS.test(url);
}

function upgradeCdnUrl(url: string): string {
  url = url.replace(/t_PDP_\d+_v\d+/i, "t_PDP_864_v1");
  url = url.replace(/w_\d{2,3},h_\d{2,3}/i, "w_600,h_600");
  url = url.replace(/s-l\d{2,3}\./i, "s-l960.");
  return url;
}

async function fetchImageForProduct(name: string, apiKey: string): Promise<string> {
  const trySearch = async (body: object): Promise<string> => {
    try {
      const r = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const data = await r.json();
      for (const item of (data.data || [])) {
        const ogImage = item.metadata?.ogImage || item.metadata?.og_image || "";
        if (ogImage && looksLikeImage(ogImage)) return upgradeCdnUrl(ogImage);
        for (const mdMatch of (item.markdown || "").matchAll(/https?:\/\/[^\s"')]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"')\]>]*)?/gi)) {
          if (looksLikeImage(mdMatch[0])) return upgradeCdnUrl(mdMatch[0]);
        }
      }
    } catch { /* timeout or error — silent */ }
    return "";
  };

  const img = await trySearch({
    query: name, limit: 3, lang: "en", country: "gb",
    includeDomains: ["stockx.com", "goat.com"],
  });
  if (img) return img;

  return trySearch({
    query: `${name} buy`, limit: 3, lang: "en", country: "gb",
    includeDomains: ["nike.com", "adidas.co.uk", "newbalance.co.uk", "size.co.uk", "jdsports.co.uk", "endclothing.com"],
  });
}

async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000), redirect: "follow" });
    if (!r.ok) return false;
    const ct = r.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return false;
    // Reject tiny placeholders (< 5KB usually means a placeholder or error image)
    const cl = parseInt(r.headers.get("content-length") || "0", 10);
    if (cl > 0 && cl < 5000) return false;
    return true;
  } catch {
    return false;
  }
}

async function fillMissingImages(items: any[], apiKey: string): Promise<void> {
  // First: validate all AI-generated image URLs with HEAD requests
  console.log(`Validating ${items.length} image URLs…`);
  await Promise.all(
    items.map(async (item) => {
      if (item.image_url && looksLikeImage(item.image_url)) {
        const valid = await verifyImageUrl(item.image_url);
        if (!valid) {
          console.log(`Invalid image URL for "${item.name}": ${item.image_url}`);
          item.image_url = "";
        }
      }
    })
  );

  // Then: fetch images via Firecrawl for any items still missing
  const needsImage = items.filter(i => !i.image_url || !looksLikeImage(i.image_url));
  if (needsImage.length === 0) return;

  const batch = needsImage.slice(0, 15);
  console.log(`Fetching images for ${batch.length} items via Firecrawl…`);
  await Promise.all(
    batch.map(async (item) => {
      const url = await fetchImageForProduct(item.name, apiKey);
      if (url) item.image_url = url;
    })
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

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

    const today = new Date().toISOString().split("T")[0];

    // Search for upcoming releases
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
      "searchQuery": "Optimised search query for this product",
      "image_url": "Direct URL to a real product image from a known CDN"
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
- REQUIRED brand coverage — must include items from at least 10 different brands spanning:
  FOOTWEAR: Nike, Air Jordan, Adidas, New Balance, ASICS, Salomon, On Running, Hoka, Reebok, Converse, Vans, Timberland, Dr. Martens, Saucony, Brooks, Mizuno
  STREETWEAR: Supreme, Palace, Stone Island, Carhartt WIP, Stussy, A Bathing Ape, Off-White, Fear of God, Represent, Trapstar, CP Company, Arc'teryx, The North Face, Corteiz, Kith
  LUXURY/SPORT: Loewe, Moncler, Canada Goose, Salehe Bembury, Bodega, Concepts
- Specific colourways only — never vague entries like "Nike Dunk various colourways"
- Each item must have a distinct name/colourway — no duplicates
- image_url: provide a REAL, publicly accessible product image URL from a known retailer CDN (e.g. static.nike.com, assets.adidas.com, nb.scene7.com, images.stockx.com). Must be a direct .jpg/.png/.webp link. Do NOT fabricate URLs.`,
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

    // Fill missing images via Firecrawl (parallel, capped at 10)
    await fillMissingImages(releases, FIRECRAWL_API_KEY);

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
