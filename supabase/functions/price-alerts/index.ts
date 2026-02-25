import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!resendKey) throw new Error("RESEND_API_KEY not configured");
    if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY not configured");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

    // Get all watchlist items grouped by user
    const { data: watchlistItems, error: wlError } = await sb
      .from("watchlist")
      .select("*")
      .not("best_price", "is", null);

    if (wlError) throw wlError;
    if (!watchlistItems?.length) {
      console.log("No watchlist items with prices to check");
      return new Response(JSON.stringify({ success: true, checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by unique product name to avoid duplicate searches
    const uniqueProducts = new Map<string, typeof watchlistItems>();
    for (const item of watchlistItems) {
      const key = item.product_name.toLowerCase().trim();
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, []);
      }
      uniqueProducts.get(key)!.push(item);
    }

    console.log(`Checking ${uniqueProducts.size} unique products for ${watchlistItems.length} watchlist entries`);

    let notificationsSent = 0;

    for (const [productKey, items] of uniqueProducts) {
      try {
        // Check cache first for recent price data
        const { data: cached } = await sb
          .from("price_cache")
          .select("results, created_at")
          .eq("product_key", productKey)
          .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        let currentBestPrice: number | null = null;

        if (cached?.results && Array.isArray(cached.results) && cached.results.length > 0) {
          // Use cached price data
          const cheapest = cached.results[0] as any;
          currentBestPrice = cheapest.totalYouPay || cheapest.total || null;
          console.log(`Cache hit for ${productKey}: £${currentBestPrice}`);
        } else {
          // Do a lightweight price check via Firecrawl search
          const searchResult = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `${items[0].product_name} buy price GBP £`,
              limit: 5,
              lang: "en",
              country: "gb",
              scrapeOptions: { formats: ["markdown"] },
            }),
          }).then((r) => r.json()).catch(() => ({ data: [] }));

          if (searchResult.data?.length) {
            const scrapedContent = searchResult.data
              .map((r: any, i: number) => `[Source ${i + 1}: ${r.url}]\n${r.markdown?.slice(0, 500) || r.description || ""}`)
              .join("\n---\n");

            // Quick price extraction via AI
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  {
                    role: "system",
                    content: "Extract the lowest price in GBP for the product from the scraped content. Return ONLY a JSON object: {\"lowest_price\": number} or {\"lowest_price\": null} if no price found.",
                  },
                  {
                    role: "user",
                    content: `Product: ${items[0].product_name}\n\n${scrapedContent}`,
                  },
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content || "";
              const match = content.match(/\{[^}]*"lowest_price"\s*:\s*(\d+\.?\d*)/);
              if (match) {
                currentBestPrice = parseFloat(match[1]);
                console.log(`Fresh price for ${productKey}: £${currentBestPrice}`);
              }
            }
          }
        }

        if (currentBestPrice === null) {
          console.log(`Could not determine price for ${productKey}, skipping`);
          continue;
        }

        // Check each user's watchlist entry for this product
        for (const item of items) {
          const previousPrice = Number(item.best_price);
          if (currentBestPrice < previousPrice) {
            const priceDrop = previousPrice - currentBestPrice;
            const percentDrop = Math.round((priceDrop / previousPrice) * 100);

            // Get user email
            const { data: userData } = await sb.auth.admin.getUserById(item.user_id);
            const userEmail = userData?.user?.email;

            if (userEmail) {
              console.log(`Price drop for ${item.product_name}: £${previousPrice} → £${currentBestPrice} (-${percentDrop}%). Emailing ${userEmail}`);

              await resend.emails.send({
                from: "GTBP Price Alerts <onboarding@resend.dev>",
                to: [userEmail],
                subject: `💰 Price Drop: ${item.product_name} now £${currentBestPrice.toFixed(2)} (-${percentDrop}%)`,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; padding: 32px;">
                    <h1 style="font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #1A3A6B; margin: 0 0 4px;">GTBP</h1>
                    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #999; margin: 0 0 24px;">Get The Best Price</p>
                    
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                      <p style="font-size: 13px; color: #16a34a; font-weight: 600; margin: 0 0 8px;">📉 Price Drop Detected!</p>
                      <h2 style="font-size: 18px; color: #111; margin: 0 0 12px;">${item.product_name}</h2>
                      <div style="display: flex; gap: 16px; align-items: baseline;">
                        <span style="font-size: 32px; font-weight: 800; color: #16a34a;">£${currentBestPrice.toFixed(2)}</span>
                        <span style="font-size: 16px; color: #999; text-decoration: line-through;">£${previousPrice.toFixed(2)}</span>
                        <span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">-${percentDrop}%</span>
                      </div>
                    </div>

                    <a href="https://id-preview--594d030a-3b52-45a2-9b9a-63596ba3610b.lovable.app/results?q=${encodeURIComponent(item.product_name)}" 
                       style="display: block; text-align: center; background: #1A3A6B; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                      Search Current Prices →
                    </a>
                    
                    <p style="font-size: 11px; color: #aaa; margin-top: 24px; text-align: center;">
                      You're receiving this because you saved this product on GTBP.
                    </p>
                  </div>
                `,
              });

              notificationsSent++;
            }

            // Update watchlist with new price
            await sb
              .from("watchlist")
              .update({ previous_price: previousPrice, best_price: currentBestPrice })
              .eq("id", item.id);
          } else if (currentBestPrice > previousPrice) {
            // Price went up — still update but don't email
            await sb
              .from("watchlist")
              .update({ previous_price: previousPrice, best_price: currentBestPrice })
              .eq("id", item.id);
          }
        }
      } catch (e) {
        console.error(`Error checking ${productKey}:`, e);
        // Continue with other products
      }
    }

    console.log(`Done. Sent ${notificationsSent} notifications.`);
    return new Response(
      JSON.stringify({ success: true, checked: uniqueProducts.size, notifications: notificationsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("price-alerts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
