import { describe, it, expect } from "vitest";
import type { PriceResult } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers extracted from Results.tsx for isolated testing
// These mirror the exact inline implementations in src/pages/Results.tsx
// ---------------------------------------------------------------------------

function formatCheckedTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

function parseDelivery(d: string): number {
  const m = d.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

const DOMESTIC_COUNTRIES = ["UK", "United Kingdom", "GB"];

function isDomestic(r: Pick<PriceResult, "country" | "flag">): boolean {
  return DOMESTIC_COUNTRIES.some((c) => r.country?.toLowerCase() === c.toLowerCase()) || r.flag === "🇬🇧";
}

function sortResults(results: PriceResult[], sortBy: "price" | "delivery" | "trust"): PriceResult[] {
  return [...results].sort((a, b) => {
    if (sortBy === "price") return a.totalYouPay - b.totalYouPay;
    if (sortBy === "delivery") return parseDelivery(a.delivery) - parseDelivery(b.delivery);
    if (sortBy === "trust") return b.trustRating - a.trustRating;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// formatCheckedTime
// ---------------------------------------------------------------------------
describe("formatCheckedTime", () => {
  // BUG: formatCheckedTime uses Math.round instead of Math.floor.
  // Math.round(30s / 60s) = Math.round(0.5) = 1, so timestamps that are
  // only 30 seconds old are displayed as "1m ago" instead of "just now".
  // The threshold for "just now" is effectively < 30 seconds, not < 1 minute.
  it("BUG: 30s-old timestamp shown as '1m ago' instead of 'just now' (Math.round rounding)", () => {
    const iso = new Date(Date.now() - 30_000).toISOString();
    // Correct expectation (would pass if Math.floor were used):
    //   expect(formatCheckedTime(iso)).toBe("just now");
    // Actual buggy output:
    expect(formatCheckedTime(iso)).toBe("1m ago");
  });

  it("returns 'just now' for timestamps under 30 seconds old", () => {
    const iso = new Date(Date.now() - 15_000).toISOString(); // 15 s ago
    expect(formatCheckedTime(iso)).toBe("just now");
  });

  it("returns minutes for timestamps 1–59 minutes old", () => {
    const iso = new Date(Date.now() - 35 * 60_000).toISOString();
    expect(formatCheckedTime(iso)).toBe("35m ago");
  });

  it("returns hours for timestamps 60+ minutes old", () => {
    const iso = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatCheckedTime(iso)).toBe("3h ago");
  });

  it("returns '1m ago' at exactly 1 minute", () => {
    const iso = new Date(Date.now() - 60_000).toISOString();
    expect(formatCheckedTime(iso)).toBe("1m ago");
  });
});

// ---------------------------------------------------------------------------
// parseDelivery
// ---------------------------------------------------------------------------
describe("parseDelivery", () => {
  it("parses standard range '3-5 days'", () => {
    expect(parseDelivery("3-5 days")).toBe(3);
  });

  it("parses range with en-dash '2–4 days'", () => {
    expect(parseDelivery("2–4 days")).toBe(2);
  });

  it("returns 999 for non-numeric delivery strings", () => {
    expect(parseDelivery("Express")).toBe(999);
    expect(parseDelivery("TBC")).toBe(999);
  });

  it("handles single-day delivery", () => {
    expect(parseDelivery("1 day")).toBe(1);
  });

  it("handles 'Next day delivery' as 999 (no leading digit)", () => {
    // 'Next' has no digit → 999
    expect(parseDelivery("Next day delivery")).toBe(999);
  });
});

// ---------------------------------------------------------------------------
// isDomestic filter
// ---------------------------------------------------------------------------
describe("isDomestic", () => {
  it("matches 'United Kingdom'", () => {
    expect(isDomestic({ country: "United Kingdom", flag: "🇺🇸" })).toBe(true);
  });

  it("matches 'UK' (case-insensitive)", () => {
    expect(isDomestic({ country: "uk", flag: "🇺🇸" })).toBe(true);
  });

  it("matches via 🇬🇧 flag even when country name differs", () => {
    expect(isDomestic({ country: "Great Britain", flag: "🇬🇧" })).toBe(true);
  });

  it("does not match US retailer", () => {
    expect(isDomestic({ country: "United States", flag: "🇺🇸" })).toBe(false);
  });

  it("does not match EU retailer", () => {
    expect(isDomestic({ country: "Germany", flag: "🇩🇪" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sortResults
// ---------------------------------------------------------------------------
function makeResult(overrides: Partial<PriceResult>): PriceResult {
  return {
    rank: 1,
    retailer: "Test",
    country: "UK",
    flag: "🇬🇧",
    itemPrice: 100,
    shipping: 0,
    duties: 0,
    totalYouPay: 100,
    originalPrice: null,
    delivery: "3-5 days",
    trustRating: 4.0,
    currency: "GBP",
    url: "https://example.com",
    ...overrides,
  };
}

describe("sortResults by price", () => {
  it("sorts cheapest first", () => {
    const a = makeResult({ totalYouPay: 120, retailer: "A" });
    const b = makeResult({ totalYouPay: 90, retailer: "B" });
    const c = makeResult({ totalYouPay: 105, retailer: "C" });
    const sorted = sortResults([a, b, c], "price");
    expect(sorted.map((r) => r.retailer)).toEqual(["B", "C", "A"]);
  });

  it("returns stable order when prices are equal", () => {
    const a = makeResult({ totalYouPay: 100, retailer: "A" });
    const b = makeResult({ totalYouPay: 100, retailer: "B" });
    const sorted = sortResults([a, b], "price");
    expect(sorted).toHaveLength(2);
  });
});

describe("sortResults by delivery", () => {
  it("sorts fastest delivery first", () => {
    const a = makeResult({ delivery: "7-10 days", retailer: "A" });
    const b = makeResult({ delivery: "2-4 days", retailer: "B" });
    const c = makeResult({ delivery: "1 day", retailer: "C" });
    const sorted = sortResults([a, b, c], "delivery");
    expect(sorted.map((r) => r.retailer)).toEqual(["C", "B", "A"]);
  });

  it("puts non-numeric delivery strings last", () => {
    const a = makeResult({ delivery: "TBC", retailer: "A" });
    const b = makeResult({ delivery: "3-5 days", retailer: "B" });
    const sorted = sortResults([a, b], "delivery");
    expect(sorted[0].retailer).toBe("B");
    expect(sorted[1].retailer).toBe("A");
  });
});

describe("sortResults by trust", () => {
  it("sorts highest trust rating first", () => {
    const a = makeResult({ trustRating: 3.5, retailer: "A" });
    const b = makeResult({ trustRating: 4.8, retailer: "B" });
    const c = makeResult({ trustRating: 4.2, retailer: "C" });
    const sorted = sortResults([a, b, c], "trust");
    expect(sorted.map((r) => r.retailer)).toEqual(["B", "C", "A"]);
  });
});

// ---------------------------------------------------------------------------
// BUG: best_price falsy check in useWatchlist.add
// The line `best_price: product.best_price || null` treats 0 as null.
// This is a documentation test — the actual hook uses Supabase, so we
// reproduce the exact logic here to prove the issue.
// ---------------------------------------------------------------------------
describe("best_price falsy-check bug (mirrors useWatchlist.ts:55)", () => {
  function buggyBestPrice(val: number | undefined): number | null {
    // Mirrors: best_price: product.best_price || null
    return val || null;
  }

  function fixedBestPrice(val: number | undefined): number | null {
    // Correct: best_price: product.best_price ?? null
    return val ?? null;
  }

  it("BUG: treats 0 as null with || operator", () => {
    expect(buggyBestPrice(0)).toBeNull(); // incorrectly null
  });

  it("correctly preserves 0 with ?? operator", () => {
    expect(fixedBestPrice(0)).toBe(0);
  });

  it("both return null for undefined", () => {
    expect(buggyBestPrice(undefined)).toBeNull();
    expect(fixedBestPrice(undefined)).toBeNull();
  });

  it("both return the value for positive numbers", () => {
    expect(buggyBestPrice(99.99)).toBe(99.99);
    expect(fixedBestPrice(99.99)).toBe(99.99);
  });
});
