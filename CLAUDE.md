# GTBP — Claude Context File

This file is read automatically at the start of every session. It contains everything needed to work on this project without asking Rio for context.

---

## What This Project Is

**Get The Best Price** — https://getthebestprice.co.uk
UK price comparison tool for sneakers, clothing & accessories. Compares 20+ UK retailers + resale platforms in real time. Business model: affiliate commissions once traffic is established.

**Owner:** Rio Attohwood — info@getthebestprice.co.uk
**GitHub:** brownknuckle/gtbp-price-finder

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Fonts | Anton (display), Space Grotesk (body), Space Mono |
| Hosting | Netlify (account: info@getthebestprice.co.uk), custom domain via GoDaddy |
| Backend | Supabase Edge Functions (Deno runtime) |
| AI | Google Gemini 2.5 Flash (MUST use this — not 2.0-flash) |
| Web search | Firecrawl (snippet-only mode — no scrapeOptions) |
| Shopping API | Serper Google Shopping API |
| Email | Resend (domain: getthebestprice.co.uk, verified) |
| Monitoring | UptimeRobot (every 5 min), Sentry (error tracking), Health Check Edge Function (every 6h) |
| Analytics | GA4 — measurement ID: G-9C2LWGY3MD |

---

## Key IDs & Endpoints

- **Supabase project ref:** `jbftwbduusnjoufsotpq`
- **Supabase URL:** `https://jbftwbduusnjoufsotpq.supabase.co`
- **Supabase anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZnR3YmR1dXNuam91ZnNvdHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTYyMDYsImV4cCI6MjA4Nzc3MjIwNn0.tOZMYXjsYZX24KIMM7IalVk3IOCT7BK_zwshYc7jHrI`
- **Netlify site:** getthebestprice.netlify.app → getthebestprice.co.uk
- **Alert email:** info@getthebestprice.co.uk

---

## Edge Functions

| Function | Purpose | Schedule |
|---|---|---|
| `price-scrape` | Core scraper — fetches live prices from retailers | On demand |
| `product-search` | Returns product metadata + retailers list | On demand |
| `cache-warmer` | Pre-warms top 25 products | Every 4h (cron job ID: check Supabase) |
| `health-check` | Tests AF1 Triple White, emails if results < 4 | Every 6h (cron job ID: 6) |
| `price-alerts` | Sends watchlist price drop alerts | Scheduled |
| `trending` | Returns trending products | On demand |
| `releases` | Upcoming release calendar | On demand |

Deploy a function: `npx supabase functions deploy <function-name>`

---

## Critical Rules — Never Break These

1. **Never use `supabase.functions.invoke()`** in `api.ts` — it calls Lovable's internal project, not GTBP's. Always use direct `fetch()` to the Supabase URL.
2. **Always use `gemini-2.5-flash`** — gemini-2.0-flash is not available on Tier 1 and fails silently.
3. **Never add `scrapeOptions` to Firecrawl calls** — snippet-only mode is 7× cheaper. `scrapeOptions` re-enables full page scraping.
4. **Cache key includes size + gender** — do not remove these dimensions.
5. **RESALE_PLATFORMS skip price ceiling** — StockX, GOAT, Laced, Klekt etc. are exempt from the non-resale floor.
6. **Non-resale floor = 60% of RRP** — filters out wrong products priced suspiciously low. Do not lower below 60%.
7. **Colourway check uses URL slug patterns only** — `[-_/]color[-_/]` not `\bcolor\b` (word boundary causes false positives that remove legitimate results).

---

## Current State (Apr 2026)

### Live & Working
- Price comparison across 20+ retailers including resale (StockX, GOAT, Klekt, Laced)
- 30-day price history chart (Recharts, colour-coded, animated)
- Stale-while-revalidate caching (6h fresh / 48h stale + background refresh)
- Trust badges (Authorised / Free Returns / Unverified seller)
- Colourway conflict filtering (URL slug)
- Collab/variant filtering (Supreme, Off-White, Sacai etc.)
- Non-resale price floor (60% of RRP)
- Resale platform price ceiling bypass
- Shopping title relevance check
- Search/category page URL rejection
- 4-pass colourway-aware product image selection
- Lazy loading + vendor bundle splitting
- UptimeRobot monitoring (every 5 min → info@getthebestprice.co.uk)
- Health check Edge Function (every 6h → info@getthebestprice.co.uk via Resend)
- OG image at /public/og-image.png (1200×630, black/white brutalist style)
- 2 buying guides: /guides/nike-p-6000, /guides/adidas-handball-spezial
- 17 programmatic SEO pages: /best-price/:slug
- Sitemap.xml with 50+ product URLs
- GA4 analytics (G-9C2LWGY3MD)
- Sentry error tracking (awaiting account migration to info@getthebestprice.co.uk)

### Affiliate Status
- **AWIN:** Previously applied, rejected. Reapply ~June 2026 when traffic is established.
- **Rakuten/Nike:** Not yet applied.
- **All affiliate links disabled** until approved. AWIN_PUBLISHER_ID = "2815746" (commented out in src/lib/affiliate.ts).

### Pending
- [ ] Verify GA4 property G-9C2LWGY3MD in analytics.google.com
- [ ] Post social media drafts (HotUKDeals × 3, Reddit × 5) — drafts in Google Drive doc 10
- [ ] More buying guides: Nike Dunk Low, Adidas Campus 00s, NB 1906R, Jordan 4
- [ ] Expand best-price pages from 17 → 40+
- [ ] Sentry account migration (support email sent 11 Apr 2026, awaiting reply)
- [ ] AWIN reapplication (~June 2026)

---

## Google Drive Docs

Always mounted locally at: `/Users/rioattohwood/Google Drive/My Drive/GTBP/`
Desktop copy at: `/Users/rioattohwood/Desktop/GTBP/`

**After every session that changes the project, update the relevant docs AND sync Desktop ↔ Google Drive.**

Key files:
- `02 - Subscriptions & Costs.md` — plan/cost changes
- `03 - API Keys & Secrets.md` — new API keys or services
- `05 - Pending Actions.md` — mark completed items ✓, add new pending items
- `06 - Codebase Map.md` — architecture changes
- `09 - Monitoring & Alerts.md` — monitoring changes
- `10 - Growth & Marketing Report.md` — SEO/marketing strategy + social media drafts

---

## Deployment

```bash
# Build
npm run build

# Deploy to Netlify production
npx netlify-cli deploy --prod --dir=dist

# Deploy an Edge Function
npx supabase functions deploy <function-name>
```

---

## Cost Awareness

- Firecrawl: ~5 credits per search (snippet-only). Watch dashboard.
- Gemini: ~£0.01–0.05 per search. Tier 1 Pay As You Go.
- Netlify: Free tier (info@getthebestprice.co.uk account)
- Lovable: Lite plan ($5/mo) — kept for editor access only, site runs on own Netlify
- Supabase: Free tier
