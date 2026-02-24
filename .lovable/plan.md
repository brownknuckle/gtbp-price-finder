
# GTBP — Get The Best Price (Prototype)

A fashion & footwear price comparison app that shows the true total cost across global retailers, ranked cheapest to most expensive.

## Design System
- **Colors**: Navy blue (#1A3A6B), white, green (#1A6B3A), light grey backgrounds
- **Font**: Inter, clean modern sans-serif
- **Style**: Minimal, confident, mobile-first responsive layout
- **Key rule**: "Total You Pay" is always the most prominent number on screen

---

## Screen 1 — Home / Search
- GTBP logo (top-left) with "Get The Best Price" tagline
- Large centered search bar with placeholder text and camera/image upload icon
- Size selector dropdown (XS–XL + shoe sizes 6–15)
- Navy blue "Search" button
- 4 trending search chips below: Nike Air Max 1, New Balance 550, Stone Island Jacket, Adidas Samba
- Clean white background, welcoming hero feel

## Screen 2 — Search Results
- Header: product name, size, and small product thumbnail
- Toggle: "All Retailers" / "Domestic Only"
- Filter bar: Sort by Price, Delivery Speed, Trust Rating
- 5 ranked result cards, each showing:
  - Rank number, retailer name + country flag
  - Item price, shipping, duties & taxes
  - Bold "Total You Pay" (largest number)
  - Estimated delivery, trust rating (stars), green "Buy Now" button
- Rank 1 highlighted with green "Best Price" badge
- Cards 2–5 progressively greyed out

## Screen 3 — Item Detail / Cost Breakdown
- Large product image (left) + product name, colorway, size
- Full cost breakdown panel (right): item price, shipping, import duties, currency conversion note, platform fee, divider, bold green TOTAL YOU PAY
- Retailer info: name, country, return policy, trust score
- Two CTAs: "Buy Now" (green) and "Save to Watchlist" (outlined)
- Price History mini chart showing last 90 days (using Recharts)

## Screen 4 — Watchlist / Saved Items
- Grid of saved items with product image, name, current best price
- Price change indicators (green arrow down / red arrow up)
- Bell icon on each card for price drop alert management
- Clean, minimal grid layout

## Navigation
- Simple top nav bar with GTBP logo, search icon, and watchlist icon
- Clicking trending chips or search triggers navigation to results
- Clicking a result card navigates to detail view
- All screens connected via React Router with realistic placeholder data throughout
