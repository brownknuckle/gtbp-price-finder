// GTBP Health Check — runs on a schedule, tests price-scrape on a known product,
// emails info@getthebestprice.co.uk via Resend if results are below threshold.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ALERT_TO = "info@getthebestprice.co.uk";
const ALERT_FROM = "alerts@getthebestprice.co.uk";
const MIN_RESULTS = 4;

// Known product to test against — Air Jordan 1 Retro High OG
const TEST_PRODUCT = {
  product_key: "air-jordan-1-retro-high-og",
  product_name: "Air Jordan 1 Retro High OG",
  estimated_retail_price: 169.95,
  category: "shoes",
  brand: "Jordan",
};

async function sendAlert(subject: string, body: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — cannot send alert");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ALERT_FROM,
      to: ALERT_TO,
      subject,
      html: `<p>${body.replace(/\n/g, "<br>")}</p>
             <p style="color:#888;font-size:12px">GTBP Health Check — getthebestprice.co.uk</p>`,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
  } else {
    console.log("Alert email sent to", ALERT_TO);
  }
}

serve(async (req) => {
  const start = Date.now();
  const url = new URL(req.url);
  const testMode = url.searchParams.get("test") === "true";
  console.log(`Health check starting${testMode ? " (TEST MODE)" : ""}...`);

  try {
    // Call price-scrape function with the test product
    const scrapeRes = await fetch(`${SUPABASE_URL}/functions/v1/price-scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        product_name: TEST_PRODUCT.product_name,
        estimated_retail_price: TEST_PRODUCT.estimated_retail_price,
        skip_cache: true,
        retailers: [
          "nike.com", "jdsports.co.uk", "footlocker.co.uk",
          "size.co.uk", "footasylum.com", "schuh.co.uk",
          "thesolesupplier.co.uk", "end.clothing",
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      await sendAlert(
        "🚨 GTBP Health Check FAILED — price-scrape error",
        `price-scrape returned status ${scrapeRes.status}.\n\nResponse: ${errText.slice(0, 500)}\n\nTime: ${new Date().toISOString()}`
      );
      return new Response(JSON.stringify({ ok: false, error: `status ${scrapeRes.status}` }), { status: 200 });
    }

    const data = await scrapeRes.json();
    const results = data?.results ?? [];
    const count = results.length;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`Health check: got ${count} results in ${elapsed}s`);

    const retailers = results.map((r: any) => `${r.retailer} £${r.itemPrice}`).join(", ") || "none";

    if (testMode) {
      await sendAlert(
        `✅ GTBP Health Check TEST — ${count} result${count === 1 ? "" : "s"} found`,
        `This is a TEST email to confirm alerts are working.\n\nPrice check for "${TEST_PRODUCT.product_name}" returned ${count} result${count === 1 ? "" : "s"}.\n\nRetailers found: ${retailers}\n\nIf you received this, alerts are working correctly.\n\nTime: ${new Date().toISOString()}\nDuration: ${elapsed}s`
      );
    } else if (count < MIN_RESULTS) {
      await sendAlert(
        `⚠️ GTBP Low Results — only ${count} retailer${count === 1 ? "" : "s"} found`,
        `Price check for "${TEST_PRODUCT.product_name}" returned only ${count} result${count === 1 ? "" : "s"} (minimum expected: ${MIN_RESULTS}).\n\nRetailers found: ${retailers}\n\nThis may mean the Google Shopping API had a poor run or scraping is degraded.\n\nTime: ${new Date().toISOString()}\nDuration: ${elapsed}s`
      );
    }

    return new Response(
      JSON.stringify({ ok: true, results: count, elapsed: `${elapsed}s`, belowThreshold: count < MIN_RESULTS }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("Health check error:", msg);
    await sendAlert(
      "🚨 GTBP Health Check FAILED — exception",
      `Health check threw an error:\n\n${msg}\n\nTime: ${new Date().toISOString()}`
    );
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 200 });
  }
});
