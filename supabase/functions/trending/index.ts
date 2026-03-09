import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEBUG = Deno.env.get("DEBUG") === "true";

const log = (...args: any[]) => { if (DEBUG) console.log(...args); };
const CACHE_KEY = "__trending_items__";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── Rate Limiter ────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15; // 15 requests per minute per IP

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

serve(async (req) => {
  // corsHeaders is already a module-level const
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
      log("Trending cache hit");
      return new Response(JSON.stringify({ success: true, trending: cached.results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Trending cache miss — fetching fresh data");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Search for current trending items
    const searches = [
      "trending sneakers UK 2026 most popular shoes right now",
      "trending streetwear clothing UK 2026 most popular fashion",
      "most searched trainers UK this week hypebeast",
    ];

    const searchResults = await Promise.all(
      searches.map((query) =>
        fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 5, lang: "en", country: "gb" }),
        }).then((r) => r.json()).catch(() => ({ data: [] }))
      )
    );

    const content = searchResults
      .flatMap((r) => (r.data || []).map((d: any) => d.description || d.markdown?.slice(0, 400) || ""))
      .filter(Boolean)
      .join("\n---\n");

    // Use Gemini to extract trending items
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `You are a UK fashion & sneaker trend analyst. Based on the trend data below, identify the TOP 8 most trending fashion/footwear products in the UK right now.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"items":[{"name":"Nike Air Max Dn","category":"shoes","emoji":"👟"},{"name":"Stone Island Patch Crewneck","category":"clothing","emoji":"🧥"}]}

Rules:
- Mix of shoes AND clothing/accessories
- Specific searchable product names (brand + model + colourway)
- category must be exactly: "shoes", "clothing", or "accessories"
- emoji must be a single emoji
- 8 items total

Trend data:
${content}` }],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, text);
      throw new Error("AI trending extraction failed");
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No trending result from Gemini");

    const { items } = JSON.parse(jsonMatch[0]);

    // Cache results
    await sb.from("price_cache").upsert(
      { product_key: CACHE_KEY, results: items, product_info: { type: "trending", updated: new Date().toISOString() } },
      { onConflict: "product_key" }
    );

    log(`Cached ${items.length} trending items`);

    return new Response(JSON.stringify({ success: true, trending: items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trending error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
