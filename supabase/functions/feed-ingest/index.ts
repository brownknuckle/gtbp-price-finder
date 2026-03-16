// GTBP Feed Ingest — downloads AWIN product feeds and upserts into affiliate_products
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// AWIN feed column mappings — AWIN CSV headers vary slightly per merchant
// Standard AWIN product feed columns (adjust if a merchant uses different names)
const COL = {
  name: ["Product Name", "product_name", "Name", "name", "Title"],
  brand: ["Brand Name", "brand_name", "Brand", "brand", "Manufacturer"],
  price: ["Search Price", "search_price", "Price", "price", "Selling Price"],
  rrp: ["RRP", "rrp", "Was Price", "was_price"],
  url: ["Aw Deep Link", "aw_deep_link", "Deep Link", "deep_link", "URL", "url", "Product URL"],
  image: ["Merchant Image URL", "merchant_image_url", "Image URL", "image_url"],
  inStock: ["In Stock", "in_stock", "Stock", "stock", "Availability"],
  sku: ["Merchant Product ID", "merchant_product_id", "SKU", "sku", "Product ID"],
  category: ["Category Name", "category_name", "Category", "category"],
};

function pickCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(h => h.trim().toLowerCase() === c.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function parsePrice(raw: string): number | null {
  const n = parseFloat(raw.replace(/[£$€,\s]/g, ""));
  return isNaN(n) ? null : n;
}

function parseBool(raw: string): boolean | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "in stock", "instock"].includes(v)) return true;
  if (["0", "false", "no", "out of stock", "outofstock"].includes(v)) return false;
  return null;
}

// Parse AWIN CSV feed — returns array of row objects
async function parseAwinCsv(
  text: string,
  merchant: string,
): Promise<Record<string, any>[]> {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  // AWIN feeds use | as delimiter, but some use comma — detect
  const delim = lines[0].includes("|") ? "|" : ",";

  const headers = lines[0].split(delim).map(h => h.replace(/^"|"$/g, "").trim());

  const iName    = pickCol(headers, COL.name);
  const iBrand   = pickCol(headers, COL.brand);
  const iPrice   = pickCol(headers, COL.price);
  const iRrp     = pickCol(headers, COL.rrp);
  const iUrl     = pickCol(headers, COL.url);
  const iImage   = pickCol(headers, COL.image);
  const iStock   = pickCol(headers, COL.inStock);
  const iSku     = pickCol(headers, COL.sku);
  const iCat     = pickCol(headers, COL.category);

  if (iName === -1 || iUrl === -1 || iPrice === -1) {
    console.error(`[feed-ingest] Missing required columns for ${merchant}. Headers:`, headers.slice(0, 10));
    return [];
  }

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delim).map(c => c.replace(/^"|"$/g, "").trim());
    const price = parsePrice(cells[iPrice] || "");
    if (!price) continue;
    const url = cells[iUrl] || "";
    if (!url.startsWith("http")) continue;

    rows.push({
      merchant,
      product_name: cells[iName] || "",
      brand: iBrand !== -1 ? cells[iBrand] || "" : "",
      price,
      rrp: iRrp !== -1 ? parsePrice(cells[iRrp] || "") : null,
      currency: "GBP",
      deep_link: url,
      image_url: iImage !== -1 ? cells[iImage] || null : null,
      in_stock: iStock !== -1 ? parseBool(cells[iStock] || "") : null,
      sku: iSku !== -1 ? cells[iSku] || null : null,
      category: iCat !== -1 ? cells[iCat] || null : null,
      last_updated: new Date().toISOString(),
    });
  }
  return rows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { feeds } = await req.json() as {
      // Array of { merchant: string, url: string }
      feeds: Array<{ merchant: string; url: string }>;
    };

    if (!feeds?.length) {
      return new Response(JSON.stringify({ success: false, error: "No feeds provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const summary: Record<string, { upserted: number; error?: string }> = {};

    for (const feed of feeds) {
      try {
        const res = await fetch(feed.url, { headers: { "Accept-Encoding": "gzip" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = await parseAwinCsv(text, feed.merchant);

        if (!rows.length) {
          summary[feed.merchant] = { upserted: 0, error: "No parseable rows" };
          continue;
        }

        // Upsert in batches of 500
        let upserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await supabase
            .from("affiliate_products")
            .upsert(batch, { onConflict: "merchant,sku", ignoreDuplicates: false });
          if (error) throw error;
          upserted += batch.length;
        }
        summary[feed.merchant] = { upserted };
      } catch (err: any) {
        summary[feed.merchant] = { upserted: 0, error: err.message };
      }
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
