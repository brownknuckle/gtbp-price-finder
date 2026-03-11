# GTBP — Full Project Context for Claude

## Project Overview

**GTBP (Get The Best Price)** is a React/TypeScript price comparison web app for sneakers and streetwear.
Users search for a product (by name, SKU, URL, or image), the app identifies it via AI, then scrapes 30+ global retailers and ranks results by total landed cost (item + shipping + duties).

- **Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Supabase, React Router v6, TanStack Query
- **Auth:** Google + Apple OAuth via Lovable/Supabase
- **Backend:** Supabase Edge Functions (`product-search`, `price-scrape`, `trending`)
- **Database:** Supabase Postgres

---

## File Structure

```
src/
├── App.tsx                          # Root — QueryClient, BrowserRouter, AnimatePresence routes
├── main.tsx                         # createRoot entry
├── index.css                        # Global styles + Tailwind
├── lib/
│   ├── api.ts                       # All API calls (searchProduct, scrapePrices, fetchPriceHistory, fetchTrending)
│   └── mockData.ts                  # Static data: product images, demo products, size options
├── pages/
│   ├── Index.tsx                    # Home: search bar, image upload, trending chips, FAQs, footer
│   ├── Results.tsx                  # Results: price cards, sort/filter, price history, watchlist save
│   ├── Watchlist.tsx                # Saved items with drag-to-reorder (dnd-kit)
│   ├── Admin.tsx                    # Admin ad manager (gated by VITE_ADMIN_EMAILS)
│   ├── Privacy.tsx / Terms.tsx      # Legal pages
│   ├── Unsubscribe.tsx              # Email unsubscribe
│   └── NotFound.tsx                 # 404
├── components/
│   ├── Navbar.tsx                   # Sticky nav: logo, watchlist icon, admin icon, AuthDialog
│   ├── AuthDialog.tsx               # Sign in/out dialog (Google + Apple OAuth)
│   ├── PriceHistoryChart.tsx        # Recharts line chart of historical best prices
│   ├── PageTransition.tsx           # Framer Motion fade/slide wrapper
│   ├── NavLink.tsx                  # Active-aware nav link
│   └── ErrorBoundary.tsx            # React error boundary
├── hooks/
│   ├── useAuth.ts                   # Supabase auth state (user, loading, signOut)
│   └── useWatchlist.ts              # Watchlist CRUD + drag reorder against Supabase
├── integrations/
│   ├── supabase/
│   │   ├── client.ts                # createClient with env vars
│   │   └── types.ts                 # Generated DB types
│   └── lovable/index.ts             # Lovable cloud auth helper
└── test/
    ├── api.test.ts
    ├── mockData.test.ts
    ├── resultsUtils.test.ts
    ├── example.test.ts
    └── setup.ts
```

---

## Key Data Types (`src/lib/api.ts`)

```ts
// Product identified by AI
interface ProductInfo {
  product_name: string;
  brand: string;
  category: "shoes" | "clothing" | "accessories";
  search_queries: string[];
  retailers: string[];              // list of retailers to scrape
  estimated_retail_price: number;
  confidence: number;               // 0–1
  identification_notes: string;
  suggestions: string[];            // autocomplete suggestions
  image_url?: string;
}

// One retailer result
interface PriceResult {
  rank: number;
  retailer: string;
  country: string;
  flag: string;                     // emoji flag
  itemPrice: number;
  shipping: number;
  duties: number;
  totalYouPay: number;              // KEY: item + shipping + duties
  originalPrice: number | null;     // for sale badge
  delivery: string;                 // e.g. "2-4 days"
  trustRating: number;
  currency: string;
  url: string;
  inStock?: boolean | null;
  checkedAt?: string;               // ISO timestamp
  couponCode?: string | null;
  retailerTier?: "authorised" | "trusted" | "unverified";
  freeReturns?: boolean;
}

interface ScrapeResponse {
  results: PriceResult[];
  cached: boolean;
  cached_at?: string;
  thirtyDayLow?: number | null;
  serviceDegraded?: boolean;        // Firecrawl down
}

interface PriceHistoryPoint {
  date: string;       // "Feb 10"
  checkedAt: string;  // ISO
  bestPrice: number;
}

interface TrendingItem {
  name: string;
  category: "shoes" | "clothing" | "accessories";
  emoji: string;
}
```

---

## Supabase Database Tables

### `price_cache`
| column | type |
|---|---|
| id | uuid PK |
| product_key | text |
| product_info | jsonb |
| results | jsonb |
| created_at | timestamptz |

### `price_history`
| column | type |
|---|---|
| id | uuid PK |
| product_key | text |
| results | jsonb (array of PriceResult) |
| checked_at | timestamptz |
| created_at | timestamptz |

### `watchlist`
| column | type |
|---|---|
| id | uuid PK |
| user_id | uuid (FK auth.users) |
| product_name | text |
| brand | text? |
| category | text? |
| search_query | text? |
| best_price | float8? |
| previous_price | float8? |
| retailers | jsonb? |
| sort_order | int4 |
| created_at | timestamptz |
| updated_at | timestamptz |

Unique constraint: `(user_id, product_name)`

---

## API Functions (`src/lib/api.ts`)

```ts
// 1. Identify product (calls edge fn `product-search`)
searchProduct(query: string, imageBase64?: string): Promise<ProductInfo>

// 2. Scrape prices (calls edge fn `price-scrape`)
scrapePrices(
  productName: string,
  retailers: string[],
  skipCache = false,
  estimatedRetailPrice?: number
): Promise<ScrapeResponse>

// 3. Price history from price_history table
fetchPriceHistory(productKey: string): Promise<PriceHistoryPoint[]>

// 4. Trending items (calls edge fn `trending`)
fetchTrending(): Promise<TrendingItem[]>
```

---

## Page: Index (`/`)

**State:**
- `query` — search text
- `gender` — "men" | "women" | "unisex"
- `sizeType` — "clothing" | "shoes"
- `sizeRegion` — "UK" | "US" | "EU"
- `size` — selected size string
- `imagePreview` / `imageBase64` — uploaded image
- `pendingProduct` — ProductInfo from image search (confirmation step)
- `editingName` / `editedName` — inline name correction
- `trendingItems` — from `fetchTrending()`
- `suggestions` — predictive autocomplete (debounced 600ms)

**Flow:**
1. User types or drags an image
2. `handleSearch()` calls `searchProduct()`
3. If image: shows confirmation card with confidence %, editable name
4. On confirm: navigates to `/results?q=<name>` with `state: { product, sizing }`
5. Text search: directly navigates with product in state

---

## Page: Results (`/results?q=<name>`)

**State:**
- Receives `product: ProductInfo` and `sizing` via `location.state`
- Falls back to calling `searchProduct(query)` if no state
- `results: PriceResult[]` — from `scrapePrices()`
- `phase` — "identifying" | "scraping" | "done"
- `progress` — 0–100 (animated every 1s while scraping)
- `domesticOnly` — UK-only filter toggle
- `sortBy` — "price" | "delivery" | "trust"
- `thirtyDayLow` — historic best price indicator
- `dataSource` — cached/live badge info
- `pendingBuyUrl` — stale price warning dialog

**Features:**
- Skeleton cards while loading + progress bar with cycling retailer names
- Sort by cheapest / fastest / most trusted
- UK-only toggle
- 30-day low indicator
- Coupon code copy
- "Buy Now" triggers stale-price dialog if cache >2h old
- Collapsible price history chart
- Watchlist save button
- Refresh button (skipCache=true)

---

## Page: Watchlist (`/watchlist`)

- Requires sign-in; redirects to `/` with toast if not authenticated
- Drag-to-reorder via `@dnd-kit/sortable`
- Items stored in Supabase `watchlist` table
- `useWatchlist` hook: `items`, `add()`, `remove()`, `reorder()`, `isInWatchlist()`

---

## Hook: `useWatchlist`

```ts
{
  items: WatchlistEntry[];
  loading: boolean;
  add(product: { product_name, brand?, category?, best_price? }): Promise<boolean>;
  remove(id: string): void;
  reorder(reorderedItems: WatchlistEntry[]): void;
  isInWatchlist(productName: string): boolean;
  refresh(): void;
}
```

---

## Hook: `useAuth`

```ts
{
  user: User | null;   // Supabase User
  loading: boolean;
  signOut(): Promise<void>;
}
```

---

## Navbar

- **GTBP** logo → `/`
- **Megaphone icon** → `/admin` (only shown if user email is in `VITE_ADMIN_EMAILS`)
- **Heart icon** → `/watchlist`
- **AuthDialog** → Google/Apple OAuth

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://qrlmkaolugdjsxeilfuz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=qrlmkaolugdjsxeilfuz
VITE_ADMIN_EMAILS=                         # comma-separated admin emails; empty = all users are admin
```

---

## Size Data (`src/lib/mockData.ts`)

```ts
// Shoe sizes by region
shoeSizes: {
  US: ["6", "6.5", ..., "15"],
  UK: ["5", "5.5", ..., "14"],
  EU: ["38.5", "39", ..., "49.5"],
}

// Clothing sizes
sizeOptions.clothing: ["XS", "S", "M", "L", "XL"]
```

---

## Supabase Edge Functions (external, not in this repo)

| Function | Purpose |
|---|---|
| `product-search` | Accepts `{ query, image? }`, returns `ProductInfo` with AI identification |
| `price-scrape` | Accepts `{ product_name, retailers, skip_cache, estimated_retail_price }`, returns `ScrapeResponse` using Firecrawl |
| `trending` | Returns `TrendingItem[]` of currently popular searches |

---

## Routing

```
/              → Index (search home)
/results       → Results (price comparison, query param: ?q=)
/watchlist     → Watchlist (saved items)
/admin         → Admin (ad manager, email-gated)
/privacy       → Privacy policy
/terms         → Terms of service
/unsubscribe   → Email unsubscribe
*              → NotFound
```

All routes wrapped in `<PageTransition>` (Framer Motion fade) and `<AnimatePresence mode="wait">`.

---

## Notable UX Patterns

- **Stale price interstitial:** If cached data is >2h old, clicking "Buy Now" shows an `AlertDialog` warning the price may have changed before opening the retailer URL
- **Image search flow:** Upload/drag image → AI identifies → confirmation card with editable product name + confidence % → proceed or correct
- **Predictive autocomplete:** Debounced 600ms, calls `searchProduct` to get suggestions
- **Service degraded state:** If Firecrawl is down with no cache, shows amber warning banner; if completely unavailable, throws user-facing error
- **30-day low indicator:** Green "At 30-day low price" or amber "30-day low was £X" based on price history

---

## Testing

- Framework: Vitest + Testing Library
- Test files in `src/test/`
- Run: `npm test`
