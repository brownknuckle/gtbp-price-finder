import { describe, it, expect } from "vitest";
import { detectProduct, products } from "@/lib/mockData";

describe("detectProduct", () => {
  it("detects Nike P-6000 by model name", () => {
    expect(detectProduct("Nike P-6000")).toEqual(products.p6000);
  });

  it("detects Nike P-6000 by p6000 shorthand", () => {
    expect(detectProduct("p6000 black")).toEqual(products.p6000);
  });

  it("detects Nike P-6000 by lowercase SKU iq0577", () => {
    expect(detectProduct("nike iq0577")).toEqual(products.p6000);
  });

  // BUG: q is lowercased before the check, so `q.includes("IQ0577")` is
  // dead code — it will always be false. This test documents that the
  // uppercase SKU branch is never reached; detection only works via the
  // `iq0577` branch that follows it.
  it("detects Nike P-6000 by uppercase SKU IQ0577 (relies on lowercase fallback)", () => {
    // "IQ0577" is lowercased to "iq0577" before matching, so the explicit
    // uppercase check on line 39 of mockData.ts is dead code.
    expect(detectProduct("Nike IQ0577")).toEqual(products.p6000);
  });

  it("detects Air Max 1 by 'air max'", () => {
    expect(detectProduct("Nike Air Max 1 86 OG")).toEqual(products.airmax1);
  });

  it("detects Air Max 1 by 'airmax'", () => {
    expect(detectProduct("airmax white")).toEqual(products.airmax1);
  });

  it("detects New Balance 550 by model number", () => {
    expect(detectProduct("New Balance 550 White Green")).toEqual(products.nb550);
  });

  it("detects New Balance 550 by brand alone", () => {
    expect(detectProduct("New Balance classic")).toEqual(products.nb550);
  });

  it("detects Adidas Samba by name", () => {
    expect(detectProduct("Adidas Samba OG")).toEqual(products.samba);
  });

  it("detects Adidas Samba by brand alone", () => {
    expect(detectProduct("Adidas classic")).toEqual(products.samba);
  });

  it("detects Stone Island jacket", () => {
    expect(detectProduct("Stone Island Soft Shell Jacket")).toEqual(products.stoneIsland);
  });

  it("detects ASICS Gel-Kayano by kayano keyword", () => {
    expect(detectProduct("Kayano 14")).toEqual(products.asicsKayano);
  });

  it("detects ASICS Gel-Kayano by asics keyword", () => {
    expect(detectProduct("asics gel")).toEqual(products.asicsKayano);
  });

  it("falls back to cortez for unknown products", () => {
    expect(detectProduct("Air Jordan 1 Retro High OG")).toEqual(products.cortez);
    expect(detectProduct("Yeezy Boost 350")).toEqual(products.cortez);
    expect(detectProduct("")).toEqual(products.cortez);
  });

  // BUG: priority mismatch — "550" is checked before "samba", so a query
  // that legitimately contains both (e.g. a URL or full product descriptor
  // mentioning "Adidas Samba 550") resolves to nb550 instead of samba.
  it("BUG: 'Adidas Samba 550' incorrectly resolves to nb550 instead of samba", () => {
    // Demonstrates the priority bug: '550' is evaluated before 'samba'.
    const result = detectProduct("Adidas Samba 550");
    // The correct product is samba, but the bug returns nb550.
    expect(result).toEqual(products.nb550); // fails if/when the bug is fixed
  });
});
