#!/usr/bin/env node

/**
 * GTBP MCP Server
 *
 * Lets Claude query sneaker & streetwear prices directly from the terminal.
 *
 * Tools exposed:
 *   search_product     — identify a product by name, SKU, or description
 *   get_prices         — scrape live prices across 30+ global retailers
 *   get_price_history  — fetch historical best prices for a product
 *   get_trending       — list currently trending items
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://qrlmkaolugdjsxeilfuz.supabase.co";

// Set this in your environment:  export GTBP_SUPABASE_KEY="your-anon-key"
// Find it in: Supabase dashboard → Project Settings → API → anon/public key
const SUPABASE_ANON_KEY = process.env.GTBP_SUPABASE_KEY ?? "";

if (!SUPABASE_ANON_KEY) {
  process.stderr.write(
    "[GTBP MCP] WARNING: GTBP_SUPABASE_KEY is not set. API calls will fail.\n" +
    "  Set it with:  export GTBP_SUPABASE_KEY=\"your-supabase-anon-key\"\n"
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callEdgeFunction(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge function "${name}" failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function querySupabase(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase query on "${table}" failed (${res.status}): ${text}`);
  }

  return res.json();
}

function formatPriceResult(r) {
  const lines = [
    `${r.rank}. ${r.retailer} (${r.flag} ${r.country})`,
    `   Total you pay: ${r.currency}${r.totalYouPay.toFixed(2)}`,
    `   Item: ${r.currency}${r.itemPrice.toFixed(2)}  |  Shipping: ${r.currency}${r.shipping.toFixed(2)}  |  Duties: ${r.currency}${r.duties.toFixed(2)}`,
    `   Delivery: ${r.delivery}  |  Trust: ${r.trustRating}/10  |  Tier: ${r.retailerTier ?? "unknown"}`,
  ];
  if (r.inStock === false) lines.push("   ⚠ Out of stock");
  if (r.couponCode) lines.push(`   Coupon: ${r.couponCode}`);
  if (r.freeReturns) lines.push("   Free returns");
  if (r.url) lines.push(`   URL: ${r.url}`);
  return lines.join("\n");
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "search_product",
    description:
      "Identify a sneaker or streetwear item from a name, SKU, or free-text description. " +
      "Returns brand, category, estimated retail price, and the list of retailers to check.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Product name, SKU, or description — e.g. "Nike Air Max 90" or "Jordan 1 Retro High OG Chicago"',
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_prices",
    description:
      "Scrape live prices for a product across 30+ global retailers, ranked by total landed cost " +
      "(item price + shipping + duties). Optionally filter to UK-only retailers.",
    inputSchema: {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "Exact product name as returned by search_product",
        },
        retailers: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional list of retailer names to check. Leave empty to check all available retailers.",
        },
        uk_only: {
          type: "boolean",
          description: "If true, only return UK-based retailers (no international shipping/duties)",
          default: false,
        },
        skip_cache: {
          type: "boolean",
          description: "If true, bypass the cache and fetch fresh prices",
          default: false,
        },
      },
      required: ["product_name"],
    },
  },
  {
    name: "get_price_history",
    description:
      "Fetch the historical best prices for a product over the past 30 days. " +
      "Useful for spotting trends and identifying the all-time low.",
    inputSchema: {
      type: "object",
      properties: {
        product_key: {
          type: "string",
          description:
            'Product key — use the lowercased, hyphenated product name, e.g. "nike-air-max-90"',
        },
      },
      required: ["product_key"],
    },
  },
  {
    name: "get_trending",
    description: "List the currently trending sneakers and streetwear items on GTBP.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "gtbp-price-finder", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // ── search_product ──────────────────────────────────────────────────────
    if (name === "search_product") {
      const data = await callEdgeFunction("product-search", { query: args.query });

      const text = [
        `Product: ${data.product_name}`,
        `Brand: ${data.brand}`,
        `Category: ${data.category}`,
        `Estimated retail price: £${data.estimated_retail_price}`,
        `Confidence: ${Math.round(data.confidence * 100)}%`,
        `Notes: ${data.identification_notes}`,
        `Retailers to check: ${(data.retailers ?? []).join(", ")}`,
        data.suggestions?.length
          ? `Related searches: ${data.suggestions.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      return { content: [{ type: "text", text }] };
    }

    // ── get_prices ──────────────────────────────────────────────────────────
    if (name === "get_prices") {
      const payload = {
        product_name: args.product_name,
        retailers: args.retailers ?? [],
        skip_cache: args.skip_cache ?? false,
      };

      const data = await callEdgeFunction("price-scrape", payload);

      let results = data.results ?? [];
      if (args.uk_only) {
        results = results.filter((r) => r.country === "UK" || r.country === "United Kingdom");
      }

      if (!results.length) {
        return {
          content: [{ type: "text", text: "No prices found for that product." }],
        };
      }

      const lines = [
        `Prices for: ${args.product_name}`,
        data.cached ? `(Cached at ${data.cached_at ?? "unknown"})` : "(Live data)",
        data.thirtyDayLow != null
          ? `30-day low: £${data.thirtyDayLow.toFixed(2)}`
          : null,
        "",
        ...results.map(formatPriceResult),
      ]
        .filter((l) => l !== null)
        .join("\n");

      return { content: [{ type: "text", text: lines }] };
    }

    // ── get_price_history ───────────────────────────────────────────────────
    if (name === "get_price_history") {
      const rows = await querySupabase(
        "price_history",
        `product_key=eq.${encodeURIComponent(args.product_key)}&order=checked_at.desc&limit=30`
      );

      if (!rows.length) {
        return {
          content: [
            {
              type: "text",
              text: `No price history found for product key "${args.product_key}".`,
            },
          ],
        };
      }

      const lines = [
        `Price history for: ${args.product_key}`,
        "",
        ...rows.map((row) => {
          const results = row.results ?? [];
          const best =
            results.length > 0
              ? Math.min(...results.map((r) => r.totalYouPay ?? Infinity))
              : null;
          const date = new Date(row.checked_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return best != null
            ? `${date}  →  Best price: £${best.toFixed(2)}`
            : `${date}  →  No data`;
        }),
      ].join("\n");

      return { content: [{ type: "text", text: lines }] };
    }

    // ── get_trending ────────────────────────────────────────────────────────
    if (name === "get_trending") {
      const data = await callEdgeFunction("trending", {});
      const items = Array.isArray(data) ? data : data.items ?? [];

      if (!items.length) {
        return { content: [{ type: "text", text: "No trending items at the moment." }] };
      }

      const lines = [
        "Trending on GTBP right now:",
        "",
        ...items.map((item) => `${item.emoji}  ${item.name}  (${item.category})`),
      ].join("\n");

      return { content: [{ type: "text", text: lines }] };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("[GTBP MCP] Server running. Waiting for requests...\n");
