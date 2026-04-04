#!/usr/bin/env node
/**
 * GTBP Link Health Checker
 * Reads cached price results from Supabase and verifies every URL is a real product page.
 * Uses NO Serper/AI credits — only reads DB and makes HTTP HEAD requests.
 *
 * Usage:
 *   node scripts/check-links.js
 *   node scripts/check-links.js --query "Nike Air Max 90"   # check specific product
 *   node scripts/check-links.js --limit 50                  # check up to 50 cached entries
 */

const SUPABASE_URL = "https://jbftwbduusnjoufsotpq.supabase.co";
// Using service role key so we can read the cache without RLS restrictions (local script only — never expose this in the browser)
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZnR3YmR1dXNuam91ZnNvdHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE5NjIwNiwiZXhwIjoyMDg3NzcyMjA2fQ.q9BAcVY5afGONv5pMcNIWB0aTZAlo-CqL4L1_FxmQEU";

// URL patterns that indicate a NON-product page (search/homepage/category)
const BAD_URL_PATTERNS = [
  /\/search[?/]/i,
  /[?&](q|query|s|search|Ntt)=/i,
  /\/catalog[?/]/i,
  /^https?:\/\/[^/]+\/?$/,          // homepage (no path)
  /\/collections?\//i,
  /\/category\//i,
  /\/categories\//i,
  /\/brand\//i,
  /\/brands\//i,
  /\/trainers\/?$/i,
  /\/shoes\/?$/i,
];

const isSearchOrHomepage = (url) => BAD_URL_PATTERNS.some(p => p.test(url));

// Sites that block automated HEAD/GET requests with 403/503 but have valid product URLs
const BOT_BLOCKING_DOMAINS = new Set([
  "goat.com", "stockx.com", "zalando.co.uk", "decathlon.co.uk",
  "footshop.eu", "ssense.com", "klekt.com", "laced.com", "laced.co.uk",
  "depop.com", "grailed.com", "farfetch.com",
]);

const STATUS = { OK: "✅", BAD_URL: "⚠️ ", HTTP_ERR: "❌", REDIRECT: "🔄", TIMEOUT: "⏱️ " };

async function headCheck(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GTBP-LinkChecker/1.0)" },
    });
    const finalUrl = res.url || url;
    const redirected = finalUrl !== url && !finalUrl.startsWith(new URL(url).origin);
    return { status: res.status, finalUrl, redirected };
  } catch (e) {
    if (e.name === "AbortError") return { status: 0, error: "timeout" };
    return { status: 0, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCachedResults(query, limit) {
  let apiUrl = `${SUPABASE_URL}/rest/v1/price_cache?select=product_key,results,created_at&order=created_at.desc&limit=${limit}`;
  if (query) {
    const encoded = encodeURIComponent(`%${query.toLowerCase()}%`);
    apiUrl += `&product_key=ilike.${encoded}`;
  }

  const res = await fetch(apiUrl, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase fetch failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const queryIdx = args.indexOf("--query");
  const limitIdx = args.indexOf("--limit");
  const query = queryIdx >= 0 ? args[queryIdx + 1] : null;
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || 20 : 20;

  console.log(`\n🔍 GTBP Link Health Checker`);
  console.log(`   Fetching up to ${limit} cached results${query ? ` matching "${query}"` : ""}...\n`);

  let rows;
  try {
    rows = await fetchCachedResults(query, limit);
  } catch (e) {
    console.error("Failed to fetch from Supabase:", e.message);
    console.error("Note: You may need to update SUPABASE_KEY in this script.");
    process.exit(1);
  }

  if (!rows.length) {
    console.log("No cached results found. Run a search on the site first.");
    return;
  }

  console.log(`Found ${rows.length} cached products.\n`);

  let totalUrls = 0, passCount = 0, warnCount = 0, failCount = 0;
  const failures = [];

  for (const row of rows) {
    const results = row.results || [];
    const productKey = row.product_key;
    const age = Math.round((Date.now() - new Date(row.created_at)) / 60000);
    console.log(`📦 ${productKey} (${age}min ago, ${results.length} retailers)`);

    // Check all URLs in parallel
    const checks = await Promise.all(
      results.map(async (r) => {
        const url = r.url || "";
        if (!url) return { retailer: r.retailer, url: "(none)", isBad: false, botBlocking: false, httpResult: { status: 0, error: "no URL" } };
        const isBad = isSearchOrHomepage(url);
        let domain = "";
        try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
        const botBlocking = BOT_BLOCKING_DOMAINS.has(domain);
        const httpResult = (isBad || botBlocking) ? null : await headCheck(url);
        return { retailer: r.retailer, url, isBad, botBlocking, httpResult };
      })
    );

    for (const { retailer, url, isBad, botBlocking, httpResult } of checks) {
      totalUrls++;
      if (isBad) {
        warnCount++;
        failures.push({ product: productKey, retailer, url, issue: "search/homepage URL" });
        console.log(`  ${STATUS.BAD_URL} ${retailer.padEnd(20)} ${url}`);
      } else if (botBlocking) {
        passCount++;
        console.log(`  ${STATUS.OK} ${retailer.padEnd(20)} (bot-blocked, URL looks valid)  ${url}`);
      } else if (!httpResult || httpResult.error === "timeout") {
        warnCount++;
        console.log(`  ${STATUS.TIMEOUT} ${retailer.padEnd(20)} TIMEOUT  ${url}`);
      } else if (httpResult.status >= 400) {
        failCount++;
        failures.push({ product: productKey, retailer, url, issue: `HTTP ${httpResult.status}` });
        console.log(`  ${STATUS.HTTP_ERR} ${retailer.padEnd(20)} HTTP ${httpResult.status}  ${url}`);
      } else if (httpResult.redirected && isSearchOrHomepage(httpResult.finalUrl)) {
        warnCount++;
        failures.push({ product: productKey, retailer, url, issue: `redirects to search/homepage → ${httpResult.finalUrl}` });
        console.log(`  ${STATUS.REDIRECT} ${retailer.padEnd(20)} REDIRECTS TO NON-PRODUCT  ${httpResult.finalUrl}`);
      } else {
        passCount++;
        console.log(`  ${STATUS.OK} ${retailer.padEnd(20)} ${httpResult.status}  ${url}`);
      }
    }
    console.log();
  }

  // Summary
  console.log("─".repeat(60));
  console.log(`Results: ${totalUrls} URLs checked`);
  console.log(`  ${STATUS.OK}  ${passCount} OK`);
  console.log(`  ${STATUS.BAD_URL}  ${warnCount} warnings (search/homepage/timeout)`);
  console.log(`  ${STATUS.HTTP_ERR}  ${failCount} errors (4xx/5xx)`);

  if (failures.length) {
    console.log(`\nIssues found:`);
    for (const f of failures) {
      console.log(`  [${f.product}] ${f.retailer}: ${f.issue}`);
      console.log(`    ${f.url}`);
    }
  } else {
    console.log("\n✅ All links look healthy!");
  }
}

main().catch(console.error);
