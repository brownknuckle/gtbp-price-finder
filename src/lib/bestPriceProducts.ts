// Structured product catalogue for programmatic SEO pages at /best-price/[slug].
// Each entry has enough metadata to generate a fully unique, schema-complete page
// without needing a live scrape — price data is pulled from price_cache.

import { toProductSlug } from "@/lib/utils";

export interface BestPriceProduct {
  name: string;
  slug: string;
  brand: string;
  category: "shoes" | "clothing";
  rrp: number;
  retailers: string[];
  description: string;         // 2–3 sentences, unique per product, for body copy
  sizingNote: string;          // one sentence on fit
  faqs: Array<{ q: string; a: string }>;
}

const def = (
  name: string,
  brand: string,
  category: "shoes" | "clothing",
  rrp: number,
  retailers: string[],
  description: string,
  sizingNote: string,
  faqs: Array<{ q: string; a: string }>,
): BestPriceProduct => ({ name, slug: toProductSlug(name), brand, category, rrp, retailers, description, sizingNote, faqs });

export const BEST_PRICE_PRODUCTS: BestPriceProduct[] = [
  // ─── Nike ───────────────────────────────────────────────────────────────────
  def(
    "Nike Air Force 1 Low Triple White",
    "Nike", "shoes", 109.95,
    ["nike.com","jdsports.co.uk","footlocker.co.uk","size.co.uk","schuh.co.uk","offspring.co.uk","asos.com","stockx.com","goat.com"],
    "The Nike Air Force 1 Triple White is the best-selling sneaker in the UK. First released in 1982 as a basketball shoe, the all-white leather AF1 has never left shelves — it's the most stocked colourway across every major UK retailer. Prices vary by up to £20 between stockists, making comparison essential.",
    "Air Force 1 fits true to size. If you're between sizes, go half a size up — the leather upper softens with wear.",
    [
      { q: "What is the cheapest price for Nike Air Force 1 Triple White in the UK?", a: "Prices vary between retailers. Use our comparison above to see the live cheapest price across Nike, JD Sports, Foot Locker, ASOS, Schuh and more." },
      { q: "What is the retail price of the Nike Air Force 1?", a: "The Nike Air Force 1 Low '07 retails at £89.95–£109.95 depending on the specific model. The standard Triple White is £109.95 on Nike.com." },
      { q: "Does Nike Air Force 1 go on sale?", a: "Yes — standard colourways like Triple White regularly go 10–20% off at JD Sports, Foot Locker and ASOS, especially during sale events. Limited editions rarely discount." },
      { q: "Does Nike Air Force 1 run true to size?", a: "Yes, Air Force 1 fits true to size for most people. If you have wide feet or are between sizes, go half a size up." },
      { q: "Which UK retailers stock Nike Air Force 1?", a: "Nike.com, JD Sports, Foot Locker, Size?, Schuh, Offspring, ASOS, and Zalando all stock the Air Force 1. Resale platforms StockX and GOAT carry sold-out colourways." },
    ],
  ),
  def(
    "Nike Dunk Low Retro White Black Panda",
    "Nike", "shoes", 109.95,
    ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","stockx.com","goat.com","klekt.com"],
    "The Nike Dunk Low Panda is the black-and-white colourway that made the Dunk Low the second best-selling sneaker in the world. Clean white leather upper with black swoosh, heel counter, and sole — endlessly wearable and almost always available. Price differences across UK retailers regularly hit £15–£25.",
    "Dunk Low fits true to size. Nike recommends going half a size up if you're between sizes.",
    [
      { q: "What is the cheapest price for Nike Dunk Low Panda in the UK?", a: "Use our comparison above to see live prices across all major UK retailers. Prices typically range from £89 to £109.95." },
      { q: "What does Nike Dunk Low Panda retail for?", a: "The Nike Dunk Low Retro White Black Panda retails at £109.95 on Nike.com and most authorised UK stockists." },
      { q: "Is Nike Dunk Low true to size?", a: "Yes, Dunk Low fits true to size. If you're between sizes or have a wider foot, size up half a size." },
      { q: "Where can I buy Nike Dunk Low Panda in the UK?", a: "Nike.com, JD Sports, Size?, Foot Locker, Schuh, and ASOS all stock the Dunk Low Panda. For sold-out sizes, StockX, GOAT, and Klekt are the most trusted resale options." },
      { q: "Does the Nike Dunk Low go on sale?", a: "Standard colourways like the Panda occasionally go on sale at Foot Locker and ASOS during seasonal events, but less frequently than other Nikes — demand keeps it at or near RRP." },
    ],
  ),
  def(
    "Nike Air Max 95 Triple Black",
    "Nike", "shoes", 164.95,
    ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","offspring.co.uk","asos.com","stockx.com","goat.com"],
    "The Nike Air Max 95 Triple Black is one of the most iconic colourways in Nike's running heritage lineup. The all-black mesh upper, graduated panels, and full-length Air unit make it a staple on UK streets. At £164.95 RRP, it's worth checking multiple retailers — discounts of 10–20% appear regularly.",
    "Air Max 95 runs slightly small and narrow. Most buyers recommend going half a size up, especially if you have a wider foot.",
    [
      { q: "What is the cheapest price for Nike Air Max 95 Triple Black in the UK?", a: "Use the comparison above to see live prices across Nike, JD Sports, Size?, Foot Locker, and others. The cheapest legitimate price is usually £10–£30 below RRP." },
      { q: "What is the RRP of Nike Air Max 95?", a: "The Nike Air Max 95 retails at £164.95 on Nike.com. The Triple Black colourway is one of the most widely stocked." },
      { q: "Does Air Max 95 run small?", a: "Yes — Air Max 95 runs slightly small and narrow. Go half a size up from your usual Nike size." },
      { q: "Which UK retailers stock Nike Air Max 95?", a: "Nike.com, JD Sports, Size?, Offspring, Foot Locker, and Schuh are the main UK stockists. ASOS and Zalando also carry it." },
    ],
  ),
  def(
    "Nike P-6000 White Black Metallic Silver",
    "Nike", "shoes", 109.95,
    ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","schuh.co.uk","asos.com","stockx.com","goat.com"],
    "The Nike P-6000 is currently the most-searched trainer in the UK. Originally a 1999 performance running shoe, its chunky retro silhouette relaunched in 2024 and immediately sold out. The OG White/Black/Silver colourway is the most sought-after. Price differences between UK retailers can reach £15.",
    "P-6000 fits true to size for most. The padded collar feels snug initially — wide-footed buyers should go half a size up.",
    [
      { q: "What is the cheapest price for Nike P-6000 in the UK?", a: "Use the comparison above to see live prices across Nike, JD Sports, Foot Locker, Size?, and ASOS. Prices start from around £89 when on sale." },
      { q: "What does the Nike P-6000 retail for?", a: "The Nike P-6000 retails at £109.95 on Nike.com and authorised UK retailers." },
      { q: "Is Nike P-6000 true to size?", a: "Yes, generally true to size. If you have wide feet, go half a size up — the padded collar is snug at first but breaks in quickly." },
      { q: "Where can I buy Nike P-6000 in the UK?", a: "Nike.com, JD Sports, Size?, Foot Locker, Schuh, and ASOS all stock it. Check StockX or GOAT for sold-out sizes at above-RRP prices." },
      { q: "Is the Nike P-6000 easy to fake?", a: "Yes, high demand has made it a counterfeit target. Only buy from authorised retailers or authenticated resale platforms like StockX and GOAT." },
    ],
  ),
  def(
    "Air Jordan 1 Retro High OG",
    "Jordan", "shoes", 169.95,
    ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"],
    "The Air Jordan 1 Retro High OG is the most iconic basketball shoe ever made — and one of the most collected. Each new colourway generates significant hype, and prices across UK retailers vary by £20–£40 on release day. Resale prices often exceed retail by 50–200% for hyped colourways.",
    "Jordan 1 High fits true to size. If you're between sizes, go half a size up — the leather upper runs slightly narrow on some colourways.",
    [
      { q: "What is the cheapest price for Air Jordan 1 in the UK?", a: "Use the comparison above for live prices. Standard colourways retail at £169.95 — hyped colourways often trade above RRP on resale platforms." },
      { q: "What does Air Jordan 1 Retro High OG retail for?", a: "£169.95 on Nike.com and authorised retailers. Limited and collaboration pairs retail higher — typically £180–£250." },
      { q: "Does Air Jordan 1 High run true to size?", a: "Yes, true to size for most. Half a size up if you're between sizes or have wider feet." },
      { q: "Where can I buy Air Jordan 1 in the UK?", a: "Nike.com, JD Sports, Size?, Foot Locker, and END. Clothing are the main UK stockists. For sold-out colourways, StockX, GOAT, and Klekt are the trusted resale options." },
      { q: "Why is Air Jordan 1 so expensive on resale?", a: "Nike limits supply on hyped colourways deliberately, creating scarcity. Resale prices reflect secondary market demand — the most sought-after colourways like Chicago and Bred regularly sell for 2–3x retail." },
    ],
  ),
  def(
    "Air Jordan 4 Retro",
    "Jordan", "shoes", 219.95,
    ["nike.com","jdsports.co.uk","size.co.uk","footlocker.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"],
    "The Air Jordan 4 Retro is one of the most coveted silhouettes in Nike's Jordan line. Designed by Tinker Hatfield in 1989, it features the iconic mesh panel sides, lace locks, and a visible Air unit. Each colourway drop sells out fast — comparing prices across UK retailers and resale platforms is essential.",
    "Jordan 4 fits true to size. Go half a size up if you have wider feet — the shoe is slightly narrow across the midfoot.",
    [
      { q: "What is the cheapest price for Air Jordan 4 in the UK?", a: "Use the comparison above for live prices. Standard colourways start from around £179. Hyped colourways often trade at 2–3x retail on resale platforms." },
      { q: "What does Air Jordan 4 retail for?", a: "Most Air Jordan 4 Retro colourways retail at £189.95–£219.95 on Nike.com. Collaboration pairs go higher." },
      { q: "Does Air Jordan 4 run true to size?", a: "Yes, generally true to size. Half a size up if you prefer extra room or have wider feet." },
      { q: "Where can I buy Air Jordan 4 in the UK?", a: "Nike.com, JD Sports, Size?, Foot Locker, and END. Clothing. For sold-out colourways: StockX, GOAT, and Klekt." },
    ],
  ),
  // ─── Adidas ─────────────────────────────────────────────────────────────────
  def(
    "Adidas Samba OG White Black Gum",
    "Adidas", "shoes", 100,
    ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"],
    "The Adidas Samba OG is the trainer of the decade. Originally a 1950s indoor football shoe, it exploded into mainstream fashion in 2023 and hasn't slowed down. The White/Black/Gum colourway with suede overlays is the hero — stocked at almost every UK retailer but prices vary more than you'd expect.",
    "Samba OG runs small — go half a size up from your usual Adidas size. The toe box is narrow, so wide-footed buyers may want to size up a full size.",
    [
      { q: "What is the cheapest price for Adidas Samba OG in the UK?", a: "Use the comparison above for live prices. The Samba OG retails at £100 — discounts of 10–15% appear regularly at Schuh, Zalando, and ASOS during sale events." },
      { q: "What does Adidas Samba OG retail for?", a: "£100 on Adidas.co.uk and most authorised UK retailers." },
      { q: "Does Adidas Samba run small?", a: "Yes — Samba runs half a size small. Go half a size up from your usual shoe size. Wide-footed buyers may need a full size up." },
      { q: "Where can I buy Adidas Samba OG in the UK?", a: "Adidas.co.uk, JD Sports, Size?, Schuh, Zalando, and END. Clothing are the main stockists. StockX, GOAT, and Klekt carry sold-out colourways." },
      { q: "Does the Adidas Samba go on sale?", a: "Standard colourways occasionally discount at Zalando and ASOS. Adidas.co.uk rarely marks down the Samba OG — demand keeps it at full price." },
    ],
  ),
  def(
    "Adidas Handball Spezial Blue Gum",
    "Adidas", "shoes", 100,
    ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com","klekt.com"],
    "The Adidas Handball Spezial in Blue/Gum is the colourway that sparked the Spezial resurgence. Originally a 1979 indoor handball shoe, it sat dormant in the Adidas archive for decades before exploding in 2023. The royal blue suede with gum sole is the hardest colourway to keep in stock — restocks sell out within hours.",
    "Handball Spezial runs narrow — go half a size up if you have wider feet. Normal-width feet: true to size works but the suede breaks in over time.",
    [
      { q: "What is the cheapest price for Adidas Handball Spezial in the UK?", a: "Use the comparison above for live prices. The Spezial retails at £100 but the Blue/Gum colourway trades above retail on resale platforms due to demand." },
      { q: "What does Adidas Handball Spezial retail for?", a: "£100 on Adidas.co.uk. The Spezial rarely goes on sale — supply is kept tight." },
      { q: "Does Adidas Handball Spezial run small?", a: "It runs narrow rather than short. If you have wider feet, go half a size up. Normal-width feet: true to size is fine." },
      { q: "Where can I buy Adidas Handball Spezial in the UK?", a: "Adidas.co.uk, JD Sports, Size?, Schuh, and Zalando. The Blue/Gum regularly sells out — check Klekt, GOAT, and StockX for resale." },
      { q: "Is the Adidas Handball Spezial going out of fashion?", a: "Not yet. Sales data from JD Sports shows it as a top-4 bestseller into 2025. Its minimal silhouette and broad styling versatility suggest staying power rather than a trend peak." },
    ],
  ),
  def(
    "Adidas Gazelle Indoor Green Gum",
    "Adidas", "shoes", 100,
    ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"],
    "The Adidas Gazelle Indoor in Green/Gum is the eye-catching colourway that made the Gazelle Indoor a must-have for 2024. Softer and more streamlined than the classic Gazelle, the Indoor version has a flatter sole and a premium suede finish. The green colourway stands out — and isn't always easy to find in all sizes.",
    "Gazelle Indoor fits true to size for most. The suede upper has minimal stretch, so go half a size up if you're in between.",
    [
      { q: "What is the cheapest price for Adidas Gazelle Indoor in the UK?", a: "Use the comparison above for live prices across Adidas, JD, Size?, Schuh, and Zalando." },
      { q: "What does Adidas Gazelle Indoor retail for?", a: "£100 on Adidas.co.uk and at most UK authorised retailers." },
      { q: "Is Adidas Gazelle Indoor true to size?", a: "Generally true to size. If you're between sizes, go half a size up — the suede doesn't stretch much." },
      { q: "What's the difference between Adidas Gazelle and Gazelle Indoor?", a: "The Gazelle Indoor has a flat gum sole designed for indoor court use — it sits lower to the ground and has a cleaner, more minimal look than the classic Gazelle's cupsole." },
    ],
  ),
  def(
    "Adidas Campus 00s Cloud White",
    "Adidas", "shoes", 95,
    ["adidas.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","asos.com","stockx.com"],
    "The Adidas Campus 00s Cloud White is one of the most universally wearable Adidas trainers in the current line-up. A reworked take on the 1980s Campus silhouette, it features premium suede with contrasting 3-stripe branding and a chunky sole update. At £95 RRP it's accessible — and often available slightly cheaper at Zalando or ASOS.",
    "Campus 00s fits true to size. The toe box is roomy enough for most foot widths — no need to size up unless you prefer extra space.",
    [
      { q: "What is the cheapest price for Adidas Campus 00s in the UK?", a: "Use the comparison above for live prices. Zalando and ASOS often have the Campus 00s at 10–15% off during sale events." },
      { q: "What does Adidas Campus 00s retail for?", a: "£95 on Adidas.co.uk. The Cloud White colourway is one of the most widely stocked." },
      { q: "Is Adidas Campus 00s true to size?", a: "Yes, true to size. The fit is roomy enough that most people don't need to size up." },
      { q: "What's the difference between Adidas Campus and Campus 00s?", a: "The Campus 00s has a slightly chunkier sole and roomier toe box than the original 1980s Campus. The '00s' refers to the early-2000s street styling influence in the updated design." },
    ],
  ),
  // ─── New Balance ────────────────────────────────────────────────────────────
  def(
    "New Balance 550 White Green",
    "New Balance", "shoes", 109.99,
    ["newbalance.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"],
    "The New Balance 550 White/Green is the colourway that propelled the 550 from obscure archive model to one of the most copied silhouettes in the trainer market. Originally an 80s basketball shoe, it was revived in 2020 via AIMÉ LEON DORE collaboration and never looked back. The green panel detailing on a white leather base is clean, versatile, and consistently in demand.",
    "New Balance 550 fits true to size. The leather upper is roomy — wide-footed buyers won't need to size up.",
    [
      { q: "What is the cheapest price for New Balance 550 in the UK?", a: "Use the comparison above for live prices across New Balance, JD Sports, Size?, Schuh, and Zalando." },
      { q: "What does New Balance 550 retail for?", a: "£109.99 on NewBalance.co.uk and at most UK authorised retailers." },
      { q: "Is New Balance 550 true to size?", a: "Yes, true to size. The leather upper is generously cut so wide-footed buyers don't need to size up." },
      { q: "Where can I buy New Balance 550 in the UK?", a: "New Balance.co.uk, JD Sports, Size?, Schuh, and Zalando are the main UK stockists." },
      { q: "Does New Balance 550 go on sale?", a: "Occasionally at Zalando and Schuh, typically 10–20% off during sale events. The White/Green colourway is popular enough that it rarely drops significantly." },
    ],
  ),
  def(
    "New Balance 990v6 Grey",
    "New Balance", "shoes", 199.99,
    ["newbalance.co.uk","size.co.uk","endclothing.com","jdsports.co.uk","stockx.com","goat.com"],
    "The New Balance 990v6 Grey is the premium statement piece in the New Balance range. Made in the USA, it carries the heritage and craftsmanship that the 990 series has stood for since 1982. At £199.99 it's priced above most competitors — but the quality difference is noticeable. A serious trainer for serious buyers.",
    "New Balance 990v6 fits true to size. The fit is more generous than the 550 — standard or wide-foot buyers are comfortable at TTS.",
    [
      { q: "What is the cheapest price for New Balance 990v6 in the UK?", a: "Use the comparison above for live prices. The 990v6 retails at £199.99 and rarely discounts significantly." },
      { q: "What does New Balance 990v6 retail for?", a: "£199.99 on NewBalance.co.uk. It's Made in USA, which commands a price premium over the 574 and 550." },
      { q: "Is New Balance 990v6 made in the USA?", a: "Yes. The 990 series is entirely manufactured in New Balance's Massachusetts factories — one of the few remaining trainers made in America." },
      { q: "What's the difference between New Balance 990v5 and 990v6?", a: "The v6 has a refined midsole with updated ENCAP cushioning, a slightly slimmer profile, and cleaner upper detailing. The overall silhouette is very similar — if you own a v5, the v6 feels like a natural upgrade." },
    ],
  ),
  // ─── ASICS ──────────────────────────────────────────────────────────────────
  def(
    "ASICS Gel-Kayano 14 White",
    "ASICS", "shoes", 119.99,
    ["asics.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","endclothing.com","stockx.com","goat.com"],
    "The ASICS Gel-Kayano 14 White is the chunky retro runner that helped define the 'dad shoe' aesthetic that's dominated streetwear since 2022. Originally a stability running shoe from 2001, its complex panelling, visible Gel cushioning units, and layered mesh make it one of the most distinctive silhouettes in the market right now.",
    "Gel-Kayano 14 runs slightly long — go half a size down if you're between sizes, or stick to your normal size. It's not narrow.",
    [
      { q: "What is the cheapest price for ASICS Gel-Kayano 14 in the UK?", a: "Use the comparison above for live prices across ASICS, JD Sports, Size?, Schuh, and Zalando." },
      { q: "What does ASICS Gel-Kayano 14 retail for?", a: "£119.99 on ASICS.co.uk. Some retailers stock it slightly cheaper — Zalando and Schuh are worth checking." },
      { q: "Does ASICS Gel-Kayano 14 run true to size?", a: "Slightly long — most buyers recommend your normal size. If you're exactly between sizes, go half down." },
      { q: "What's the difference between ASICS Gel-Kayano 14 and Gel-1130?", a: "The Kayano 14 is bulkier with more panelling and a more complex silhouette. The Gel-1130 is sleeker and lower-profile. Both are retro runners — the Kayano 14 makes a bolder statement." },
      { q: "Where can I buy ASICS Gel-Kayano 14 in the UK?", a: "ASICS.co.uk, JD Sports, Size?, Schuh, Zalando, and END. Clothing. StockX and GOAT for sold-out colourways." },
    ],
  ),
  def(
    "ASICS Gel-1130 White Silver",
    "ASICS", "shoes", 109.99,
    ["asics.co.uk","jdsports.co.uk","size.co.uk","schuh.co.uk","zalando.co.uk","stockx.com","goat.com"],
    "The ASICS Gel-1130 White/Silver is the more understated chunky runner from ASICS — sleeker than the Kayano 14 but with the same retro running DNA. It sits lower to the ground, has cleaner panelling, and is easier to style with minimal fits. A strong alternative for buyers who find the Kayano 14 too bold.",
    "Gel-1130 fits true to size. The fit is slightly narrower than the Kayano 14 — wide-footed buyers should go half a size up.",
    [
      { q: "What is the cheapest price for ASICS Gel-1130 in the UK?", a: "Use the comparison above. Zalando and Schuh frequently have the Gel-1130 at 10–15% below RRP." },
      { q: "What does ASICS Gel-1130 retail for?", a: "£109.99 on ASICS.co.uk. Generally cheaper than the Gel-Kayano 14." },
      { q: "Is ASICS Gel-1130 true to size?", a: "Yes, true to size. Slightly narrower than the Kayano 14 — wide-foot buyers may prefer half a size up." },
      { q: "Which is better — ASICS Gel-1130 or Gel-Kayano 14?", a: "Depends on your style. The Gel-1130 is cleaner and easier to style with minimal fits. The Kayano 14 is bolder and makes more of a statement. Both retail at a similar price." },
    ],
  ),
  // ─── Clothing ───────────────────────────────────────────────────────────────
  def(
    "Nike Tech Fleece Joggers Black",
    "Nike", "clothing", 89.99,
    ["nike.com","jdsports.co.uk","footlocker.co.uk","footasylum.com","asos.com","next.co.uk"],
    "Nike Tech Fleece Joggers in Black are the benchmark for premium athletic casual wear in the UK. The bonded fleece fabric is lighter than standard fleece with better shape retention, and the tapered fit works as well on the street as it does at the gym. The best-selling colour and cut — price differences between retailers regularly hit £15.",
    "Nike Tech Fleece Joggers run true to size in length but slim in the leg. If you prefer more room, size up.",
    [
      { q: "What is the cheapest price for Nike Tech Fleece Joggers in the UK?", a: "Use the comparison above. JD Sports, Foot Locker, and ASOS frequently run promotions — 10–20% off is common during sale events." },
      { q: "What does Nike Tech Fleece retail for?", a: "£89.99 on Nike.com for the standard jogger. Tech Fleece sets (hoodie + jogger) cost more. Sale prices regularly drop to £65–£75." },
      { q: "Do Nike Tech Fleece Joggers run small?", a: "The leg is slim — if you prefer more room or have muscular legs, size up. Length is true to size." },
      { q: "Where to buy Nike Tech Fleece in the UK?", a: "Nike.com, JD Sports, Foot Locker, Footasylum, ASOS, and Next. JD Sports and ASOS are the most likely to have them on sale." },
    ],
  ),
  def(
    "The North Face Nuptse 700 Jacket Black",
    "The North Face", "clothing", 299.99,
    ["thenorthface.com","jdsports.co.uk","size.co.uk","asos.com","selfridges.com","zalando.co.uk","endclothing.com"],
    "The North Face Nuptse 700 Jacket in Black is the most recognisable puffer jacket in the UK. Its boxy silhouette, 700-fill goose down insulation, and the iconic stacked logo have made it a winter essential across every demographic. At £299.99 RRP, finding a deal matters — prices vary significantly across UK retailers.",
    "Nuptse 700 fits slightly boxy by design. If you want a slimmer look, size down one. Standard fit: true to size.",
    [
      { q: "What is the cheapest price for North Face Nuptse in the UK?", a: "Use the comparison above for live prices. Zalando and ASOS often have the Nuptse at 15–20% off during end-of-season sales." },
      { q: "What does North Face Nuptse retail for?", a: "£299.99 on TheNorthFace.com. Sale prices typically drop to £220–£260 at Zalando and ASOS." },
      { q: "Is North Face Nuptse true to size?", a: "It fits boxy by design. Size down one if you prefer a slimmer silhouette. Standard fit: true to size." },
      { q: "Where to buy North Face Nuptse in the UK?", a: "TheNorthFace.com, JD Sports, ASOS, Zalando, Selfridges, and END. Clothing are the main UK stockists." },
      { q: "What fill is the North Face Nuptse?", a: "700-fill goose down — warm enough for temperatures down to around -10°C. It's a genuine performance jacket as well as a fashion piece." },
    ],
  ),
];

// Helper to look up a product by slug
export function getProductBySlug(slug: string): BestPriceProduct | undefined {
  return BEST_PRICE_PRODUCTS.find(p => p.slug === slug);
}
