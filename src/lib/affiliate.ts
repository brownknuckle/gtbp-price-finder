// ─── Affiliate URL Generator ─────────────────────────────────
//
// AWIN setup:
//   1. Get approved at awin.com/gb
//   2. Replace AWIN_PUBLISHER_ID with your publisher ID (found in AWIN dashboard)
//   3. Merchant IDs are listed per-retailer below — verify in AWIN dashboard
//      after being approved by each program
//
// Rakuten setup (Nike):
//   1. Get approved at rakutenadvertising.com
//   2. Replace RAKUTEN_SITE_ID with your site ID
//
// Impact setup (StockX, GOAT):
//   1. Get approved at impact.com
//   2. Replace the Impact campaign IDs below

const AWIN_PUBLISHER_ID = "2815746";
const RAKUTEN_SITE_ID = "";   // e.g. "1234567" — fill in once approved

// Amazon Associates UK — replace with your tag from affiliate-program.amazon.co.uk
// Tag format is typically "yourname-21"
const AMAZON_ASSOCIATES_TAG = "";  // e.g. "gtbp-21"

// AWIN merchant IDs — verify each in your AWIN dashboard after approval
const AWIN_MERCHANTS: Record<string, string> = {
  "jdsports.co.uk":      "2441",
  "asos.com":            "4277",
  "schuh.co.uk":         "11035",
  "size.co.uk":          "2547",
  "office.co.uk":        "3027",
  "zalando.co.uk":       "13243",
  "footlocker.co.uk":    "2457",
  "flannels.com":        "13641",
  "endclothing.com":     "12510",
  "selfridges.com":      "3088",
  "harveynichols.com":   "2564",
  "adidas.co.uk":        "9252",
  "adidas.com":          "9252",
  "newbalance.co.uk":    "13590",
  "footasylum.com":      "13882",
  "offspring.co.uk":     "10920",
  "sportsdirect.com":    "1830",
  "very.co.uk":          "2382",
  "tessuti.co.uk":       "15043",
};

// Rakuten merchants
const RAKUTEN_MERCHANTS: Record<string, string> = {
  "nike.com": "38520", // verify in Rakuten dashboard
};

function buildAwinUrl(merchantId: string, destinationUrl: string): string {
  return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(destinationUrl)}`;
}

function buildRakutenUrl(merchantId: string, destinationUrl: string): string {
  return `https://click.linksynergy.com/deeplink?id=${RAKUTEN_SITE_ID}&mid=${merchantId}&murl=${encodeURIComponent(destinationUrl)}`;
}

const AMAZON_DOMAINS = ["amazon.co.uk", "amazon.com"];

function buildAmazonUrl(destinationUrl: string): string {
  try {
    const u = new URL(destinationUrl);
    // Preserve existing tag param if present, otherwise inject ours
    u.searchParams.set("tag", AMAZON_ASSOCIATES_TAG);
    return u.toString();
  } catch {
    return destinationUrl;
  }
}

export function toAffiliateUrl(url: string, domain: string): string {
  if (AMAZON_ASSOCIATES_TAG && AMAZON_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return buildAmazonUrl(url);
  }

  if (AWIN_PUBLISHER_ID && AWIN_MERCHANTS[domain]) {
    return buildAwinUrl(AWIN_MERCHANTS[domain], url);
  }

  if (RAKUTEN_SITE_ID && RAKUTEN_MERCHANTS[domain]) {
    return buildRakutenUrl(RAKUTEN_MERCHANTS[domain], url);
  }

  // No affiliate program configured for this domain — return original
  return url;
}

export function isAffiliateReady(): boolean {
  return !!(AWIN_PUBLISHER_ID || RAKUTEN_SITE_ID || AMAZON_ASSOCIATES_TAG);
}
