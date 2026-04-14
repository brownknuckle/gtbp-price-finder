// GTBP Price Scrape Edge Function — scrapes and compares prices across retailers
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEBUG = Deno.env.get("DEBUG") === "true";
const log = (...args: any[]) => { if (DEBUG) console.log(...args); };

// ─── Constants ───────────────────────────────────────────────
const EXCLUDED_DOMAINS = [
  "pricespy", "pricerunner", "idealo", "shopzilla", "bizrate",
  "google.com/shopping", "shopping.google", "kelkoo", "nextag",
  "pricegrabber", "shopbot", "skinflint", "camelcamelcamel",
  "keepa.com", "prisjakt", "pricehunter",
  "lyst.co.uk", "lyst.com", "shopstyle.co.uk", "shopstyle.com",
  "pricecheck", "price-compare", "comparethemarket",
];

const UK_COM_RETAILERS = new Set([
  "asos.com", "flannels.com", "footasylum.com", "endclothing.com",
  "selfridges.com", "harveynichols.com", "mrporter.com", "matchesfashion.com",
  "farfetch.com", "sportsdirect.com", "jdsports.com", "very.co.uk",
  "laced.com", "klekt.com", "thesolesupplier.co.uk",
  "crepsuk.com", "launches.co.uk", "samedaytrainers.co.uk",
  "fatbuddhastore.com", "shucentre.co.uk",
  "kershkicks.com", "footpatrol.com",
  // stadiumgoods.com is NYC-based — intentionally excluded (international)
  "stoneisland.com", "cpcompany.com", "carhartt-wip.com",
  "nike.com", "adidas.com", "newbalance.com", "puma.com", "reebok.com",
  "converse.com", "vans.com", "timberland.com", "ugg.com", "crocs.com",
  // Note: stockx.com, goat.com, sneakersnstuff.com, solebox.com, stadiumgoods.com are international — NOT in this set
]);

// Canonical display names for known retailer domains
const RETAILER_DISPLAY_NAMES: Record<string, string> = {
  "jdsports.co.uk": "JD Sports", "jdsports.com": "JD Sports",
  "size.co.uk": "Size?",
  "footlocker.co.uk": "Foot Locker", "footlocker.com": "Foot Locker",
  "schuh.co.uk": "Schuh",
  "offspring.co.uk": "Offspring",
  "office.co.uk": "Office",
  "footasylum.com": "Footasylum",
  "endclothing.com": "END.",
  "asos.com": "ASOS",
  "zalando.co.uk": "Zalando",
  "flannels.com": "Flannels",
  "tessuti.co.uk": "Tessuti",
  "sportsdirect.com": "Sports Direct",
  "very.co.uk": "Very",
  "next.co.uk": "Next",
  "selfridges.com": "Selfridges",
  "harveynichols.com": "Harvey Nichols",
  "mrporter.com": "MR PORTER",
  "farfetch.com": "Farfetch",
  "ssense.com": "SSENSE",
  "urbanoutfitters.com": "Urban Outfitters",
  "matchesfashion.com": "Matches",
  "brownsfashion.com": "Browns",
  "harrods.com": "Harrods",
  "nike.com": "Nike",
  "adidas.co.uk": "Adidas", "adidas.com": "Adidas",
  "newbalance.co.uk": "New Balance", "newbalance.com": "New Balance",
  "asics.co.uk": "ASICS", "asics.com": "ASICS",
  "puma.com": "Puma",
  "reebok.co.uk": "Reebok", "reebok.com": "Reebok",
  "converse.com": "Converse",
  "vans.co.uk": "Vans", "vans.com": "Vans",
  "timberland.co.uk": "Timberland",
  "hoka.com": "HOKA",
  "on-running.com": "On Running",
  "saucony.com": "Saucony",
  "drmartens.com": "Dr. Martens",
  "stockx.com": "StockX",
  "goat.com": "GOAT",
  "klekt.com": "Klekt",
  "laced.com": "Laced", "laced.co.uk": "Laced",
  "thesolesupplier.co.uk": "The Sole Supplier",
  "crepsuk.com": "Creps UK",
  "stadiumgoods.com": "Stadium Goods",
  "kershkicks.com": "KershKicks",
  "sneakersnstuff.com": "Sneakersnstuff",
  "solebox.com": "Solebox",
  "footpatrol.com": "Foot Patrol",
  "hanon-shop.com": "Hanon",
  "bstn.com": "BSTN",
  "asphaltgold.com": "Asphalt Gold",
  "overkillshop.com": "Overkill",
  "snipes.com": "Snipes",
  "footshop.eu": "Footshop",
  "mainlinemenswear.co.uk": "Mainline Menswear",
  "scottsmenswear.com": "Scotts Menswear",
  "whatsyoursize.co.uk": "What's Your Size",
  "samedaytrainers.co.uk": "Same Day Trainers",
  "urbanindustry.co.uk": "Urban Industry",
  "aphrodite1994.com": "Aphrodite",
  // Clothing brands
  "carhartt-wip.com": "Carhartt WIP",
  "stoneisland.com": "Stone Island",
  "cpcompany.com": "C.P. Company",
  "ralphlauren.co.uk": "Ralph Lauren", "ralphlauren.com": "Ralph Lauren",
  "lacoste.com": "Lacoste",
  "levis.com": "Levi's", "levi.com": "Levi's",
  "fredperry.com": "Fred Perry",
  "tommyhilfiger.com": "Tommy Hilfiger",
  "patagonia.com": "Patagonia",
  "thenorthface.com": "The North Face",
  "columbia.com": "Columbia",
  "champion.com": "Champion",
  "ellesse.com": "Ellesse",
  "fila.com": "Fila",
  // Clothing retail UK
  "hm.com": "H&M",
  "zara.com": "Zara",
  "riverisland.com": "River Island",
  "marksandspencer.com": "M&S",
  "uniqlo.com": "Uniqlo",
  "aboutyou.co.uk": "About You",
  // Non-sneaker shoes
  "clarks.co.uk": "Clarks", "clarks.com": "Clarks",
  "kurtgeiger.com": "Kurt Geiger",
};

function getRetailerName(domain: string, fallbackSource?: string): string {
  return RETAILER_DISPLAY_NAMES[domain] ?? fallbackSource ?? retailerNameFromDomain(domain);
}

// Search URL builders — used when Shopping only gives a homepage URL
const RETAILER_SEARCH_URLS: Record<string, (q: string) => string> = {
  "jdsports.co.uk": q => `https://www.jdsports.co.uk/search/?q=${encodeURIComponent(q)}`,
  "size.co.uk": q => `https://www.size.co.uk/search/?q=${encodeURIComponent(q)}`,
  "footlocker.co.uk": q => `https://www.footlocker.co.uk/search?query=${encodeURIComponent(q)}`,
  "schuh.co.uk": q => `https://www.schuh.co.uk/search/${encodeURIComponent(q)}/`,
  "offspring.co.uk": q => `https://www.offspring.co.uk/search?q=${encodeURIComponent(q)}`,
  "office.co.uk": q => `https://www.office.co.uk/view/search/all/query/${encodeURIComponent(q)}`,
  "footasylum.com": q => `https://www.footasylum.com/search/?q=${encodeURIComponent(q)}`,
  "endclothing.com": q => `https://www.endclothing.com/gb/search?q=${encodeURIComponent(q)}`,
  "asos.com": q => `https://www.asos.com/search/?q=${encodeURIComponent(q)}`,
  "zalando.co.uk": q => `https://www.zalando.co.uk/catalog/?q=${encodeURIComponent(q)}`,
  "flannels.com": q => `https://www.flannels.com/search?q=${encodeURIComponent(q)}`,
  "sportsdirect.com": q => `https://www.sportsdirect.com/search?term=${encodeURIComponent(q)}`,
  "nike.com": q => `https://www.nike.com/gb/search?q=${encodeURIComponent(q)}`,
  "adidas.co.uk": q => `https://www.adidas.co.uk/search?q=${encodeURIComponent(q)}`,
  "newbalance.co.uk": q => `https://www.newbalance.co.uk/search?q=${encodeURIComponent(q)}`,
  "stockx.com": q => `https://stockx.com/search?s=${encodeURIComponent(q)}`,
  "goat.com": q => `https://www.goat.com/search?query=${encodeURIComponent(q)}`,
  "klekt.com": q => `https://www.klekt.com/search?q=${encodeURIComponent(q)}`,
  "laced.com": q => `https://www.laced.com/search?query=${encodeURIComponent(q)}`,
  "sneakersnstuff.com": q => `https://www.sneakersnstuff.com/en/search?q=${encodeURIComponent(q)}`,
  "solebox.com": q => `https://www.solebox.com/en/search?q=${encodeURIComponent(q)}`,
  "bstn.com": q => `https://www.bstn.com/en/search?q=${encodeURIComponent(q)}`,
  "asphaltgold.com": q => `https://www.asphaltgold.com/en/search?q=${encodeURIComponent(q)}`,
  // Additional retailers — prevent homepage fallback
  "tessuti.co.uk": q => `https://www.tessuti.co.uk/search?q=${encodeURIComponent(q)}`,
  "selfridges.com": q => `https://www.selfridges.com/GB/en/cat/?q=${encodeURIComponent(q)}`,
  "harveynichols.com": q => `https://www.harveynichols.com/search?q=${encodeURIComponent(q)}`,
  "mrporter.com": q => `https://www.mrporter.com/en-gb/search?q=${encodeURIComponent(q)}`,
  "farfetch.com": q => `https://www.farfetch.com/uk/shopping/search?q=${encodeURIComponent(q)}`,
  "ssense.com": q => `https://www.ssense.com/en-gb/search?q=${encodeURIComponent(q)}`,
  "urbanoutfitters.com": q => `https://www.urbanoutfitters.com/search?q=${encodeURIComponent(q)}`,
  "puma.com": q => `https://uk.puma.com/uk/en/search?q=${encodeURIComponent(q)}`,
  "reebok.co.uk": q => `https://www.reebok.co.uk/search?q=${encodeURIComponent(q)}`,
  "converse.com": q => `https://www.converse.com/gb/en/c/search?searchTerm=${encodeURIComponent(q)}`,
  "vans.co.uk": q => `https://www.vans.co.uk/search?q=${encodeURIComponent(q)}`,
  "timberland.co.uk": q => `https://www.timberland.co.uk/search?q=${encodeURIComponent(q)}`,
  "hoka.com": q => `https://www.hoka.com/en-gb/search?q=${encodeURIComponent(q)}`,
  "on-running.com": q => `https://www.on-running.com/en-gb/search?q=${encodeURIComponent(q)}`,
  "saucony.com": q => `https://www.saucony.com/en/search?q=${encodeURIComponent(q)}`,
  "drmartens.com": q => `https://www.drmartens.com/uk/en/search?q=${encodeURIComponent(q)}`,
  "thesolesupplier.co.uk": q => `https://thesolesupplier.co.uk/search/?q=${encodeURIComponent(q)}`,
  "crepsuk.com": q => `https://www.crepsuk.com/search?type=product&q=${encodeURIComponent(q)}`,
  "kershkicks.com": q => `https://www.kershkicks.com/search?type=product&q=${encodeURIComponent(q)}`,
  "stadiumgoods.com": q => `https://www.stadiumgoods.com/search?q=${encodeURIComponent(q)}`,
  "footpatrol.com": q => `https://www.footpatrol.com/search/?q=${encodeURIComponent(q)}`,
  "hanon-shop.com": q => `https://www.hanon-shop.com/search?q=${encodeURIComponent(q)}`,
  "overkillshop.com": q => `https://www.overkillshop.com/en/search?q=${encodeURIComponent(q)}`,
  "snipes.com": q => `https://www.snipes.com/search?q=${encodeURIComponent(q)}`,
  "footshop.eu": q => `https://www.footshop.eu/en/search?q=${encodeURIComponent(q)}`,
  "mainlinemenswear.co.uk": q => `https://www.mainlinemenswear.co.uk/search?q=${encodeURIComponent(q)}`,
  "scottsmenswear.com": q => `https://www.scottsmenswear.com/search?q=${encodeURIComponent(q)}`,
  "whatsyoursize.co.uk": q => `https://www.whatsyoursize.co.uk/search?q=${encodeURIComponent(q)}`,
  "decathlon.co.uk": q => `https://www.decathlon.co.uk/search?Ntt=${encodeURIComponent(q)}`,
  "laced.co.uk": q => `https://www.laced.com/search?query=${encodeURIComponent(q)}`,
  "adidas.com": q => `https://www.adidas.co.uk/search?q=${encodeURIComponent(q)}`,
  "newbalance.com": q => `https://www.newbalance.co.uk/search?q=${encodeURIComponent(q)}`,
  // Clothing brands
  "carhartt-wip.com": q => `https://www.carhartt-wip.com/en/search?query=${encodeURIComponent(q)}`,
  "stoneisland.com": q => `https://www.stoneisland.com/gb/search?q=${encodeURIComponent(q)}`,
  "cpcompany.com": q => `https://www.cpcompany.com/en-gb/search?q=${encodeURIComponent(q)}`,
  "ralphlauren.co.uk": q => `https://www.ralphlauren.co.uk/en/search?q=${encodeURIComponent(q)}`,
  "lacoste.com": q => `https://www.lacoste.com/gb/search/?Ntt=${encodeURIComponent(q)}`,
  "levis.com": q => `https://www.levi.com/GB/en_GB/search?q=${encodeURIComponent(q)}`,
  "fredperry.com": q => `https://www.fredperry.com/search?q=${encodeURIComponent(q)}`,
  "tommyhilfiger.com": q => `https://www.tommy.com/en_gb/search?q=${encodeURIComponent(q)}`,
  "thenorthface.com": q => `https://www.thenorthface.com/en-gb/search?q=${encodeURIComponent(q)}`,
  "patagonia.com": q => `https://www.patagonia.com/search/?q=${encodeURIComponent(q)}`,
  "fila.com": q => `https://www.fila.co.uk/search?q=${encodeURIComponent(q)}`,
  "ellesse.com": q => `https://www.ellesse.co.uk/search?q=${encodeURIComponent(q)}`,
  // Clothing retail
  "hm.com": q => `https://www2.hm.com/en_gb/search-results.html?q=${encodeURIComponent(q)}`,
  "zara.com": q => `https://www.zara.com/uk/en/search?searchTerm=${encodeURIComponent(q)}`,
  "riverisland.com": q => `https://www.riverisland.com/search?q=${encodeURIComponent(q)}`,
  "marksandspencer.com": q => `https://www.marksandspencer.com/s/${encodeURIComponent(q)}`,
  "uniqlo.com": q => `https://www.uniqlo.com/uk/en/seo/search?q=${encodeURIComponent(q)}`,
  "aboutyou.co.uk": q => `https://www.aboutyou.co.uk/search?term=${encodeURIComponent(q)}`,
  // Non-sneaker shoes
  "clarks.co.uk": q => `https://www.clarks.co.uk/search?q=${encodeURIComponent(q)}`,
  "kurtgeiger.com": q => `https://www.kurtgeiger.com/search?q=${encodeURIComponent(q)}`,
};

const NON_PRODUCT_PATH_PATTERNS = [
  /\/collection\//i, /\/collections\//i, /\/category\//i, /\/categories\//i,
  /\/brand\//i, /\/brands\//i, /\/release-dates?\//i, /\/search[?/]/i,
  /\/shop\/[^/]*$/i, /\/cat\//i, /\/cat\?/i, /\/silhouette\//i, /\/refine\//i,
  /^\/b\/bn_/i, /^\/b\/[^/]+$/i,
  /\/w\?q=/i, /\/w\/[^/]*$/i, /\/w\/[^/]*\?/i, /\/search\?/i, /\/s\?k=/i, /\/s\/ref=/i,
  /\/browse\//i, /\/listing/i, /\/results\?/i, /\/shop\?/i,
  /\/plp\//i, /\/c\//i,
  /\/campaign\//i, /\/best-sellers/i, /\/new-arrivals/i, /\/sale\//i,
  /\/brand-[a-z0-9]/i, /productaffiliation/i, /\/shop-by-model\//i,
  // Opaque numeric-only product IDs with no readable slug — can't validate product from URL
  /\/products\/\d+\/?$/, /\/product\/\d+\/?$/, /offspring_catalog/, /office_catalog/,
  // Next.co.uk opaque style URLs: /style/SU459411/AG5666
  /\/style\/[a-z0-9]+\/[a-z0-9]+/i,
  // Footasylum editorial / launch pages
  /\/the-lowdown\//i, /\/launch\//i,
  /\/colour\//i, /\/color\//i, /\/gender\//i,
  /\/p\/trainers/i, /\/p\/shoes/i, /\/p\/clothing/i,
  /\/shoes\/\?/i, /\/trainers\/\?/i, /\/footwear\/\?/i,
  // Editorial / non-commerce paths
  /\/news\//i, /\/blog\//i, /\/editorial\//i, /\/inspiration\//i, /\/theplatform\//i, /\/culture\//i,
  // Nike article/story URLs: /gb/a/article-name (editorial, not product)
  /\/[a-z]{2}\/a\/[a-z0-9-]{5,}/i,
  // Category paths: /footwear/model-name or /clothing/model-name (single slug, no product code segment after)
  /\/footwear\/[a-z0-9-]+$/i, /\/clothing\/[a-z0-9-]+$/i, /\/accessories\//i,
  // Clothing category patterns: "coats-and-jackets", "caps-and-hats", "shirts-and-tops" etc.
  /\/[a-z]+-and-[a-z]+(?:\/|$)/i,
  // Flannels/SSENSE brand+category pages: /brand-name/coats-and-jackets
  /\/[a-z-]+\/(?:coats|jackets|shirts|hoodies|trousers|shorts|knitwear|sweats|fleece|outerwear|sweatshirts|tracksuits|caps|hats|accessories)[^/]*$/i,
  // Foot Locker model listing pages: /en/product/model/nike-air-force-1/
  /\/product\/model\//i,
  // Gender/brand/model category paths: /mens/nike/dunk/ — 3 word-only segments, no product code
  /\/(?:mens?|womens?|girls?|boys?|kids?|unisex)\/[a-z-]+\/[a-z-]+\/?$/i,
];

const MIN_REALISTIC_PRICE = 20;
const MAX_REALISTIC_PRICE = 2000;
const MIN_CACHE_RESULTS = 6;

// Shared collab / variant filter lists — used for both URL candidates and Shopping titles/URLs
const COLLAB_NAMES_GLOBAL = [
  "supreme","off-white","sacai","dior","travis-scott","travis_scott",
  "fragment","kaws","cdg","comme-des-garcons","stussy","palace","union",
  "off_white","a-cold-wall","acold","ambush","clot","virgil","drake","nocta",
  "acronym","ispa","atmos","parra","cactus","joy","concepts","bodega",
  "new-era","new_era","patta","wtaps","beams","gyakusou",
  // Additional collabs seen in the wild
  "aime-leon-dore","aime_leon","joe-freshgoods","joe_freshgoods",
  "salehe","jjjjound","norda","moncler","j-balvin","j_balvin",
  "pigalle","oth","kith","undefeated","undftd","mastermind","cactus-plant","cpfm",
  "thom-browne","thom_browne","wales-bonner","wales_bonner","humanrace","human-race",
  "end-clothing-x","end-x",
  // Luxury/designer collabs
  "stone-island","stone_island","-x-size-","-x-size/","size-x-","x-offspring","x-footpatrol",
  // Named Nike editions that are distinct products (not colourway names)
  "houseflies","doernbecher","bhm","black-history","be-true","betrue","swoosh-pack",
  "community","recreation","laser","id-custom",
];
// Variant modifier words (without punctuation, for title matching)
const VARIANT_WORDS_GLOBAL = ["dirty","premium","lux","luxe","prm","lx","se edition","sp edition","lv8","utility","shield","flyknit","flyease","crater","move to zero","easyon","easy on","craft","mid-top"];
// Variant modifier patterns for URL matching (same as in candidates filter)
const VARIANT_URL_PATTERNS = [
  "/dirty-","_dirty_","-dirty-","-dirty/",
  "/premium-","_premium_","-premium-","-premium/",
  "/lux-","_lux_","-lux-","-luxe-","/luxe-",
  "/prm-","_prm_","-prm-",
  "-lv8","_lv8","/lv8",
  "-utility","-shield","-flyknit","-flyease","-crater",
  "/sp-","_sp_","-sp-",
  // Nike Easy On — slip-on variant, not the standard model
  "-easyon","/easyon","_easyon","-easy-on","/easy-on",
  // Craft — Stadium Goods "craft" edition variant
  "-craft","/craft","_craft",
  // Mid-top height — AF1 Mid / Dunk Mid are distinct models from the standard Low
  // Only match when sandwiched by separators (e.g. /af1-mid-white) — avoids "midfoot", "midlayer" etc.
  "-mid-","/mid-","_mid_","-mid/","/mid/",
];
// Extended colour list used for colorway conflict detection in Shopping merge
// (in addition to the basic list used in candidates filtering)
const EXTENDED_COLOR_TERMS = [
  "black","white","red","blue","green","yellow","orange","purple","pink","brown",
  "grey","gray","beige","cream","navy","khaki","tan","silver","gold",
  "army","olive","sage","denim","cobalt","teal","cardinal","maroon","burgundy",
  "coral","indigo","lavender","mint","amber","terracotta","rust","ochre","moss",
  "slate","chalk","sand","smoke","stone","wheat","hay","chalk","bone",
];

const NON_RETAIL_DOMAINS = [
  /\.org\b/, /\.edu\b/, /\.gov\b/, /\.nhs\b/, /charity/, /hospice/, /foundation/,
  /wikipedia/, /reddit\.com/, /youtube\.com/, /facebook\.com/, /instagram\.com/,
  /twitter\.com/, /x\.com/, /tiktok\.com/, /pinterest\.com/,
  /trustpilot/, /glassdoor/, /indeed\.com/, /linkedin\.com/,
];

// Domains excluded from results — marketplace sellers and unverified micro-resellers
const BLOCKED_DOMAINS = new Set([
  // Marketplace — prices from third-party sellers, not reliable retail prices
  "amazon.co.uk", "amazon.com",
  // Unverified micro-resellers
  "findyourkicks.com", "luxurygoodslocker.com", "kicksmachine.com",
  "limitedresell.com", "crepcollectionclub.co.uk", "flipsupply.co.uk",
  "sportshowroom.co.uk", "hypedeconomy.co.uk", "4feetshoes.com",
  "cphsurplus.com", "trainersplus.co.uk", "sneakerfiles.com",
  "nicekicks.com", "sneakernews.com", "highsnobiety.com",
  "complex.com", "hypebeast.com",
]);

// Resale platforms where above-RRP prices are normal and should not be filtered by priceCeiling
const RESALE_PLATFORMS = new Set([
  "stockx.com", "goat.com", "laced.com", "laced.co.uk",
  "klekt.com", "stadiumgoods.com", "crepsuk.com",
  "thesolesupplier.co.uk",
]);

const AUTHORISED_RETAILERS = new Set([
  // Brand direct
  "nike.com", "adidas.co.uk", "adidas.com", "newbalance.co.uk", "newbalance.com",
  "puma.com", "reebok.com", "reebok.co.uk", "converse.com", "vans.com", "vans.co.uk",
  "timberland.com", "timberland.co.uk", "ugg.com", "crocs.com",
  "asics.com", "asics.co.uk", "saucony.com", "brooks.com", "hoka.com",
  "on-running.com", "salomon.com", "drmartens.com",
  // UK high street
  "jdsports.co.uk", "footlocker.co.uk", "schuh.co.uk", "size.co.uk",
  "offspring.co.uk", "footasylum.com", "office.co.uk", "sportsdirect.com",
  "flannels.com", "tessuti.co.uk", "scottsmenswear.com", "mainlinemenswear.co.uk",
  // UK online
  "asos.com", "endclothing.com", "selfridges.com", "harveynichols.com",
  "mrporter.com", "zalando.co.uk", "very.co.uk", "next.co.uk",
  "urbanoutfitters.com", "matchesfashion.com", "brownsfashion.com",
  // Sneaker specialist
  "sneakersnstuff.com", "solebox.com", "footpatrol.com", "hanon-shop.com",
  "klekt.com", "laced.com", "laced.co.uk", "thesolesupplier.co.uk",
  "crepsuk.com", "samedaytrainers.co.uk", "whatsyoursize.co.uk",
  "kershkicks.com", "stadiumgoods.com",
  "aphrodite1994.com", "urbanindustry.co.uk", "eightyeightstore.com",
  // Resale / global
  "stockx.com", "goat.com", "farfetch.com", "ssense.com",
  "footshop.eu", "asphaltgold.com", "bstn.com", "overkillshop.com",
  "allikestore.com", "titolo.ch", "kickz.com", "courir.com",
  "snipes.com", "sivasdescalzo.com", "nakedcph.com",
  // Clothing brands
  "carhartt-wip.com", "stoneisland.com", "cpcompany.com",
  "ralphlauren.co.uk", "ralphlauren.com", "lacoste.com",
  "levis.com", "levi.com", "fredperry.com", "tommyhilfiger.com",
  "patagonia.com", "thenorthface.com", "columbia.com", "champion.com",
  "ellesse.com", "fila.com",
  // Clothing retail
  "hm.com", "zara.com", "riverisland.com", "marksandspencer.com", "uniqlo.com", "aboutyou.co.uk",
  // Non-sneaker shoes
  "clarks.co.uk", "clarks.com", "kurtgeiger.com",
]);

const FREE_RETURNS_RETAILERS = new Set([
  "nike.com", "adidas.co.uk", "adidas.com", "jdsports.co.uk",
  "footlocker.co.uk", "asos.com", "schuh.co.uk", "size.co.uk",
  "endclothing.com", "selfridges.com", "harveynichols.com",
  "mrporter.com", "flannels.com", "footasylum.com", "office.co.uk",
  "zalando.co.uk", "whatsyoursize.co.uk",
]);


const KIDS_PATH_PATTERNS = [
  /\/kids?\//i, /\/toddler/i, /\/junior/i, /\/infant/i, /\/youth/i,
  /\/children/i, /\/boys?\//i, /\/girls?\//i, /\/baby/i,
  /[-_](kids?|junior|toddler|infant|youth|child|baby)[-_]/i,
  // Pre-school / grade-school slugs (e.g. Foot Locker "air-force-1-low-ez-pre-school-shoes")
  /pre-school/i, /grade-school/i,
  // Nike/Adidas size codes for grade school, preschool, toddler
  /\/gs\//i, /\/ps\//i, /\/td\//i,
  /[-_]gs[-_]/i, /[-_]ps[-_]/i, /[-_]td[-_]/i,
  /-gs$/i, /_gs$/i, /-ps$/i,
  /\/grade-?school/i, /\/pre-?school/i,
  /kids?$/i, /junior$/i,
];

const TRUST_RATINGS: Record<string, number> = {
  // Brand direct (UK Trustpilot scores)
  "nike.com": 1.6, "adidas.co.uk": 1.9, "adidas.com": 1.9,
  "newbalance.com": 2.1, "newbalance.co.uk": 2.1, "puma.com": 2.3, "reebok.com": 2.0, "reebok.co.uk": 2.0,
  "converse.com": 1.8, "vans.com": 1.9, "vans.co.uk": 1.9, "timberland.com": 2.2, "timberland.co.uk": 2.2,
  "asics.com": 2.8, "asics.co.uk": 2.8, "hoka.com": 3.2, "on-running.com": 3.5, "saucony.com": 2.5,
  "drmartens.com": 2.4,
  // UK high street (Trustpilot UK scores — verified 2025)
  "jdsports.co.uk": 2.0, "footlocker.co.uk": 1.5, "asos.com": 1.9,
  "endclothing.com": 4.3, "size.co.uk": 3.9, "offspring.co.uk": 4.2,
  "schuh.co.uk": 4.6, "amazon.co.uk": 1.4, "ebay.co.uk": 1.3,
  "flannels.com": 2.0, "tessuti.co.uk": 2.1, "selfridges.com": 2.0, "footasylum.com": 4.2,
  "sportsdirect.com": 2.0, "office.co.uk": 1.7, "next.co.uk": 3.8,
  "zalando.co.uk": 2.3, "very.co.uk": 1.8, "urbanoutfitters.com": 2.5,
  "mainlinemenswear.co.uk": 4.5, "scottsmenswear.com": 4.3,
  // Sneaker specialist
  "stockx.com": 3.7, "goat.com": 3.4, "laced.com": 4.3, "laced.co.uk": 4.3,
  "klekt.com": 4.0, "thesolesupplier.co.uk": 4.3,
  "sneakersnstuff.com": 3.2, "solebox.com": 3.4, "whatsyoursize.co.uk": 4.1,
  "footpatrol.com": 4.0, "hanon-shop.com": 3.8,
  "crepsuk.com": 4.0, "samedaytrainers.co.uk": 4.9,
  "kershkicks.com": 4.2, "stadiumgoods.com": 3.5,
  "urbanindustry.co.uk": 4.1, "aphrodite1994.com": 3.9,
  // Luxury
  "harveynichols.com": 2.0, "mrporter.com": 3.6, "selfridges.com": 2.0,
  "matchesfashion.com": 3.8, "farfetch.com": 4.0, "ssense.com": 3.2,
  "brownsfashion.com": 3.5,
  // European
  "asphaltgold.com": 4.1, "bstn.com": 3.8, "footshop.eu": 3.7,
  "overkillshop.com": 3.6, "snipes.com": 3.5, "courir.com": 3.2,
};

// ─── Delivery times per retailer ─────────────────────────────
const DELIVERY_TIMES: Record<string, string> = {
  // Express/next-day capable
  "asos.com": "1-3 days",
  "next.co.uk": "1-2 days",
  "very.co.uk": "2-3 days",
  // Standard UK retailers
  "jdsports.co.uk": "2-4 days",
  "footlocker.co.uk": "3-5 days",
  "size.co.uk": "2-4 days",
  "offspring.co.uk": "2-4 days",
  "schuh.co.uk": "2-4 days",
  "office.co.uk": "2-4 days",
  "footasylum.com": "2-4 days",
  "endclothing.com": "2-4 days",
  "flannels.com": "2-4 days",
  "selfridges.com": "2-4 days",
  "harveynichols.com": "2-4 days",
  "mrporter.com": "1-3 days",
  "zalando.co.uk": "2-3 days",
  "sportsdirect.com": "3-5 days",
  "tessuti.co.uk": "3-5 days",
  "whatsyoursize.co.uk": "2-4 days",
  "thesolesupplier.co.uk": "3-5 days",
  "laced.com": "2-4 days",
  "klekt.com": "3-6 days",
  "crepsuk.com": "2-4 days",
  "samedaytrainers.co.uk": "same day / next day",
  // Brand direct
  "nike.com": "3-5 days",
  "adidas.co.uk": "3-5 days",
  "adidas.com": "3-5 days",
  "newbalance.com": "3-5 days",
  "converse.com": "3-5 days",
  "vans.com": "3-5 days",
  // International resellers
  "stockx.com": "7-14 days",
  "goat.com": "7-14 days",
  "farfetch.com": "3-7 days",
  "sneakersnstuff.com": "5-10 days",
  "solebox.com": "5-10 days",
  "matchesfashion.com": "2-4 days",
};

function getDeliveryTime(domain: string, isUk: boolean): string {
  return DELIVERY_TIMES[domain] ?? (isUk ? "2-5 days" : "7-14 days");
}

// UK Import Duty rules (post-Brexit):
// - Items under £135: no customs duty (VAT collected at point of sale by retailer)
// - Items £135+: customs duty applies (~12% footwear/clothing) + 20% VAT on (item + duty)
// Most compliant international retailers collect UK VAT at checkout, so we only add duty for £135+
function calculateDuties(itemPrice: number, isUk: boolean): number {
  if (isUk) return 0;
  if (itemPrice < 135) return 0; // duty-free threshold
  return Number((itemPrice * 0.12).toFixed(2)); // ~12% for footwear/clothing
}

// ─── URL / Domain Helpers ────────────────────────────────────
function isComparisonSite(url: string): boolean {
  const lower = url.toLowerCase();
  return EXCLUDED_DOMAINS.some((d) => lower.includes(d));
}

function isLikelyProductPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const { pathname, search } = parsed;
    // Blog subdomains are never product pages
    if (/^blog\./i.test(parsed.hostname)) return false;
    if (NON_PRODUCT_PATH_PATTERNS.some((p) => p.test(pathname))) return false;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 1) return false;
    if (/[?&](q|query|search|s|teamsport|category|filter|sort|facet|refinement|department)=/i.test(search)) return false;
    if (segments.length === 1) {
      const last = segments[0];
      if (!/\d/.test(last) && last.length <= 20) return false;
    }
    // Adidas category pages have no product code and no .html extension
    const hostname = parsed.hostname.replace(/^www\./, "").replace(/^(uk|gb)\./i, "");
    if ((hostname === "adidas.co.uk" || hostname === "adidas.com")
        && !pathname.match(/\d/) && !pathname.endsWith(".html")) return false;
    // Laced brand/model category pages: /nike/air-force-1 (exactly 2 word-only segments)
    if (hostname === "laced.com" && segments.length === 2 && !/\d/.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeRetailerDomain(input: string): string | null {
  const cleaned = (input || "").replace(/\s+/g, "").trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/^m\./, "")
    .split("/")[0];
  if (!cleaned || !cleaned.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(cleaned)) return null;
  return cleaned;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
  } catch {
    return "";
  }
}

function retailerNameFromDomain(domain: string): string {
  // Strip mobile and locale/country subdomains: uk.puma.com → puma.com
  let cleanDomain = domain.replace(/^m\./, "");
  cleanDomain = cleanDomain.replace(/^(uk|us|eu|de|fr|it|es|nl|au|ca|en|gb)\./i, "");
  const root = cleanDomain.split(".")[0].replace(/[-_]+/g, " ");
  return root.split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ") || "Unknown Retailer";
}

function isUkDomain(domain: string): boolean {
  return domain.endsWith(".uk") || domain.includes(".co.uk") || UK_COM_RETAILERS.has(domain)
    || /^(uk|gb)\./i.test(domain); // e.g. uk.puma.com, gb.adidas.com
}

function isKidsProduct(url: string, text: string): boolean {
  if (KIDS_PATH_PATTERNS.some((p) => p.test(url))) return true;
  const titleArea = text.slice(0, 500).toLowerCase();
  // Standard keywords
  if (/\b(toddler|infant|kids?|junior|youth|children'?s?|grade\s*school|preschool)\b/.test(titleArea)) return true;
  // Common retailer-specific patterns: "(J)", "Juniors", "Junior Sizes", "GS", size ranges like "3Y-7Y"
  if (/\(j(unior)?\)|\bjuniors?\b|size\s*[0-9]+y\b|\b[0-9]y\s*-/.test(titleArea)) return true;
  return false;
}

function isSecondhand(url: string, text: string): boolean {
  if (/\/itm\/|condition=used/i.test(url)) return true;
  const topContent = text.slice(0, 600).toLowerCase();
  return /\b(used|pre-?owned|second.?hand|worn|condition:\s*(good|fair|poor|acceptable|very good))\b/i.test(topContent);
}

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = ["srsltid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "dclid", "msclkid", "ref", "affiliate"];
    for (const p of trackingParams) parsed.searchParams.delete(p);
    return parsed.toString();
  } catch { return url; }
}

function getTrustRating(domain: string): number | null {
  return TRUST_RATINGS[domain] ?? null;
}

// Coupon codes must be uppercase alphanumeric, 4-20 chars
// Rejects AI hallucinations like "EXTRA10OFF at checkout" or full sentences
function isValidCouponCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  return /^[A-Z0-9_-]{4,20}$/.test(trimmed);
}

// ─── AI-based price extraction ───────────────────────────────
async function extractPricesWithAI(
  candidates: Array<{ url: string; markdown?: string; description?: string; title?: string }>,
  productName: string,
  apiKey: string,
  estimatedRrp?: number
): Promise<Array<{ index: number; current_price_gbp: number; original_price_gbp: number | null; in_stock: boolean | null; coupon_code: string | null; price_confidence: string | null }>> {
  if (!candidates.length) return [];

  // Use more content for pages we fully scraped (markdown) vs snippet-only (description)
  const candidateText = candidates.map((s, i) => {
    const content = s.markdown
      ? s.markdown.slice(0, 3000)          // full scrape — use generous slice
      : (s.description || "").slice(0, 500); // snippet only — keep short
    return `[${i + 1}] URL: ${s.url}\nTitle: ${s.title || "(no title)"}\nContent: ${content}`;
  }).join("\n---\n");

  const rrpHint = estimatedRrp ? ` The estimated retail price is £${estimatedRrp}.` : "";
  const sizeHint = productName.match(/\b(UK|US|EU)\s*\d+\.?\d*/i)?.[0];
  const sizeInstruction = sizeHint
    ? ` The customer wants size ${sizeHint}. Size ONLY affects in_stock: mark in_stock true if ${sizeHint} is explicitly available, false if it's explicitly sold out for that size, null if size info is not mentioned. Size does NOT affect is_correct_product — a general product page with no size detail is still is_correct_product: true.`
    : "";
  const genderRaw2 = productName.match(/\b(men'?s?|women'?s?)\b/i)?.[0]?.toLowerCase() ?? "";
  const wantsMens2 = !!genderRaw2 && genderRaw2.startsWith("men") && !genderRaw2.startsWith("women");
  const wantsWomens2 = !!genderRaw2 && genderRaw2.startsWith("women");
  const genderInstruction = wantsMens2
    ? " The customer wants MEN'S — reject women's, kids', grade school, and junior versions."
    : wantsWomens2
    ? " The customer wants WOMEN'S — reject men's, kids', grade school, and junior versions."
    : " Reject women's, kids', grade school, junior, and toddler versions. If the page is explicitly labelled as women's or girls', set is_correct_product: false.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a strict price extraction specialist for a UK price comparison website.${rrpHint}${sizeInstruction}${genderInstruction}

The user is searching for: "${productName}"

For each numbered candidate, extract price data and return a JSON array. Rules:

is_correct_product: true ONLY if ALL of these are true:
  1. The page is a specific product listing (not a category, collection, or search results page)
  2. The model matches AND the colourway is compatible. Common equivalents: "Cloud White"="White"="Triple White"="White/White/White", "Core Black"="Black"="Triple Black"="Black/Black/Black", "Cream"="Ivory"="Natural", "Grey"="Gray"="Smoke Grey". RULE: only reject if the page CLEARLY shows a DIFFERENT primary colour (e.g. searching White but page shows Red, Blue, Green, Yellow, Pink, Orange). If the colourway is not explicitly stated but the model name matches, set is_correct_product: true.
  3. Brand new condition (not used, pre-owned, or refurbished)
  4. Correct gender and age group (not kids, junior, grade school, toddler unless searched for)
  5. NOT a collaboration or designer variant the user did not ask for. If the user searched for "Triple White" and the page shows "Supreme x Air Force 1" or "Off-White x Nike" or any named collab (Supreme, Sacai, Travis Scott, Dior, Fragment, KAWS, CDG, Stüssy, Palace, NOCTA, etc.) → set is_correct_product: false.
  6. NOT a product variant modifier the user did not ask for. "Dirty Triple White", "Premium", "Lux", "LX", "SP", "SE" versions are DIFFERENT products — if the user did not include those words in their search, reject them.
  REJECT if: wrong colourway/model, collaboration not searched for, variant modifier not searched for, kids/GS/PS/TD version, secondhand, category page, wrong gender.

current_price_gbp: the current selling/add-to-cart price in GBP.
  - If shown in £, use directly.
  - If EUR: multiply by 0.85, set price_confidence "low".
  - If USD: multiply by 0.79, set price_confidence "low".
  - Do NOT guess or estimate — if no price visible, return null.

price_confidence: "high" if price clearly stated in GBP. "low" if converted or uncertain. null if no price found.
original_price_gbp: the crossed-out/was price if explicitly shown and higher than current price, else null.
in_stock: true if the text explicitly says "in stock", "available", "add to bag/cart" or similar positive availability. false if "sold out", "out of stock", "unavailable", or "notify me" shown. null if stock status is not mentioned.
coupon_code: exact visible promo/discount code text (e.g. "EXTRA10"), null if none visible.

CRITICAL: Never hallucinate prices. Only return a price number if you can see it on the page.

Return ONLY a raw JSON array (no markdown, no explanation):
[{"index":1,"is_correct_product":true,"current_price_gbp":90.00,"price_confidence":"high","original_price_gbp":null,"in_stock":true,"coupon_code":null},...]`,
          },
          { role: "user", content: candidateText },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI price extraction HTTP error:", response.status, errText.slice(0, 500));
      return [];
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    if (!content) {
      console.error("AI returned empty content. Response:", JSON.stringify(aiData).slice(0, 500));
      return [];
    }

    // Parse JSON — try array directly, then look for a "results" key
    let allResults: any[] = [];
    try {
      const parsed = JSON.parse(content);
      allResults = Array.isArray(parsed) ? parsed : (parsed.results || parsed.data || []);
    } catch {
      // Try extracting JSON array from text
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try { allResults = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    const valid = allResults.filter((r: any) => {
      if (!r.is_correct_product) return false;
      if (r.in_stock === false) return false;
      if (typeof r.current_price_gbp !== "number") return false;
      // Price sanity: if we know the retail price, reject anything below 60% of it
      // (likely a junior/GS version or wrong product)
      if (estimatedRrp && r.current_price_gbp < estimatedRrp * 0.6) return false;
      return true;
    });

    log(`AI returned ${allResults.length} total, ${valid.length} valid.`);

    return valid;
  } catch (e) {
    console.error("AI price extraction failed:", e);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Rate Limiter ────────────────────────────────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 40; // 40 requests per minute per IP

function checkRateLimit(req: Request): Response | null {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = rateLimits.get(clientIp);
  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) },
      });
    }
    entry.count++;
  } else {
    rateLimits.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
  if (rateLimits.size > 1000) {
    for (const [ip, e] of rateLimits) { if (now > e.resetAt) rateLimits.delete(ip); }
  }
  return null;
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  // corsHeaders is already a module-level const
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { product_name, retailers: retailersInput, skip_cache, estimated_retail_price, gender } = body;
    let retailers = retailersInput;

    // Input validation
    if (!product_name || typeof product_name !== "string") {
      return new Response(JSON.stringify({ error: "product_name is required and must be a string" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (product_name.length > 300) {
      return new Response(JSON.stringify({ error: "product_name too long (max 300 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(retailers) || !retailers.length) {
      return new Response(JSON.stringify({ error: "retailers array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (retailers.length > 30) {
      retailers = retailers.slice(0, 30);
    }
    // Validate retailer format (must look like domain names)
    for (let i = 0; i < retailers.length; i++) {
      retailers[i] = typeof retailers[i] === "string" ? retailers[i].trim() : retailers[i];
      const r = retailers[i];
      if (typeof r !== "string" || r.length === 0 || r.length > 100 || !/^[a-zA-Z0-9._\-:/]+$/.test(r)) {
        return new Response(JSON.stringify({ error: "Invalid retailer format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (estimated_retail_price !== undefined && (typeof estimated_retail_price !== "number" || estimated_retail_price < 0 || estimated_retail_price > 100000)) {
      return new Response(JSON.stringify({ error: "Invalid estimated_retail_price" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedRetailers = Array.from(
      new Set((retailers as string[]).map(normalizeRetailerDomain).filter(Boolean) as string[])
    );

    if (!normalizedRetailers.length) {
      return new Response(JSON.stringify({ error: "No valid retailer domains provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip sizing info and SKU/style codes for search queries
    // e.g. "Nike Air Max Dn 'All Night' (DV8212-001) Men's UK 9" → "Nike Air Max Dn All Night"
    const searchName = product_name
      .replace(/\b(men'?s?|women'?s?|unisex)\b/gi, "")
      .replace(/\b(UK|US|EU)\s*\d+\.?\d*/gi, "")
      .replace(/\bsize\s*\d+\.?\d*/gi, "")
      // Strip SKU/style codes in parentheses or brackets: (DV8212-001), [BQ6806-101]
      .replace(/[\[(][A-Z]{1,4}[-_]?\d{3,}[-]\d{3,}[\])]/gi, "")
      // Strip any remaining parenthesised codes shorter than 20 chars
      .replace(/\([^)]{1,20}\)/g, "")
      // Remove surrounding single quotes from colourway names: 'All Night' → All Night
      .replace(/'([^']+)'/g, "$1")
      // Strip lone apostrophes (e.g. '07 → 07) that break search queries
      .replace(/'/g, "")
      // AF1 is always low-top — "Low" over-constrains Shopping queries and splits the cache key
      .replace(/\b(Air Force 1(?:\s+\d+)?)\s+Low\b/gi, "$1")
      .replace(/\s{2,}/g, " ").trim();

    // ── Cache check ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env vars not configured");
    const sb = createClient(supabaseUrl, supabaseKey);
    // Include size AND gender in cache key so Men's UK 9 and Women's UK 9 don't share a cache
    const sizeMatch = product_name.match(/\b(UK|US|EU)\s*\d+\.?\d*/i) || product_name.match(/\bsize\s*\d+\.?\d*/i);
    const sizeKey = sizeMatch ? `-${sizeMatch[0].toLowerCase().replace(/\s+/g, "")}` : "";
    const genderMatch = product_name.match(/\b(men'?s?|women'?s?|unisex)\b/i);
    const genderKey = genderMatch ? `-${genderMatch[0].toLowerCase().replace(/\W/g, "")}` : "";
    const cacheKey = `${searchName.toLowerCase().trim()}${genderKey}${sizeKey}`;

    // Query 30-day historical low + daily history from price_history table
    const getThirtyDayLow = async (key: string): Promise<{ low: number | null; history: Array<{ date: string; price: number }> }> => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await sb.from("price_history").select("results, checked_at")
          .eq("product_key", key).gte("checked_at", thirtyDaysAgo).order("checked_at", { ascending: true }).limit(100);
        let low: number | null = null;
        const dayMap = new Map<string, number>(); // date -> best price that day
        for (const row of (data || [])) {
          const date = (row.checked_at as string).slice(0, 10); // YYYY-MM-DD
          for (const r of (row.results as any[] || [])) {
            if (typeof r.totalYouPay === "number") {
              if (low === null || r.totalYouPay < low) low = r.totalYouPay;
              const existing = dayMap.get(date);
              if (existing === undefined || r.totalYouPay < existing) dayMap.set(date, r.totalYouPay);
            }
          }
        }
        const history = Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, price]) => ({ date, price }));
        return { low, history };
      } catch { return { low: null, history: [] }; }
    };

    let cachedResults: any[] = [];
    let cachedCreatedAt: string | undefined;

    if (!skip_cache) {
      // ── Stale-while-revalidate cache strategy ──
      // 1. Fresh cache (<6h) → return immediately, no background work needed.
      // 2. Stale cache (6h–48h) → return immediately to the user, fire a background
      //    self-invoke to refresh the cache so the *next* visitor gets fresh data.
      // 3. No cache or very old (>48h) → do a full synchronous scrape.

      // Fetch the most recent cache entry for this product (no TTL filter yet)
      const { data: anyCache } = await sb
        .from("price_cache")
        .select("results, created_at")
        .eq("product_key", cacheKey)
        .maybeSingle();

      cachedResults = Array.isArray(anyCache?.results) ? anyCache.results : [];
      cachedCreatedAt = anyCache?.created_at;

      if (cachedResults.length >= MIN_CACHE_RESULTS && cachedCreatedAt) {
        const ageMs = Date.now() - new Date(cachedCreatedAt).getTime();
        const SIX_HOURS = 6 * 60 * 60 * 1000;
        const FORTY_EIGHT_HOURS = 7 * 24 * 60 * 60 * 1000; // extended to 7 days for resilience (Serper outages etc.)

        if (ageMs <= SIX_HOURS) {
          // Fresh — return immediately
          log(`Cache hit (fresh) for: ${cacheKey}`);
          const { low: thirtyDayLow, history: priceHistory } = await getThirtyDayLow(cacheKey);
          return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, cached_at: cachedCreatedAt, thirtyDayLow, priceHistory }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (ageMs <= FORTY_EIGHT_HOURS) {
          // Stale — return immediately AND kick off a background refresh
          log(`Cache hit (stale, ${Math.round(ageMs / 3600000)}h old) for: ${cacheKey} — triggering background refresh`);
          const { low: thirtyDayLow, history: priceHistory } = await getThirtyDayLow(cacheKey);

          // Fire background self-invoke with skip_cache: true so it scrapes fresh and writes to cache
          const bgRefresh = fetch(`${supabaseUrl}/functions/v1/price-scrape`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") ?? ""}`,
            },
            body: JSON.stringify({ product_name, retailers: normalizedRetailers, estimated_retail_price, gender, skip_cache: true }),
            signal: AbortSignal.timeout(140_000),
          }).catch(() => {}); // fire-and-forget — we don't need the result
          // Keep the function alive until the background refresh completes if supported
          (globalThis as any).EdgeRuntime?.waitUntil?.(bgRefresh);

          return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, stale: true, cached_at: cachedCreatedAt, thirtyDayLow, priceHistory }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Cache is >48h old — fall through to full synchronous scrape
        // cachedResults is kept so we can use it as a fallback if fresh results are sparse
        log(`Cache expired (${Math.round(ageMs / 3600000)}h old) for: ${cacheKey} — scraping fresh`);
      }
    }

    // ── Affiliate feed query (runs in parallel with Firecrawl) ──
    // Returns structured results from the affiliate_products table (populated by feed-ingest).
    // Falls back gracefully to [] if the table doesn't exist or is empty.
    const queryAffiliateFeed = async (): Promise<any[]> => {
      try {
        const { data, error } = await sb
          .from("affiliate_products")
          .select("merchant, product_name, brand, price, rrp, deep_link, in_stock")
          .textSearch("product_name", searchName, { type: "websearch", config: "english" })
          .order("price", { ascending: true })
          .limit(30);
        if (error || !data?.length) return [];
        const feedResults: any[] = [];
        for (const row of data) {
          const domain = extractDomain(row.deep_link);
          if (!domain) continue;
          const baseDomain = domain.replace(/^(uk|gb|us|eu|de|fr|m)\./i, "");
          const isKnown = normalizedRetailers.some(r => domain === r || baseDomain === r)
            || AUTHORISED_RETAILERS.has(domain) || AUTHORISED_RETAILERS.has(baseDomain);
          if (!isKnown) continue;
          const itemPrice = Number(row.price);
          if (!itemPrice || isNaN(itemPrice)) continue;
          const uk = isUkDomain(domain);
          const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
          const duties = calculateDuties(itemPrice, uk);
          feedResults.push({
            retailer: getRetailerName(domain),
            country: uk ? "UK" : "International",
            flag: uk ? "🇬🇧" : "🌍",
            itemPrice,
            shipping,
            duties,
            totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
            originalPrice: row.rrp && Number(row.rrp) > itemPrice ? Number(row.rrp) : null,
            delivery: getDeliveryTime(domain, uk),
            trustRating: getTrustRating(domain),
            currency: "GBP",
            url: row.deep_link,
            inStock: row.in_stock,
            checkedAt: new Date().toISOString(),
            couponCode: null,
            priceConfidence: "high",
            retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
              : TRUST_RATINGS[domain] ? "trusted" : "unverified",
            freeReturns: FREE_RETURNS_RETAILERS.has(domain),
          });
        }
        return feedResults;
      } catch { return []; }
    };

    // ── Search (Serper) + Scraping (Jina AI) ──
    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY") || "";

    const LOVABLE_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Step 1: URL discovery via Serper — Google-backed, 1 credit per search (vs ~20 credits per Firecrawl search)
    const doSerperSearch = async (query: string, num = 10): Promise<Array<{ url: string; title: string; description: string; markdown: string }>> => {
      if (!SERPER_API_KEY) return [];
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const r = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ q: query, gl: "gb", hl: "en", num }),
        });
        if (!r.ok) {
          const errText = await r.text().catch(() => "");
          console.error(`Serper web search HTTP ${r.status}: ${errText.slice(0, 200)}`);
          return [];
        }
        const data = await r.json();
        return (data.organic || []).map((item: any) => ({
          url: item.link || "",
          title: item.title || "",
          description: item.snippet || "",
          markdown: "",
        }));
      } catch { return []; }
      finally { clearTimeout(timeout); }
    };

    // Step 2: scrape a product page using Jina AI reader (free, no credits)
    const scrapeProductPage = async (url: string): Promise<string> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await fetch(`https://r.jina.ai/${url}`, {
          method: "GET",
          headers: {
            "Accept": "text/markdown",
            "X-Return-Format": "markdown",
            "X-Timeout": "10",
          },
          signal: controller.signal,
        });
        if (!r.ok) return "";
        const text = await r.text();
        return text.slice(0, 5000) || "";
      } catch { return ""; }
      finally { clearTimeout(timeout); }
    };

    log(`Searching for: "${searchName}"`);

    // ── Serper Shopping — Google's pre-extracted prices (bypasses scraping entirely) ──
    const doSerperShopping = async (query: string): Promise<any[]> => {
      if (!SERPER_API_KEY) return [];
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const r = await fetch("https://google.serper.dev/shopping", {
            method: "POST",
            headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ q: query, gl: "gb", hl: "en", num: 40 }),
            signal: AbortSignal.timeout(10000),
          });
          if (!r.ok) {
            console.error(`Shopping API HTTP ${r.status} on attempt ${attempt}`);
            continue;
          }
          const data = await r.json();
          const results = data.shopping || [];
          if (results.length === 0 && attempt < 2) {
            log(`Shopping returned 0 results on attempt ${attempt}, retrying...`);
            continue;
          }
          return results;
        } catch (e: any) {
          const isTimeout = e?.name === "TimeoutError" || e?.message?.includes("timeout");
          console.error(`Shopping API ${isTimeout ? "timed out" : "failed"} on attempt ${attempt}:`, e?.message);
        }
      }
      return [];
    };

    // ── URL discovery — parallel Serper searches ──
    // Broader Shopping fallback — strips colourway words so more retailers surface
    const searchNameNoColour = searchName
      .replace(/\b(triple\s+white|white|black|grey|navy|red|blue|green|pink|cream|beige|brown|tan|yellow|orange|purple|volt|infrared|bred|panda|mocha|hemp|wheat|sail|bone|cement|silver|gold|platinum|obsidian|royal|university|chicago|off.white)\b/gi, "")
      .replace(/\s{2,}/g, " ").trim();

    const [
      shoppingResults,
      shoppingFallback,
      broadResults1,
      broadResults2,
      // Dedicated single-retailer searches — these always surface JD Sports / Nike product URLs
      // even when the OR-combined queries don't have room for them. Run first so dedup keeps these URLs.
      dedicatedJD,
      dedicatedNikeFL,
      ukResults1,
      ukResults2,
      ukResults3,
      boutiqueResults,
      resaleResults,
      clothingResults,
      feedResults,
    ] = await Promise.all([
      doSerperShopping(searchName), // Google Shopping — primary price source (num: 40)
      searchNameNoColour !== searchName ? doSerperShopping(searchNameNoColour) : Promise.resolve([]), // broader fallback
      doSerperSearch(`${searchName} buy UK price`, 20),
      doSerperSearch(`${searchName} buy UK`, 20),
      // Dedicated searches for highest-priority retailers most often missed by OR queries
      doSerperSearch(`${searchName} site:jdsports.co.uk`, 5),
      doSerperSearch(`${searchName} site:footlocker.co.uk OR site:schuh.co.uk OR site:size.co.uk`, 5),
      // UK high street sneaker retailers
      doSerperSearch(`${searchName} site:jdsports.co.uk OR site:size.co.uk OR site:schuh.co.uk OR site:footlocker.co.uk OR site:offspring.co.uk OR site:office.co.uk`, 10),
      doSerperSearch(`${searchName} site:footasylum.com OR site:endclothing.com OR site:asos.com OR site:zalando.co.uk OR site:flannels.com OR site:nike.com OR site:adidas.co.uk OR site:newbalance.co.uk`, 10),
      // Additional UK retailers often missed by Shopping API
      doSerperSearch(`${searchName} site:crepsuk.com OR site:footpatrol.com OR site:size.co.uk OR site:office.co.uk OR site:schuh.co.uk OR site:very.co.uk OR site:next.co.uk`, 10),
      // Sneaker boutiques
      doSerperSearch(`${searchName} site:sneakersnstuff.com OR site:solebox.com OR site:hanon-shop.com OR site:asphaltgold.com OR site:bstn.com OR site:overkillshop.com`, 10),
      // Resale
      doSerperSearch(`${searchName} site:stockx.com OR site:goat.com OR site:klekt.com OR site:laced.com OR site:laced.co.uk OR site:thesolesupplier.co.uk`, 10),
      // Clothing retailers — brand direct + department stores
      doSerperSearch(`${searchName} site:thenorthface.com OR site:patagonia.com OR site:carhartt-wip.com OR site:stoneisland.com OR site:cpcompany.com OR site:next.co.uk OR site:very.co.uk OR site:selfridges.com OR site:mrporter.com OR site:harveynichols.com`, 10),
      queryAffiliateFeed(),
    ]);

    const seenUrls = new Set<string>();
    const rawCandidates: Array<{ url: string; title: string; markdown: string; description: string }> = [];

    // Dedicated single-retailer results first (highest precision) → OR-combined → broad last
    for (const results of [dedicatedJD, dedicatedNikeFL, ukResults1, ukResults2, ukResults3, boutiqueResults, resaleResults, clothingResults, broadResults1, broadResults2]) {
      for (const item of results) {
        if (item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          rawCandidates.push(item);
        }
      }
    }

    log(`Found ${rawCandidates.length} unique URLs`);

    // Extract gender intent — prefer explicit param, fall back to product name
    const genderParam = (gender as string | undefined)?.toLowerCase().trim();
    const genderFromName = product_name.match(/\b(men'?s?|women'?s?)\b/i)?.[0]?.toLowerCase() ?? "";
    const wantsMens = genderParam === "men" || genderParam === "male"
      || (!genderParam && !!genderFromName && genderFromName.startsWith("men") && !genderFromName.startsWith("women"));
    const wantsWomens = genderParam === "women" || genderParam === "female"
      || (!genderParam && !!genderFromName && genderFromName.startsWith("women"));

    // Filter to clean product pages only
    const candidates = rawCandidates.filter((s) => {
      if (!s.url || isComparisonSite(s.url)) return false;
      const domain = extractDomain(s.url);
      if (!domain || NON_RETAIL_DOMAINS.some((p) => p.test(domain))) return false;
      if (BLOCKED_DOMAINS.has(domain)) return false;
      // Accept URLs from target retailers OR known authorised retailers
      // (broad queries may surface extra stockists beyond the requested list)
      const baseDomain = domain.replace(/^(uk|gb|us|eu|de|fr|m)\./i, "");
      const isKnownRetailer = normalizedRetailers.some(r => domain === r || baseDomain === r)
        || AUTHORISED_RETAILERS.has(domain) || AUTHORISED_RETAILERS.has(baseDomain);
      if (!isKnownRetailer) return false;
      if (!isLikelyProductPage(s.url)) return false;
      if (isKidsProduct(s.url, s.title + " " + s.description)) return false;
      if (isSecondhand(s.url, s.title + " " + s.description)) return false;
      // Reject non-GB storefronts (e.g. asos.com/us/, nike.com/us/)
      if (/\/(us|au|ca|de|fr|it|es|nl)\//.test(s.url) && !s.url.includes(".co.uk")) return false;
      // Gender filtering — reject opposite-gender URLs/titles
      const urlLower = s.url.toLowerCase();
      const titleLower = (s.title || "").toLowerCase();
      const WOMENS_URL_RE = /\/womens?[-_/]|[-_]womens?[-_/]|\/women\/|[-_]wmns[-_/]|[-_]wmns$|\/wmns\/|-w-\d/;
      const WOMENS_TITLE_RE = /\b(women'?s?|womens?|girls?)\b/;
      if (wantsMens && WOMENS_URL_RE.test(urlLower)) return false;
      if (wantsMens && WOMENS_TITLE_RE.test(titleLower)) return false;
      // ASOS "unisex" trainers use women's UK sizing — reject for men's searches
      if (wantsMens && /unisex/i.test(urlLower + " " + titleLower) && extractDomain(s.url) === "asos.com") return false;
      if (wantsWomens && /\/mens?[-_/]|[-_]mens?[-_/]|\/men\//.test(urlLower)) return false;
      // When gender is unspecified, still reject clearly women's-specific pages
      if (!wantsMens && !wantsWomens) {
        if (WOMENS_URL_RE.test(urlLower)) return false;
        if (WOMENS_TITLE_RE.test(titleLower)) return false;
      }

      // ── Collaboration / variant filter ──────────────────────────────────────
      // Reject URLs that reference a collaboration or product variant the user
      // did NOT ask for. "supreme-white" when searching "Triple White" is a
      // completely different (and more expensive) product.
      // Collab names: known designer/brand collabs that produce different SKUs.
      // Variant modifiers: "dirty", "premium", "lux/luxe", "prm", "se ", "sp "
      //   that indicate a different model version.
      const COLLAB_NAMES = COLLAB_NAMES_GLOBAL;
      // Use the shared VARIANT_URL_PATTERNS so both candidate filter and Shopping merge stay in sync
      const VARIANT_MODIFIERS = VARIANT_URL_PATTERNS;
      // Only apply if these words are NOT in what the user searched for
      const searchLower = searchName.toLowerCase();
      const hasCollab = COLLAB_NAMES.some(c => urlLower.includes(c) && !searchLower.includes(c));
      const hasVariant = VARIANT_MODIFIERS.some(v => urlLower.includes(v) && !searchLower.includes(v.replace(/[-_/]/g, "")));
      if (hasCollab || hasVariant) return false;

      return true;
    });

    // ── Colorway URL filtering — reject URLs containing conflicting colour words ──
    const COLOR_LIST = ["black","white","red","blue","green","yellow","orange","purple","pink","brown","grey","gray","beige","cream","navy","khaki","tan","silver","gold","denim","camo","floral","leopard"];
    const searchColors = COLOR_LIST.filter(c => searchName.toLowerCase().includes(c));
    const conflictColors = COLOR_LIST.filter(c => !searchColors.includes(c));

    const colorFilteredCandidates = searchColors.length > 0
      ? candidates.filter((s) => {
          const urlSlug = s.url.toLowerCase();
          return !conflictColors.some(c => {
            // URL slug only — separator-bounded to avoid false positives in titles/descriptions
            // (e.g. "available in black and white" would wrongly reject Triple White results)
            const slugPattern = new RegExp(`[-_/]${c}[-_/]|[-_]${c}$|^${c}[-_]`, "i");
            return slugPattern.test(urlSlug);
          });
        })
      : candidates;

    log(`${colorFilteredCandidates.length} candidates after colour filtering (${candidates.length - colorFilteredCandidates.length} colour conflicts removed)`);

    // Deduplicate by domain — keep one URL per retailer (the first/best found)
    const seenDomains = new Set<string>();
    const enrichedCandidates = colorFilteredCandidates.filter(c => {
      const d = extractDomain(c.url);
      if (seenDomains.has(d)) return false;
      seenDomains.add(d);
      return true;
    });

    log(`${enrichedCandidates.length} candidates after domain dedup`);

    // ── Step 2: smart scraping — skip pages whose snippet already has a clear price ──
    // This avoids wasting time scraping pages that already returned price data in their snippet.
    const TOP_N_SCRAPE = 15;
    const SNIPPET_PRICE_RE = /£\s?\d{2,4}(?:\.\d{2})?/;
    const toProcess = enrichedCandidates.slice(0, TOP_N_SCRAPE);
    const needsScraping = toProcess.filter(c => !SNIPPET_PRICE_RE.test((c.description || "") + " " + (c.markdown || "")));
    const hasSnippetPrice = toProcess.filter(c => SNIPPET_PRICE_RE.test((c.description || "") + " " + (c.markdown || "")));
    log(`Scraping ${needsScraping.length} pages (${hasSnippetPrice.length} already have price in snippet)`);
    const scrapedMarkdowns = await Promise.all(needsScraping.map(c => scrapeProductPage(c.url)));
    const scrapedCandidates = toProcess.map((c) => {
      const idx = needsScraping.findIndex(n => n.url === c.url);
      if (idx !== -1) return { ...c, markdown: scrapedMarkdowns[idx] || c.markdown || "" };
      return { ...c, markdown: c.markdown || c.description || "" };
    });
    log(`Scraped ${scrapedMarkdowns.filter(Boolean).length}/${needsScraping.length} pages`);

    // ── AI extracts and validates prices (parallel batches of 8) ──
    const BATCH_SIZE = 8;
    const batches: typeof scrapedCandidates[] = [];
    for (let i = 0; i < scrapedCandidates.length; i += BATCH_SIZE) {
      batches.push(scrapedCandidates.slice(i, i + BATCH_SIZE));
    }
    const batchResults = await Promise.all(
      batches.map((batch, bi) =>
        extractPricesWithAI(
          batch,
          product_name, LOVABLE_API_KEY, estimated_retail_price
        ).then(results => results.map(r => ({ ...r, index: bi * BATCH_SIZE + (typeof r.index === "number" ? r.index : 0) })))
      )
    );
    const aiResults = batchResults.flat();

    log(`AI validated ${aiResults.length} results`);

    // ── Build final results from AI output ──
    const priceCeiling = estimated_retail_price ? estimated_retail_price * 2.5 : MAX_REALISTIC_PRICE;
    const priceFloor = estimated_retail_price
      ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.5))
      : MIN_REALISTIC_PRICE;

    const extracted: any[] = [];

    // ── Regex fallback if AI returned nothing ──
    // Push into extracted so Shopping merge still runs afterwards
    if (aiResults.length === 0 && candidates.length > 0) {
      log("AI returned 0 results, falling back to regex extraction");
      const priceFloor = estimated_retail_price
        ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.5))
        : MIN_REALISTIC_PRICE;
      const priceCeil = estimated_retail_price ? estimated_retail_price * 2 : MAX_REALISTIC_PRICE;
      log(`Regex price range: £${priceFloor}-£${priceCeil}`);

      // Extract colour words from the search name so we can reject wrong colourways
      const COLOR_LIST = ["black","white","red","blue","green","yellow","orange","purple","pink","brown","grey","gray","beige","cream","navy","khaki","tan","silver","gold","denim","camo","floral","leopard"];
      const searchColors = COLOR_LIST.filter(c => searchName.toLowerCase().includes(c));
      const conflictColors = COLOR_LIST.filter(c => !searchColors.includes(c));
      log(`Search colors: [${searchColors}], conflict colors: [${conflictColors}]`);

      let colorRejects = 0, noPriceRejects = 0;
      const regexExtracted: any[] = [];
      for (const s of candidates) {
        // Reject non-product pages (collection, category, browse pages)
        if (!isLikelyProductPage(s.url)) continue;

        // Reject pages whose URL or title clearly show a different colourway
        if (searchColors.length > 0 && conflictColors.length > 0) {
          const slugAndTitle = `${s.url}\n${s.title || ""}`.toLowerCase();
          if (conflictColors.some(c => slugAndTitle.includes(c))) { colorRejects++; continue; }
        }

        const text = `${s.title || ""}\n${(s.markdown || "").slice(0, 2000)}\n${s.description || ""}`;
        const normalized = text.replace(/,/g, "");
        const prices: number[] = [];
        for (const m of normalized.matchAll(/£\s?(\d{1,4}(?:\.\d{1,2})?)/gi)) {
          const v = Number(m[1]);
          if (!isNaN(v) && v >= priceFloor && v <= priceCeil) prices.push(v);
        }
        if (!prices.length) { noPriceRejects++; continue; }

        prices.sort((a, b) => a - b);
        const itemPrice = estimated_retail_price
          ? prices.reduce((best, p) => Math.abs(p - estimated_retail_price) < Math.abs(best - estimated_retail_price) ? p : best, prices[0])
          : prices[0];
        const domain = extractDomain(s.url);
        // Apply non-resale floor (60% of RRP) — catches junior sizes, wrong products
        const regexFallbackFloor = estimated_retail_price
          ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.60))
          : priceFloor;
        const regexFallbackEffectiveFloor = RESALE_PLATFORMS.has(domain) ? priceFloor : regexFallbackFloor;
        if (itemPrice < regexFallbackEffectiveFloor) continue;
        const uk = isUkDomain(domain);
        const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
        const duties = calculateDuties(itemPrice, uk);
        regexExtracted.push({
          retailer: getRetailerName(domain),
          country: uk ? "UK" : "International",
          flag: uk ? "🇬🇧" : "🌍",
          itemPrice,
          shipping,
          duties,
          totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
          originalPrice: null,
          delivery: getDeliveryTime(domain, uk),
          trustRating: getTrustRating(domain),
          currency: "GBP",
          url: cleanUrl(s.url),
          inStock: null,
          checkedAt: new Date().toISOString(),
          couponCode: null, // regex fallback never has coupon codes
          priceConfidence: "low",
          retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
            : TRUST_RATINGS[domain] ? "trusted"
            : "unverified",
          freeReturns: FREE_RETURNS_RETAILERS.has(domain),
        });
      }
      // Deduplicate by domain
      const fallbackByDomain = new Map<string, any>();
      for (const e of regexExtracted) {
        const d = extractDomain(e.url);
        if (!fallbackByDomain.has(d) || e.totalYouPay < fallbackByDomain.get(d).totalYouPay) {
          fallbackByDomain.set(d, e);
        }
      }
      const fallbackResults = Array.from(fallbackByDomain.values())
        .sort((a, b) => a.totalYouPay - b.totalYouPay)
        .map((r, i) => ({ ...r, rank: i + 1 }));

      log(`Regex fallback found ${fallbackResults.length} results — continuing to Shopping merge`);
      for (const r of fallbackResults) extracted.push(r);
    }
    for (const aiResult of aiResults) {
      const idx = (aiResult.index ?? 0) - 1;
      if (idx < 0 || idx >= scrapedCandidates.length) continue;
      const source = scrapedCandidates[idx];
      if (!source || !aiResult.current_price_gbp) continue;

      const itemPrice = aiResult.current_price_gbp;
      if (itemPrice < priceFloor || itemPrice > priceCeiling) continue;

      const domain = extractDomain(source.url);
      // Apply non-resale floor (60% of RRP) and ceiling (130% of RRP) in AI path
      const aiNonResaleFloor = estimated_retail_price
        ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.60))
        : priceFloor;
      const aiNonResaleCeiling = estimated_retail_price ? estimated_retail_price * 1.5 : priceCeiling;
      const aiEffectiveFloor = RESALE_PLATFORMS.has(domain) ? priceFloor : aiNonResaleFloor;
      const aiEffectiveCeiling = RESALE_PLATFORMS.has(domain) ? priceCeiling : aiNonResaleCeiling;
      if (itemPrice < aiEffectiveFloor || itemPrice > aiEffectiveCeiling) continue;
      const uk = isUkDomain(domain);
      const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
      const duties = calculateDuties(itemPrice, uk);
      const totalYouPay = Number((itemPrice + shipping + duties).toFixed(2));

      extracted.push({
        retailer: getRetailerName(domain),
        country: uk ? "UK" : "International",
        flag: uk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay,
        originalPrice: (aiResult.original_price_gbp && aiResult.original_price_gbp > itemPrice
          && (!estimated_retail_price || aiResult.original_price_gbp <= estimated_retail_price * 1.5))
          ? aiResult.original_price_gbp : null,
        delivery: getDeliveryTime(domain, uk),
        trustRating: getTrustRating(domain),
        currency: "GBP",
        url: cleanUrl(source.url),
        inStock: aiResult.in_stock === true ? true : aiResult.in_stock === false ? false : null,
        checkedAt: new Date().toISOString(),
        couponCode: isValidCouponCode(aiResult.coupon_code) ? aiResult.coupon_code : null,
        priceConfidence: aiResult.price_confidence || "high",
        retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
          : TRUST_RATINGS[domain] ? "trusted"
          : "unverified",
        freeReturns: FREE_RETURNS_RETAILERS.has(domain),
      });
    }

    // ── Regex fallback for AUTHORISED_RETAILERS that AI couldn't price ──
    // JS-heavy pages (JD Sports, Size?, Foot Locker etc.) often return empty scrape markdown.
    // For trusted domains, extract price from snippet/title as low-confidence fallback.
    const aiCoveredDomains = new Set(extracted.map(e => extractDomain(e.url)));
    for (const c of enrichedCandidates) {
      const domain = extractDomain(c.url);
      if (aiCoveredDomains.has(domain)) continue;
      if (!AUTHORISED_RETAILERS.has(domain)) continue;
      // Reject wrong-colorway URLs in regex fallback (same logic as Shopping merge)
      const regexUrlLower = c.url.toLowerCase();
      const regexSearchLower = searchName.toLowerCase();
      const regexSearchColours = EXTENDED_COLOR_TERMS.filter(col => regexSearchLower.includes(col));
      if (regexSearchColours.length > 0) {
        const regexConflictColours = EXTENDED_COLOR_TERMS.filter(col => !regexSearchColours.includes(col));
        const regexUrlConflict = regexConflictColours.some(col => {
          const pat = new RegExp(`[-_/]${col}[-_/]|[-_]${col}$|[-_]${col}\\d`, "i");
          return pat.test(regexUrlLower);
        });
        if (regexUrlConflict) { log(`Regex fallback: rejected ${c.url.slice(0,80)} — colorway conflict`); continue; }
      }
      // Apply non-resale price floor (62% of RRP) for non-resale authorised retailers
      const regexNonResaleFloor = estimated_retail_price
        ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.60))
        : priceFloor;
      const regexEffectiveFloor = RESALE_PLATFORMS.has(domain) ? priceFloor : regexNonResaleFloor;
      const regexNonResaleCeiling = estimated_retail_price ? estimated_retail_price * 1.5 : priceCeiling;
      const regexEffectiveCeiling = RESALE_PLATFORMS.has(domain) ? priceCeiling : regexNonResaleCeiling;
      const text = `${c.title || ""} ${c.markdown || ""} ${c.description || ""}`;
      const prices: number[] = [];
      for (const m of text.replace(/,/g, "").matchAll(/£\s?(\d{1,4}(?:\.\d{1,2})?)/gi)) {
        const v = Number(m[1]);
        if (!isNaN(v) && v >= regexEffectiveFloor && v <= regexEffectiveCeiling) prices.push(v);
      }
      if (!prices.length) continue;
      prices.sort((a, b) => a - b);
      const itemPrice = estimated_retail_price
        ? prices.reduce((best, p) => Math.abs(p - estimated_retail_price) < Math.abs(best - estimated_retail_price) ? p : best, prices[0])
        : prices[0];
      const uk = isUkDomain(domain);
      const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
      const duties = calculateDuties(itemPrice, uk);
      extracted.push({
        retailer: getRetailerName(domain),
        country: uk ? "UK" : "International",
        flag: uk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
        originalPrice: null,
        delivery: getDeliveryTime(domain, uk),
        trustRating: getTrustRating(domain),
        currency: "GBP",
        url: cleanUrl(c.url),
        inStock: null,
        checkedAt: new Date().toISOString(),
        couponCode: null,
        priceConfidence: "low",
        retailerTier: "authorised",
        freeReturns: FREE_RETURNS_RETAILERS.has(domain),
      });
      aiCoveredDomains.add(domain);
    }
    log(`After regex fallback for authorised retailers: ${extracted.length} total`);

    // ── Merge Google Shopping results — covers retailers that block scraping (JD Sports, Nike, etc.) ──
    // Serper Shopping often returns Google redirect links (google.com/search?ibp=oshop...) rather than
    // direct retailer URLs. Map the source name to a known domain so we still get the price data.
    const SHOPPING_SOURCE_MAP: Record<string, string> = {
      "jd sports": "jdsports.co.uk", "jdsports": "jdsports.co.uk",
      "size?": "size.co.uk", "size": "size.co.uk",
      "foot locker": "footlocker.co.uk", "footlocker": "footlocker.co.uk",
      "schuh": "schuh.co.uk",
      "offspring": "offspring.co.uk",
      "office": "office.co.uk",
      "foot asylum": "footasylum.com", "footasylum": "footasylum.com",
      "end clothing": "endclothing.com", "end.": "endclothing.com", "endclothing": "endclothing.com",
      "asos": "asos.com",
      "zalando": "zalando.co.uk",
      "flannels": "flannels.com",
      "tessuti": "tessuti.co.uk",
      "sports direct": "sportsdirect.com", "sportsdirect": "sportsdirect.com",
      "very": "very.co.uk",
      "next": "next.co.uk",
      "selfridges": "selfridges.com",
      "harvey nichols": "harveynichols.com",
      "mr porter": "mrporter.com", "mrporter": "mrporter.com",
      "farfetch": "farfetch.com",
      "ssense": "ssense.com",
      "urban outfitters": "urbanoutfitters.com",
      "nike": "nike.com", "nike official": "nike.com",
      "adidas": "adidas.co.uk",
      "new balance": "newbalance.co.uk", "newbalance": "newbalance.co.uk",
      "asics": "asics.co.uk",
      "puma": "puma.com",
      "reebok": "reebok.co.uk",
      "converse": "converse.com",
      "vans": "vans.co.uk",
      "timberland": "timberland.co.uk",
      "hoka": "hoka.com",
      "on running": "on-running.com", "on": "on-running.com",
      "saucony": "saucony.com",
      "dr. martens": "drmartens.com", "dr martens": "drmartens.com",
      "stockx": "stockx.com",
      "goat": "goat.com",
      "klekt": "klekt.com",
      "laced": "laced.com",
      "the sole supplier": "thesolesupplier.co.uk",
      "stadium goods": "stadiumgoods.com",
      "kershkicks": "kershkicks.com",
      "creps uk": "crepsuk.com",
      "sneakersnstuff": "sneakersnstuff.com", "sns": "sneakersnstuff.com",
      "solebox": "solebox.com",
      "foot patrol": "footpatrol.com", "footpatrol": "footpatrol.com",
      "hanon": "hanon-shop.com",
      "bstn": "bstn.com",
      "asphalt gold": "asphaltgold.com",
      "overkill": "overkillshop.com",
      "snipes": "snipes.com",
      "footshop": "footshop.eu",
      "mainline menswear": "mainlinemenswear.co.uk",
      "scotts menswear": "scottsmenswear.com",
      "whats your size": "whatsyoursize.co.uk", "what's your size": "whatsyoursize.co.uk",
      "what's your size uk": "whatsyoursize.co.uk",
      "footlocker.co.uk": "footlocker.co.uk",
      "asphaltgold": "asphaltgold.com", "asphalt gold de": "asphaltgold.com",
      "crepsuk": "crepsuk.com", "creps uk": "crepsuk.com",
      "footshop": "footshop.eu", "footshop.uk": "footshop.eu",
      "decathlon": "decathlon.co.uk", "decathlon uk": "decathlon.co.uk",
      // Clothing brands
      "carhartt wip": "carhartt-wip.com", "carhartt": "carhartt-wip.com",
      "stone island": "stoneisland.com",
      "cp company": "cpcompany.com", "c.p. company": "cpcompany.com",
      "ralph lauren": "ralphlauren.co.uk",
      "lacoste": "lacoste.com",
      "levi's": "levis.com", "levis": "levis.com", "levi strauss": "levis.com",
      "fred perry": "fredperry.com",
      "tommy hilfiger": "tommyhilfiger.com",
      "the north face": "thenorthface.com", "north face": "thenorthface.com",
      "patagonia": "patagonia.com",
      "champion": "champion.com",
      "fila": "fila.com",
      "ellesse": "ellesse.com",
      // Clothing retail
      "h&m": "hm.com", "hm": "hm.com",
      "zara": "zara.com",
      "river island": "riverisland.com",
      "marks & spencer": "marksandspencer.com", "m&s": "marksandspencer.com",
      "uniqlo": "uniqlo.com",
      "about you": "aboutyou.co.uk",
      // Non-sneaker shoes
      "clarks": "clarks.co.uk",
      "kurt geiger": "kurtgeiger.com",
    };
    // Merge Shopping results: primary + fallback (deduped by productLink)
    const shoppingSeenLinks = new Set<string>();
    const allShoppingResults = [...shoppingResults, ...shoppingFallback].filter(item => {
      const key = item.productLink || item.link || "";
      if (!key || shoppingSeenLinks.has(key)) return false;
      shoppingSeenLinks.add(key);
      return true;
    });
    log(`Shopping total: ${allShoppingResults.length} (primary: ${shoppingResults.length}, fallback: ${shoppingFallback.length})`);
    const shoppingCoveredDomains = new Set(extracted.map(e => extractDomain(e.url)));
    // Normalise retailer domain variants so .co.uk and .com match each other
    const normaliseDomain = (d: string) =>
      d.replace(/\.co\.uk$/, ".com").replace(/^(uk|gb|us|eu)\./i, "");

    for (const item of allShoppingResults) {
      // productLink = direct retailer product URL; link = Google redirect — always prefer productLink
      const productUrl = item.productLink || "";
      const googleUrl = item.link || "";
      const rawUrl = productUrl || googleUrl;
      const rawDomain = rawUrl ? extractDomain(rawUrl) : "";
      const isGoogleRedirect = !productUrl && rawDomain === "google.com";
      const sourceName = (item.source || "").toLowerCase().trim();
      let domain = !isGoogleRedirect && rawDomain ? rawDomain : (SHOPPING_SOURCE_MAP[sourceName] || "");
      if (!domain) { log(`Shopping: no domain for source "${item.source}"`); continue; }
      // Reject non-UK locale paths (nike.com/sg, /en-us/ etc.)
      const NON_UK_LOCALE = /\/en-(?!gb)[a-z]{2}\/|\/en-us\/|\/en-au\/|\/en-ca\/|\/us_en\/|\/sg\/|\/us\/|\/au\/|\/ca\/|\/fr\/|\/de\/|\/it\/|\/es\/|\/nl\/|\/jp\/|\/kr\//;
      // Use direct product URL only if it passes product-page validation AND is UK locale
      const isNonUkLocale = NON_UK_LOCALE.test(productUrl.toLowerCase()) && !productUrl.toLowerCase().includes(".co.uk");
      // For multi-locale brand sites, prefer /gb/ URL from web search over Shopping's US URL
      const REQUIRES_GB_PATH = new Set(["nike.com", "adidas.com", "converse.com", "vans.com", "puma.com"]);
      const isMissingGbPath = REQUIRES_GB_PATH.has(domain) && !productUrl.toLowerCase().includes("/gb/") && !productUrl.toLowerCase().includes(".co.uk");
      // Only skip direct URL if we have a better GB URL from web search — otherwise fall through to productUrl
      const hasGbWebUrl = isMissingGbPath && enrichedCandidates.some(c => {
        const u = c.url.toLowerCase();
        return (extractDomain(c.url) === domain) && u.includes("/gb/") && isLikelyProductPage(c.url);
      });
      const isDirectProductUrl = !!productUrl && isLikelyProductPage(productUrl) && !isNonUkLocale && !(isMissingGbPath && hasGbWebUrl);
      // Find a product URL from web search, tolerating .co.uk / .com variants
      const webSearchUrl = enrichedCandidates.find(c => {
        const u = c.url.toLowerCase();
        if (NON_UK_LOCALE.test(u) && !u.includes(".co.uk")) return false;
        if (REQUIRES_GB_PATH.has(domain) && !u.includes("/gb/") && !u.includes(".co.uk")) return false;
        return (extractDomain(c.url) === domain || normaliseDomain(extractDomain(c.url)) === normaliseDomain(domain))
          && isLikelyProductPage(c.url);
      })?.url;
      const url = isDirectProductUrl ? productUrl
        : webSearchUrl ? webSearchUrl
        : RETAILER_SEARCH_URLS[domain]?.(searchName)
        ?? `https://www.${domain}`;
      log(`Shopping URL for ${domain}: ${isDirectProductUrl ? "productLink" : webSearchUrl ? "webSearch" : RETAILER_SEARCH_URLS[domain] ? "searchUrl" : "homepage!"} → ${url.slice(0, 80)}`);
      if (shoppingCoveredDomains.has(domain)) continue;
      if (BLOCKED_DOMAINS.has(domain)) continue;
      // Reject search/category page fallback URLs unless we have a search URL template for this retailer.
      // Known retailers with RETAILER_SEARCH_URLS get a search-URL placeholder — the URL resolution
      // step below will upgrade it to a direct product URL via a site: search.
      if (!isDirectProductUrl && !webSearchUrl && !isLikelyProductPage(url)) {
        if (!RETAILER_SEARCH_URLS[domain]) {
          log(`Shopping: rejected ${domain} — no product URL and no search URL template`);
          continue;
        }
        log(`Shopping: ${domain} — search URL placeholder, URL resolution will upgrade to product page`);
      }
      // Reject wrong-gender URLs in Shopping merge (skip resale platforms — they list all sizes/genders)
      const shoppingUrlLower = url.toLowerCase();
      if (!RESALE_PLATFORMS.has(domain)) {
        const WOMENS_SHOPPING_RE = /\/womens?[-_/]|[-_]womens?[-_/]|\/women\/|[-_]wmns[-_/]|[-_]wmns$|\/wmns[-_/]|\/wmns$|\/wmns\/|-w-\d/;
        const MENS_SHOPPING_RE = /\/mens?[-_/]|[-_]mens?[-_/]|\/men\//;
        if (wantsMens && WOMENS_SHOPPING_RE.test(shoppingUrlLower)) { log(`Shopping: rejected ${domain} — women's URL for men's search`); continue; }
        if (!wantsMens && !wantsWomens && WOMENS_SHOPPING_RE.test(shoppingUrlLower)) { log(`Shopping: rejected ${domain} — women's URL for unisex search`); continue; }
        if (wantsWomens && MENS_SHOPPING_RE.test(shoppingUrlLower)) { log(`Shopping: rejected ${domain} — men's URL for women's search`); continue; }
      }
      // Apply URL-level collab/variant filter to the resolved URL (catches e.g. "/products/af1-retro-premium-...")
      const resolvedUrlLower = url.toLowerCase();
      const searchLowerForUrl = searchName.toLowerCase();
      const urlHasCollab = COLLAB_NAMES_GLOBAL.some(c => resolvedUrlLower.includes(c) && !searchLowerForUrl.includes(c));
      const urlHasVariant = VARIANT_URL_PATTERNS.some(v => resolvedUrlLower.includes(v) && !searchLowerForUrl.includes(v.replace(/[-_/]/g, "")));
      if (urlHasCollab || urlHasVariant) { log(`Shopping: rejected ${domain} — collab/variant in resolved URL`); continue; }
      // Parse price — Shopping returns strings like "£90.00", "$120", "€95"
      const priceRaw = (item.price || "").trim();
      let itemPrice = 0;
      let priceConf: "high" | "low" = "high";
      if (priceRaw.startsWith("£")) {
        itemPrice = parseFloat(priceRaw.replace(/[£,]/g, ""));
      } else if (priceRaw.startsWith("$")) {
        itemPrice = parseFloat(priceRaw.replace(/[$,]/g, "")) * 0.79;
        priceConf = "low";
      } else if (priceRaw.startsWith("€")) {
        itemPrice = parseFloat(priceRaw.replace(/[€,]/g, "")) * 0.85;
        priceConf = "low";
      } else {
        itemPrice = parseFloat(priceRaw.replace(/[^0-9.]/g, ""));
      }
      if (!itemPrice || isNaN(itemPrice)) { log(`Shopping: no price for ${domain}: "${priceRaw}"`); continue; }
      // Resale platforms legitimately price above RRP — skip ceiling for them.
      // Non-resale retailers should never be more than 30% above RRP — if they are,
      // it's almost certainly a Premium/collab/wrong product slipping through.
      const nonResaleCeiling = estimated_retail_price ? estimated_retail_price * 1.5 : priceCeiling;
      // Non-resale retailers shouldn't go below 62% of RRP — catches junior sizes, clearance errors, wrong products
      const nonResaleFloor = estimated_retail_price
        ? Math.max(MIN_REALISTIC_PRICE, Math.round(estimated_retail_price * 0.60))
        : priceFloor;
      const effectiveCeiling = RESALE_PLATFORMS.has(domain) ? priceCeiling : nonResaleCeiling;
      const effectiveFloor = RESALE_PLATFORMS.has(domain) ? priceFloor : nonResaleFloor;
      if (itemPrice < effectiveFloor || itemPrice > effectiveCeiling) { log(`Shopping: price ${itemPrice} out of range [${effectiveFloor}, ${effectiveCeiling}] for ${domain} (resale: ${RESALE_PLATFORMS.has(domain)})`); continue; }
      // Ensure the Shopping title is actually about what the user searched for
      // (Google Shopping occasionally returns adjacent products at the same retailer)
      if (item.title) {
        const stopWords = new Set(["the","and","for","with","low","high","mid","men","women","uk","in","of","a","an"]);
        const searchWords = searchName.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
        const shoppingTitleForMatch = (item.title || "").toLowerCase();
        const matchCount = searchWords.filter(w => shoppingTitleForMatch.includes(w)).length;
        const minMatch = Math.max(1, Math.ceil(searchWords.length * 0.5));
        if (matchCount < minMatch) { log(`Shopping: rejected "${item.title}" from ${domain} — only ${matchCount}/${minMatch} search words matched title`); continue; }
      }
      if (isKidsProduct(url, item.title || "")) continue;
      // Reject women's Shopping results unless user explicitly wants women's
      const shoppingTitleLower = (item.title || "").toLowerCase();
      const WOMENS_URL_RE2 = /\/womens?[-_/]|[-_]womens?[-_/]|\/women\/|[-_]wmns[-_/]|[-_]wmns$|\/wmns[-_/]|\/wmns$|\/wmns\/|-w-\d/;
      const WOMENS_TITLE_RE2 = /\b(women'?s?|womens?|girls?)\b/;
      if (wantsMens && (WOMENS_TITLE_RE2.test(shoppingTitleLower) || WOMENS_URL_RE2.test(shoppingUrlLower))) continue;
      if (!wantsMens && !wantsWomens && (WOMENS_TITLE_RE2.test(shoppingTitleLower) || WOMENS_URL_RE2.test(shoppingUrlLower))) continue;
      // Reject Shopping results whose title contains a collab or variant modifier the user did NOT ask for
      const searchLowerForShopping = searchName.toLowerCase();
      const shoppingHasCollab = COLLAB_NAMES_GLOBAL.some(c => shoppingTitleLower.includes(c) && !searchLowerForShopping.includes(c));
      const shoppingHasVariant = VARIANT_WORDS_GLOBAL.some(v => {
        const vRe = new RegExp(`\\b${v}\\b`);
        return vRe.test(shoppingTitleLower) && !searchLowerForShopping.includes(v);
      });
      if (shoppingHasCollab || shoppingHasVariant) { log(`Shopping: rejected "${item.title}" from ${domain} — collab/variant in title`); continue; }
      // Colorway conflict check — URL slug only (separator-based), to avoid false positives in titles.
      // Catches e.g. "trainer-white-light-army-..." or "...denim-trainers-..." when searching for a different colorway.
      const searchColours = EXTENDED_COLOR_TERMS.filter(c => searchLowerForShopping.includes(c));
      if (searchColours.length > 0) {
        const conflictColours = EXTENDED_COLOR_TERMS.filter(c => !searchColours.includes(c));
        const hasColorConflictInUrl = conflictColours.some(c => {
          // Match color only when surrounded by URL slug separators (-, _, /) to avoid matching compound words or descriptions
          const urlPattern = new RegExp(`[-_/]${c}[-_/]|[-_]${c}$|[-_]${c}\\d`, "i");
          return urlPattern.test(resolvedUrlLower);
        });
        if (hasColorConflictInUrl) { log(`Shopping: rejected "${item.title}" from ${domain} — colorway conflict in URL`); continue; }
      }
      const uk = isUkDomain(domain);
      const shipping = uk ? (itemPrice >= 50 ? 0 : 4.99) : 12.99;
      const duties = calculateDuties(itemPrice, uk);
      extracted.push({
        retailer: getRetailerName(domain),
        country: uk ? "UK" : "International",
        flag: uk ? "🇬🇧" : "🌍",
        itemPrice,
        shipping,
        duties,
        totalYouPay: Number((itemPrice + shipping + duties).toFixed(2)),
        originalPrice: null,
        delivery: getDeliveryTime(domain, uk),
        trustRating: getTrustRating(domain),
        currency: "GBP",
        url: cleanUrl(url),
        inStock: null,
        checkedAt: new Date().toISOString(),
        couponCode: null,
        priceConfidence: priceConf,
        retailerTier: AUTHORISED_RETAILERS.has(domain) ? "authorised"
          : TRUST_RATINGS[domain] ? "trusted" : "unverified",
        freeReturns: FREE_RETURNS_RETAILERS.has(domain),
      });
      shoppingCoveredDomains.add(domain);
    }
    log(`After shopping merge: ${extracted.length} total`);

    // ── URL resolution — Shopping items that fell back to a search/homepage URL ──
    // For JS-heavy retailers (JD Sports, Foot Locker, Footasylum etc.) the Shopping API
    // doesn't provide a direct product URL. Do a targeted site: search to find one.
    // For certain domains, constrain site: search to a specific subdirectory to avoid
    // landing on category/news pages instead of product pages.
    const SITE_SEARCH_PATHS: Record<string, string> = {
      "thesolesupplier.co.uk": "thesolesupplier.co.uk/trainers/",
      "nike.com": "nike.com/gb/",
      "adidas.com": "adidas.co.uk/",
    };
    const needsProductUrl = extracted.filter(e => !isLikelyProductPage(e.url));
    if (needsProductUrl.length > 0 && SERPER_API_KEY) {
      log(`Resolving product URLs for ${needsProductUrl.length} entries: ${needsProductUrl.map(e => extractDomain(e.url)).join(", ")}`);
      const resolved = await Promise.all(
        needsProductUrl.map(async (entry) => {
          const domain = extractDomain(entry.url);
          const siteTarget = SITE_SEARCH_PATHS[domain] ?? domain;
          try {
            const results = await doSerperSearch(`${searchName} site:${siteTarget}`, 5);
            const productPage = results.find(r => {
              if (!r.url || !isLikelyProductPage(r.url)) return false;
              if (isKidsProduct(r.url, r.title + " " + r.description)) return false;
              const u = r.url.toLowerCase();
              // Reject opposite-gender URLs (and women's pages when gender is unspecified)
              const WOMENS_URL_RE3 = /\/womens?[-_/]|[-_]womens?[-_/]|\/women\/|[-_]wmns[-_/]|[-_]wmns$|\/wmns[-_/]|\/wmns$|\/wmns\/|-w-\d/;
              if (wantsMens && WOMENS_URL_RE3.test(u)) return false;
              if (!wantsMens && !wantsWomens && WOMENS_URL_RE3.test(u)) return false;
              if (wantsWomens && /\/mens?[-_/]|[-_]mens?[-_/]|\/men\//.test(u)) return false;
              // Reject non-UK locale paths (nike.com/sg, /en-us/, /en-au/, etc.)
              if (/\/en-(?!gb)[a-z]{2}\/|\/en-us\/|\/en-au\/|\/en-ca\/|\/sg\/|\/us\/|\/au\/|\/ca\/|\/fr\/|\/de\/|\/it\/|\/es\/|\/nl\/|\/jp\/|\/kr\//.test(u) && !u.includes(".co.uk")) return false;
              return true;
            });
            return { entry, productUrl: productPage?.url ?? null };
          } catch {
            return { entry, productUrl: null };
          }
        })
      );
      for (const { entry, productUrl } of resolved) {
        if (productUrl) {
          log(`Resolved ${extractDomain(entry.url)}: ${productUrl.slice(0, 80)}`);
          entry.url = cleanUrl(productUrl);
        }
      }
    }

    // Drop any Shopping results that URL resolution couldn't upgrade to a product page.
    // Resale platforms (StockX, GOAT etc.) use unconventional URL structures — keep those,
    // but always reject search/query URLs regardless of platform (a search page is never a product).
    for (let i = extracted.length - 1; i >= 0; i--) {
      const e = extracted[i];
      const isSearchUrl = /[?&](q|query|search|s|keyword)=/i.test(e.url) || /\/search[?/]/i.test(e.url);
      if (isSearchUrl || (!isLikelyProductPage(e.url) && !RESALE_PLATFORMS.has(extractDomain(e.url)))) {
        log(`Dropping ${extractDomain(e.url)} — still on search/non-product URL after resolution`);
        extracted.splice(i, 1);
      }
    }

    // Merge affiliate feed results — feed takes precedence over scraped (higher confidence)
    for (const feedEntry of feedResults) {
      const domain = extractDomain(feedEntry.url);
      const alreadySeen = extracted.some(e => extractDomain(e.url) === domain);
      if (!alreadySeen) extracted.push(feedEntry);
    }
    log(`After feed merge: ${extracted.length} total extracted`);

    // ── Deduplicate by domain (keep cheapest) ──
    const byDomain = new Map<string, any>();
    for (const entry of extracted) {
      const domain = extractDomain(entry.url);
      if (!domain) continue;
      const existing = byDomain.get(domain);
      if (!existing || entry.totalYouPay < existing.totalYouPay) {
        byDomain.set(domain, entry);
      }
    }

    const sorted = Array.from(byDomain.values())
      .filter(r => r.retailer && r.retailer.length > 2) // drop bogus names like "Uk", "Us"
      .sort((a, b) => a.totalYouPay - b.totalYouPay);

    // ── Price outlier filter: hide results > 3x cheapest (only when 5+ results) ──
    const cheapest = sorted[0]?.totalYouPay ?? 0;
    const cutoff = cheapest * 3;
    const outlierFiltered = (sorted.length >= 5 ? sorted.filter(r => r.totalYouPay <= cutoff) : sorted);

    // ── URL verification — parallel HEAD check, 3s timeout ──
    // Filters dead links (404) and redirects to homepage (path becomes "/" after redirect).
    // Defaults to KEEPING the URL on timeout or bot-block (403/429) so good results aren't lost.
    const verifyUrl = async (url: string): Promise<boolean> => {
      try {
        const r = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(3000),
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        // Explicit 404 → dead link, drop it
        if (r.status === 404) return false;
        // Redirected to homepage (path is "/" or empty) → wrong product URL
        if (r.status < 400) {
          try {
            const finalPath = new URL(r.url).pathname;
            if (finalPath === "/" || finalPath === "") return false;
          } catch { /* keep */ }
        }
        // 403/429/5xx → bot blocked or server error → keep (don't penalise)
        return true;
      } catch {
        return true; // timeout or network error → keep
      }
    };

    const verificationResults = await Promise.all(
      outlierFiltered.map(r => verifyUrl(r.url).then(ok => ({ ...r, _urlOk: ok })))
    );
    const verified = verificationResults.filter(r => r._urlOk).map(({ _urlOk, ...r }) => r);
    log(`URL verification: ${verified.length}/${outlierFiltered.length} passed (${outlierFiltered.length - verified.length} dead links removed)`);

    // ── Final safety filter — variant/collab URLs that bypassed earlier checks ──
    // Applied last so it catches results from ALL paths (AI, Shopping merge, feed, cache merge).
    const searchLowerFinal = searchName.toLowerCase();
    const safeVerified = verified.filter(r => {
      const urlLower = r.url.toLowerCase();
      const hasVariant = VARIANT_URL_PATTERNS.some(v => urlLower.includes(v) && !searchLowerFinal.includes(v.replace(/[-_/]/g, "")));
      const hasCollab = COLLAB_NAMES_GLOBAL.some(c => urlLower.includes(c) && !searchLowerFinal.includes(c));
      if (hasVariant || hasCollab) {
        console.error(`Final filter: dropped ${extractDomain(r.url)} — variant/collab in URL: ${r.url}`);
        return false;
      }
      if (isKidsProduct(r.url, r.retailer || "")) {
        console.error(`Final filter: dropped ${extractDomain(r.url)} — kids product URL: ${r.url}`);
        return false;
      }
      return true;
    });
    log(`Final safety filter: ${safeVerified.length}/${verified.length} passed`);

    const finalResults = safeVerified.map((r, i) => ({ ...r, rank: i + 1 }));
    log(`Final: ${finalResults.length} unique retailers (cutoff £${cutoff.toFixed(0)})`);

    // ── 30-day historical low + chart data ──
    const { low: thirtyDayLow, history: priceHistory } = await getThirtyDayLow(cacheKey);

    // ── Price history (fire-and-forget) ──
    if (finalResults.length > 0) {
      sb.from("price_history")
        .insert({ product_key: cacheKey, results: finalResults })
        .then(({ error }) => {
          if (error && !error.message?.includes("does not exist")) {
            console.error("History insert:", error.message);
          }
        });
    }

    // Return stale cache if fresh results are worse
    if (finalResults.length < MIN_CACHE_RESULTS && cachedResults.length > finalResults.length) {
      log(`Returning stale cache`);
      return new Response(JSON.stringify({ success: true, results: cachedResults, cached: true, stale: true, thirtyDayLow, priceHistory }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Cache results — merge with previous cache so Serper variance doesn't lose retailers ──
    if (finalResults.length > 0) {
      // Use already-loaded cachedResults if available; otherwise fetch for merge (e.g. skip_cache=true path)
      const previousResults: any[] = cachedResults.length > 0 ? cachedResults :
        await sb.from("price_cache").select("results").eq("product_key", cacheKey).maybeSingle()
          .then(({ data }) => Array.isArray(data?.results) ? data.results : []);

      const freshDomains = new Set(finalResults.map((r: any) => extractDomain(r.url)));
      const FORTY_EIGHT_HOURS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — matches stale cache window
      const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS;

      const mergedResults = [...finalResults];
      const searchLowerMerge = searchName.toLowerCase();
      for (const prev of previousResults) {
        const domain = extractDomain(prev.url);
        const prevAge = prev.checkedAt ? new Date(prev.checkedAt).getTime() : 0;
        // Reject non-UK locale URLs (e.g. /us_en/, /en-us/, /us/) from cache
        const isNonUkLocale = /\/(?:us_en|us|au|ca|de|fr|it|es|nl|en-us|en-au)\//.test(prev.url) && !prev.url.includes(".co.uk");
        // Reject cached URLs that now fail variant/collab/kids filters
        const prevUrlLower = prev.url.toLowerCase();
        const prevHasVariant = VARIANT_URL_PATTERNS.some(v => prevUrlLower.includes(v) && !searchLowerMerge.includes(v.replace(/[-_/]/g, "")));
        const prevHasCollab = COLLAB_NAMES_GLOBAL.some(c => prevUrlLower.includes(c) && !searchLowerMerge.includes(c));
        const prevIsKids = isKidsProduct(prev.url, "");
        // Keep cached retailer if: not found fresh AND within 7 days AND URL passes all current filters
        if (!freshDomains.has(domain) && prevAge > cutoff && isLikelyProductPage(prev.url) && !isNonUkLocale && !prevHasVariant && !prevHasCollab && !prevIsKids) {
          mergedResults.push(prev);
        }
      }

      sb.from("price_cache")
        .upsert(
          { product_key: cacheKey, results: mergedResults, product_info: { product_name, retailers: normalizedRetailers } },
          { onConflict: "product_key" }
        )
        .then(({ error }) => { if (error) console.error("Cache write error:", error); });

      // Return merged results so this scrape also benefits from previously-found retailers
      return new Response(JSON.stringify({ success: true, results: mergedResults, thirtyDayLow, priceHistory }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, results: finalResults, thirtyDayLow, priceHistory }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("price-scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
