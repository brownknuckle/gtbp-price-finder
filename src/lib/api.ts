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

export async function scrapePrices(
  productName: string,
  retailers: string[]
): Promise<PriceResult[]> {
  const { data, error } = await supabase.functions.invoke("price-scrape", {
    body: { product_name: productName, retailers },
  });

  if (error) throw new Error(error.message || "Price scrape failed");
  if (!data?.success) throw new Error(data?.error || "Price scrape failed");
  return data.results;
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
