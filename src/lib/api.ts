import { supabase } from "@/integrations/supabase/client";

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
  trustRating: number;
  currency: string;
  url: string;
}

export async function searchProduct(query: string, imageBase64?: string): Promise<ProductInfo> {
  const body: Record<string, string> = { query };
  if (imageBase64) body.image = imageBase64;

  const { data, error } = await supabase.functions.invoke("product-search", {
    body,
  });

  if (error) throw new Error(error.message || "Product search failed");
  if (!data?.success) throw new Error(data?.error || "Product search failed");
  return data.product;
}

export interface ScrapeResponse {
  results: PriceResult[];
  cached: boolean;
  cached_at?: string;
}

export async function scrapePrices(
  productName: string,
  retailers: string[],
  skipCache = false,
  estimatedRetailPrice?: number
): Promise<ScrapeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const { data, error } = await supabase.functions.invoke("price-scrape", {
      body: { product_name: productName, retailers, skip_cache: skipCache, estimated_retail_price: estimatedRetailPrice },
    });

    if (error) throw new Error(error.message || "Price scrape failed");
    if (!data?.success) throw new Error(data?.error || "Price scrape failed");
    return { results: data.results, cached: !!data.cached, cached_at: data.cached_at };
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Search timed out. Please try again.");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
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
