import nikeCortezImg from "@/assets/nike-cortez.png";
import nikeAirmax1Img from "@/assets/nike-airmax1.png";
import nb550Img from "@/assets/nb-550.png";
import adidasSambaImg from "@/assets/adidas-samba.png";
import stoneIslandImg from "@/assets/stone-island.png";
import asicsKayanoImg from "@/assets/asics-kayano.png";
import nikeP6000Img from "@/assets/nike-p6000.png";

export const productImages = {
  cortez: nikeCortezImg,
  airmax1: nikeAirmax1Img,
  nb550: nb550Img,
  samba: adidasSambaImg,
  stoneIsland: stoneIslandImg,
  asicsKayano: asicsKayanoImg,
  p6000: nikeP6000Img,
};

export interface Product {
  key: string;
  name: string;
  subtitle: string;
  image: string;
}

export const products: Record<string, Product> = {
  cortez: { key: "cortez", name: "Nike Cortez", subtitle: "White/Black — Men's Size 10", image: nikeCortezImg },
  p6000: { key: "p6000", name: "Nike P-6000", subtitle: "Metallic Silver — Men's Size 10", image: nikeP6000Img },
  airmax1: { key: "airmax1", name: "Nike Air Max 1 '86 OG", subtitle: "Men's Size 10", image: nikeAirmax1Img },
  nb550: { key: "nb550", name: "New Balance 550", subtitle: "White Green — Men's Size 10", image: nb550Img },
  samba: { key: "samba", name: "Adidas Samba OG", subtitle: "Black — Men's Size 10", image: adidasSambaImg },
  stoneIsland: { key: "stoneIsland", name: "Stone Island Soft Shell Jacket", subtitle: "Size L", image: stoneIslandImg },
  asicsKayano: { key: "asicsKayano", name: "ASICS Gel-Kayano 14", subtitle: "Men's Size 10", image: asicsKayanoImg },
};

/** Detect product from search query or URL */
export function detectProduct(query: string): Product {
  const q = query.toLowerCase();
  if (q.includes("p-6000") || q.includes("p6000") || q.includes("IQ0577") || q.includes("iq0577")) return products.p6000;
  if (q.includes("air max") || q.includes("airmax")) return products.airmax1;
  if (q.includes("550") || q.includes("new balance")) return products.nb550;
  if (q.includes("samba") || q.includes("adidas")) return products.samba;
  if (q.includes("stone island")) return products.stoneIsland;
  if (q.includes("kayano") || q.includes("asics")) return products.asicsKayano;
  return products.cortez;
}

export const trendingSearches = [
  "Nike Air Max 1",
  "New Balance 550",
  "Stone Island Jacket",
  "Adidas Samba",
];

export type SizeRegion = "US" | "UK" | "EU";

export const shoeSizes: Record<SizeRegion, string[]> = {
  US: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14", "15"],
  UK: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13", "14"],
  EU: ["38.5", "39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "45.5", "46", "47.5", "48.5", "49.5"],
};

export const sizeOptions = {
  clothing: ["XS", "S", "M", "L", "XL"],
  shoes: shoeSizes.UK, // default
};

export interface RetailerResult {
  rank: number;
  retailer: string;
  country: string;
  flag: string;
  itemPrice: number;
  shipping: number;
  duties: number;
  totalYouPay: number;
  delivery: string;
  trustRating: number;
  currency: string;
}

export const searchResults: RetailerResult[] = [
  { rank: 1, retailer: "Sneaker District", country: "Netherlands", flag: "🇳🇱", itemPrice: 89.99, shipping: 8.50, duties: 0, totalYouPay: 98.49, delivery: "3–5 days", trustRating: 4.8, currency: "EUR" },
  { rank: 2, retailer: "Foot Locker US", country: "United States", flag: "🇺🇸", itemPrice: 94.99, shipping: 0, duties: 12.50, totalYouPay: 107.49, delivery: "5–7 days", trustRating: 4.6, currency: "USD" },
  { rank: 3, retailer: "JD Sports", country: "United Kingdom", flag: "🇬🇧", itemPrice: 84.99, shipping: 14.99, duties: 9.80, totalYouPay: 109.78, delivery: "4–6 days", trustRating: 4.5, currency: "GBP" },
  { rank: 4, retailer: "Zalando", country: "Germany", flag: "🇩🇪", itemPrice: 99.95, shipping: 5.95, duties: 6.00, totalYouPay: 111.90, delivery: "5–8 days", trustRating: 4.3, currency: "EUR" },
  { rank: 5, retailer: "Atmos Tokyo", country: "Japan", flag: "🇯🇵", itemPrice: 85.00, shipping: 22.00, duties: 15.50, totalYouPay: 122.50, delivery: "7–12 days", trustRating: 4.1, currency: "JPY" },
];

export interface WatchlistItem {
  id: string;
  name: string;
  image: string;
  currentBestPrice: number;
  previousPrice: number;
  priceChange: "up" | "down" | "same";
  alertEnabled: boolean;
}

export const watchlistItems: WatchlistItem[] = [
  { id: "1", name: "Nike Air Max 1 '86 OG", image: nikeAirmax1Img, currentBestPrice: 134.99, previousPrice: 149.99, priceChange: "down", alertEnabled: true },
  { id: "2", name: "New Balance 550 White Green", image: nb550Img, currentBestPrice: 112.00, previousPrice: 109.00, priceChange: "up", alertEnabled: false },
  { id: "3", name: "Adidas Samba OG Black", image: adidasSambaImg, currentBestPrice: 98.49, previousPrice: 98.49, priceChange: "same", alertEnabled: true },
  { id: "4", name: "Stone Island Soft Shell Jacket", image: stoneIslandImg, currentBestPrice: 445.00, previousPrice: 520.00, priceChange: "down", alertEnabled: false },
  { id: "5", name: "Nike Cortez White/Black", image: nikeCortezImg, currentBestPrice: 98.49, previousPrice: 105.00, priceChange: "down", alertEnabled: true },
  { id: "6", name: "ASICS Gel-Kayano 14", image: asicsKayanoImg, currentBestPrice: 155.00, previousPrice: 142.00, priceChange: "up", alertEnabled: false },
];

export const priceHistoryData = [
  { date: "Nov 25", price: 115 },
  { date: "Dec 2", price: 112 },
  { date: "Dec 9", price: 118 },
  { date: "Dec 16", price: 110 },
  { date: "Dec 23", price: 105 },
  { date: "Dec 30", price: 108 },
  { date: "Jan 6", price: 102 },
  { date: "Jan 13", price: 99 },
  { date: "Jan 20", price: 104 },
  { date: "Jan 27", price: 101 },
  { date: "Feb 3", price: 98 },
  { date: "Feb 10", price: 99 },
  { date: "Feb 17", price: 98.49 },
];
