import { supabase } from "@/integrations/supabase/client";

// ── Direct function URLs — calls user's own Supabase project ──
// Functions deployed via CLI: npm run deploy
// DO NOT change this to supabase.functions.invoke() — Lovable's project is locked
const FUNCTIONS_URL = "https://jbftwbduusnjoufsotpq.supabase.co/functions/v1";
const FUNCTIONS_ANON_KEY = "sb_publishable_qgONrr7J4yppfmW3efk9IA_Q9kEX9ki";

async function invokeFunctionOnce(name: string, body: Record<string, any>, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FUNCTIONS_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = j?.error || j?.message || ""; } catch { try { detail = await res.text(); } catch {} }
      throw new Error(detail || `Request failed (${res.status})`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("timeout");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

async function invokeFunction(name: string, body: Record<string, any>): Promise<any> {
  const TIMEOUT = 60000;
  try {
    return await invokeFunctionOnce(name, body, TIMEOUT);
  } catch (e: any) {
    if (e.message === "timeout" || e.message?.includes("fetch") || e.message?.includes("network")) {
      try {
        return await invokeFunctionOnce(name, body, TIMEOUT);
      } catch (e2: any) {
        throw new Error(e2.message === "timeout" ? "Search timed out — please try again." : e2.message);
      }
    }
    throw e;
  }
}

export interface ProductInfo {
  product_name: string;
  brand: string;
  category: "shoes" | "clothing" | "accessories";
  search_queries: string[];
  retailers: string[];
  estimated_retail_price: number;
  confidence: number;
  identification_notes: string;
  suggestions: string[];
  image_url?: string;
}

export interface PriceResult {
  rank: number;
  retailer: string;
  country: string;
  flag: string;
  itemPrice: number;
  shipping: number;
  duties: number;
  totalYouPay: number;
  originalPrice: number | null;
  delivery: string;
  trustRating: number | null;
  currency: string;
  url: string;
  inStock?: boolean | null;
  checkedAt?: string;
  couponCode?: string | null;
  retailerTier?: "authorised" | "trusted" | "unverified";
  freeReturns?: boolean;
  priceConfidence?: "high" | "low" | null;
}

export async function searchProduct(query: string, imageBase64?: string): Promise<ProductInfo> {
  const body: Record<string, string> = { query };
  if (imageBase64) body.image = imageBase64;
  const data = await invokeFunction("product-search", body);
  if (!data?.success) throw new Error(data?.error || "Product search failed");
  return data.product;
}

export interface ScrapeResponse {
  results: PriceResult[];
  cached: boolean;
  cached_at?: string;
  thirtyDayLow?: number | null;
}

export async function scrapePrices(
  productName: string,
  retailers: string[],
  skipCache = false,
  estimatedRetailPrice?: number
): Promise<ScrapeResponse> {
  const data = await invokeFunction("price-scrape", {
    product_name: productName,
    retailers,
    skip_cache: skipCache,
    estimated_retail_price: estimatedRetailPrice,
  });
  if (!data?.success) throw new Error(data?.error || "Price scrape failed");
  return { results: data.results, cached: !!data.cached, cached_at: data.cached_at, thirtyDayLow: data.thirtyDayLow ?? null };
}

export interface TrendingItem {
  name: string;
  category: "shoes" | "clothing" | "accessories";
  emoji: string;
}

export async function fetchTrending(): Promise<TrendingItem[]> {
  const { data, error } = await supabase.functions.invoke("trending");
  if (error) throw new Error(error.message || "Trending fetch failed");
  if (!data?.success) throw new Error(data?.error || "Trending fetch failed");
  return data.trending;
}
