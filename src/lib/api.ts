import { supabase } from "@/integrations/supabase/client";

// IMPORTANT: functions are deployed to our own Supabase project, not Lovable's.
// Do NOT change this to supabase.functions.invoke() — that calls the wrong project.
const GTBP_URL = "https://jbftwbduusnjoufsotpq.supabase.co";
const GTBP_ANON_KEY = "sb_publishable_qgONrr7J4yppfmW3efk9IA_Q9kEX9ki";

async function invokeFunction(name: string, body: Record<string, any>): Promise<any> {
  const res = await fetch(`${GTBP_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GTBP_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${name} failed (${res.status})`);
  }
  return res.json();
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

export interface PriceHistoryPoint {
  date: string;   // YYYY-MM-DD
  price: number;  // best total price on that day
}

export interface ScrapeResponse {
  results: PriceResult[];
  cached: boolean;
  cached_at?: string;
  thirtyDayLow?: number | null;
  priceHistory?: PriceHistoryPoint[];
}

export async function scrapePrices(
  productName: string,
  retailers: string[],
  skipCache = false,
  estimatedRetailPrice?: number,
): Promise<ScrapeResponse> {
  const data = await invokeFunction("price-scrape", {
    product_name: productName,
    retailers,
    skip_cache: skipCache,
    estimated_retail_price: estimatedRetailPrice,
  });
  if (!data?.success) throw new Error(data?.error || "Price scrape failed");
  return {
    results: data.results,
    cached: !!data.cached,
    cached_at: data.cached_at,
    thirtyDayLow: data.thirtyDayLow ?? null,
    priceHistory: data.priceHistory ?? [],
  };
}

export interface TrendingItem {
  name: string;
  category: "shoes" | "clothing" | "accessories";
  emoji: string;
}

export async function fetchTrending(): Promise<TrendingItem[]> {
  const data = await invokeFunction("trending", {});
  if (!data?.success) throw new Error(data?.error || "Trending fetch failed");
  return data.trending;
}
