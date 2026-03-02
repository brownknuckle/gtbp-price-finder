import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock supabase before importing api module so the module picks it up
// ---------------------------------------------------------------------------
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { searchProduct, scrapePrices, fetchTrending } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const mockInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// searchProduct
// ---------------------------------------------------------------------------
describe("searchProduct", () => {
  it("returns product data on success", async () => {
    const product = {
      product_name: "Nike Cortez",
      brand: "Nike",
      category: "shoes",
      search_queries: [],
      retailers: [],
      estimated_retail_price: 90,
      confidence: 0.95,
      identification_notes: "",
      suggestions: [],
    };
    mockInvoke.mockResolvedValueOnce({ data: { success: true, product }, error: null });

    const result = await searchProduct("Nike Cortez");
    expect(result).toEqual(product);
  });

  it("throws when supabase returns an error", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: "Function error" } });
    await expect(searchProduct("anything")).rejects.toThrow("Function error");
  });

  it("throws when success flag is false", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { success: false, error: "Not found" }, error: null });
    await expect(searchProduct("unknown item")).rejects.toThrow("Not found");
  });

  it("throws a generic message when success is false and no error field", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { success: false }, error: null });
    await expect(searchProduct("x")).rejects.toThrow("Product search failed");
  });

  it("includes image in body when imageBase64 is provided", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, product: { product_name: "test" } },
      error: null,
    });
    await searchProduct("Nike Cortez", "base64data");
    expect(mockInvoke).toHaveBeenCalledWith("product-search", {
      body: { query: "Nike Cortez", image: "base64data" },
    });
  });
});

// ---------------------------------------------------------------------------
// scrapePrices
// ---------------------------------------------------------------------------
describe("scrapePrices", () => {
  it("returns results on success", async () => {
    const results = [{ retailer: "JD Sports", totalYouPay: 90 }];
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, results, cached: false, thirtyDayLow: 85 },
      error: null,
    });

    const resp = await scrapePrices("Nike Cortez", ["JD Sports"]);
    expect(resp.results).toEqual(results);
    expect(resp.cached).toBe(false);
    expect(resp.thirtyDayLow).toBe(85);
  });

  it("returns thirtyDayLow as null when not present", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, results: [], cached: false },
      error: null,
    });
    const resp = await scrapePrices("Nike Cortez", []);
    expect(resp.thirtyDayLow).toBeNull();
  });

  it("throws when supabase returns an error", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: "Scrape failed" } });
    await expect(scrapePrices("x", [])).rejects.toThrow("Scrape failed");
  });

  it("throws the service unavailable message when degraded and not successful", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, service_degraded: true, error: "Firecrawl down" },
      error: null,
    });
    await expect(scrapePrices("x", [])).rejects.toThrow("Firecrawl down");
  });

  it("still returns results when degraded but success=true (cached fallback)", async () => {
    const results = [{ retailer: "JD Sports", totalYouPay: 90 }];
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, service_degraded: true, results, cached: true, cached_at: "2026-03-01T00:00:00Z" },
      error: null,
    });
    const resp = await scrapePrices("x", []);
    expect(resp.results).toEqual(results);
    expect(resp.serviceDegraded).toBe(true);
    expect(resp.cached).toBe(true);
  });

  it("throws generic message when success is false and no error field", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { success: false }, error: null });
    await expect(scrapePrices("x", [])).rejects.toThrow("Price scrape failed");
  });

  // BUG: AbortController is created and given a 60 s timeout, but the
  // `signal` is never passed to supabase.functions.invoke().  The underlying
  // fetch therefore runs to completion regardless.  The AbortError branch in
  // the catch block can never be triggered by the internal timeout.
  it("BUG: AbortController signal is never wired — timeout cannot cancel the request", async () => {
    // We verify that invoke is called WITHOUT a signal, confirming the bug.
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, results: [], cached: false },
      error: null,
    });
    await scrapePrices("x", []);
    const callArgs = mockInvoke.mock.calls[0];
    // The second argument (options) should NOT contain a `signal` property
    // because the AbortController's signal is never forwarded.
    expect(callArgs[1]?.signal).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// fetchTrending
// ---------------------------------------------------------------------------
describe("fetchTrending", () => {
  it("returns trending items on success", async () => {
    const trending = [{ name: "Nike Air Max 1", category: "shoes", emoji: "👟" }];
    mockInvoke.mockResolvedValueOnce({ data: { success: true, trending }, error: null });
    const result = await fetchTrending();
    expect(result).toEqual(trending);
  });

  it("throws when success is false", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { success: false, error: "No data" }, error: null });
    await expect(fetchTrending()).rejects.toThrow("No data");
  });

  it("throws when supabase errors", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: "Edge fn error" } });
    await expect(fetchTrending()).rejects.toThrow("Edge fn error");
  });
});
