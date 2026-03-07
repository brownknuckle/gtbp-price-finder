import { supabase } from "@/integrations/supabase/client";

// ── Use Lovable Cloud for all edge functions ──

async function invokeFunction(name: string, body: Record<string, any>): Promise<any> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `Edge Function "${name}" failed`);
  return data;
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
  // Trending still uses Lovable's project (no CLI deploy needed — read-only)
  const { data, error } = await supabase.functions.invoke("trending");
  if (error) throw new Error(error.message || "Trending fetch failed");
  if (!data?.success) throw new Error(data?.error || "Trending fetch failed");
  return data.trending;
}
