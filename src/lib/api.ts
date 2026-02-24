import { supabase } from "@/integrations/supabase/client";

export interface ProductInfo {
  product_name: string;
  brand: string;
  category: "shoes" | "clothing" | "accessories";
  search_queries: string[];
  retailers: string[];
  estimated_retail_price: number;
  suggestions: string[];
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

export async function searchProduct(query: string): Promise<ProductInfo> {
  const { data, error } = await supabase.functions.invoke("product-search", {
    body: { query },
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
