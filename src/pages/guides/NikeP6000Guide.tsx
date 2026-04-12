import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const NikeP6000Guide = () => {
  useEffect(() => {
    document.title = "Nike P-6000 Buying Guide — Size Guide, Best Colourways & UK Prices | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "Everything you need to know about buying the Nike P-6000 in the UK. Size guide, best colourways, which retailers stock it, and how to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "White / Black / Metallic Silver", slug: "Nike P-6000 White Black Metallic Silver", desc: "The OG colourway. White mesh upper with black and silver overlays. The most versatile P-6000 and the easiest to match." },
    { name: "Black / White", slug: "Nike P-6000 Black White", desc: "All-black with white sole unit and subtle detailing. Works with everything and hides dirt better than the white pair." },
    { name: "Cream / Gum", slug: "Nike P-6000 Cream Gum", desc: "Off-white upper with a gum rubber sole. A warmer, more tonal take that pairs well with earth tones and beige fits." },
    { name: "Olive / Khaki", slug: "Nike P-6000 Olive Khaki", desc: "Military-inspired colourway that's become a favourite for street styling. Unique in the range and harder to find at full size run." },
    { name: "Platinum Violet", slug: "Nike P-6000 Platinum Violet", desc: "A women's colourway that crosses over well. Soft purple tones on a light grey base — one of the most hyped P-6000 releases." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Nike P-6000 UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The Nike P-6000 is currently the most-searched trainer in the UK. Originally released in 1999 as a
            performance running shoe, it was re-launched as a lifestyle sneaker in 2024 and immediately sold out everywhere.
            Its chunky retro running silhouette sits in the same lane as the Asics Gel-Kayano 14 and New Balance 9060 — but
            at a lower price point. Here's everything you need to know before you buy.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* What is it */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">What Is the Nike P-6000?</h2>
            <p className="text-muted-foreground">
              The P-6000 was part of Nike's late-1990s "Performance 6000" running series — the "P" stands for Performance.
              It featured a mesh and synthetic upper, chunky midsole with Air cushioning, and a wavy outsole. The 2024 retro
              stays close to the original, keeping the layered overlays, the reflective heel counter, and the padded ankle
              collar. It's a proper OG silhouette, not a re-imagined version.
            </p>
            <p className="mt-3 text-muted-foreground">
              If you're comparing it to its peers: it's bulkier than the New Balance 550 but more wearable than the Asics
              Gel-Kayano 14. The price sits at £109.95 RRP — cheaper than most comparable chunky runners.
            </p>
          </section>

          {/* Size guide */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Nike P-6000 Size Guide</h2>
            <p className="mb-4 text-muted-foreground">
              The P-6000 fits true to size for most people. The padded collar and mesh upper feel slightly snug when new —
              if you have wide feet or a high instep, go half a size up. The shoe breaks in quickly after a few wears.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">UK</th>
                    <th className="px-4 py-2.5 text-left font-semibold">US Men's</th>
                    <th className="px-4 py-2.5 text-left font-semibold">US Women's</th>
                    <th className="px-4 py-2.5 text-left font-semibold">EU</th>
                    <th className="px-4 py-2.5 text-left font-semibold">CM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["6", "7", "8.5", "40", "25"],
                    ["6.5", "7.5", "9", "40.5", "25.5"],
                    ["7", "8", "9.5", "41", "26"],
                    ["7.5", "8.5", "10", "42", "26.5"],
                    ["8", "9", "10.5", "42.5", "27"],
                    ["8.5", "9.5", "11", "43", "27.5"],
                    ["9", "10", "11.5", "44", "28"],
                    ["9.5", "10.5", "12", "44.5", "28.5"],
                    ["10", "11", "12.5", "45", "29"],
                    ["11", "12", "13.5", "46", "30"],
                  ].map((row) => (
                    <tr key={row[0]} className="hover:bg-secondary/30">
                      {row.map((cell, i) => (
                        <td key={i} className="px-4 py-2 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Nike P-6000 is a unisex shoe. Women typically size down 1.5 from their men's size — a women's US 8 = men's US 6.5.
            </p>
          </section>

          {/* Colourways */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Best Colourways to Buy</h2>
            <p className="mb-4 text-muted-foreground">
              Nike has kept the P-6000 range tight — no endless colourway drops. These are the ones worth knowing about:
            </p>
            <div className="space-y-3">
              {colorways.map((c) => (
                <div key={c.name} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <Link
                    to={`/product/${toProductSlug(c.slug)}`}
                    className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Compare prices <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* P-6000 vs competitors */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">P-6000 vs. Other Chunky Runners</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Trainer</th>
                    <th className="px-4 py-2.5 text-left font-semibold">RRP</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Sizing</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Nike P-6000", "£109.95", "True to size", "Versatility, price point"],
                    ["Asics Gel-Kayano 14", "£120", "Half size up", "Bolder look, more colourways"],
                    ["New Balance 9060", "£139.99", "True to size", "Premium materials, comfort"],
                    ["Adidas Ozweego", "£109.95", "True to size", "More subdued chunky silhouette"],
                    ["Nike Air Max 95", "£164.95", "Half size up", "Iconic Nike heritage look"],
                  ].map((row) => (
                    <tr key={row[0]} className="hover:bg-secondary/30">
                      {row.map((cell, i) => (
                        <td key={i} className="px-4 py-2 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The P-6000 is the most affordable option in this category and the easiest to style casually. The Kayano 14 is bolder; the 9060 is more premium.
            </p>
          </section>

          {/* Where to buy */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy the Nike P-6000 in the UK</h2>
            <p className="mb-3 text-muted-foreground">
              The P-6000 sells out in popular sizes quickly after each restock. These are the most reliable UK stockists:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Nike.com</span> — the primary stockist. First to receive new colourways and restocks. Delivery is fast but rarely on sale.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — stocks the P-6000 consistently and occasionally runs 10–20% off promotions. Student discount applies.</li>
              <li><span className="font-semibold text-foreground">Size?</span> — carries exclusive colourways and is often the only retailer with half-size availability when JD and Nike sell out.</li>
              <li><span className="font-semibold text-foreground">Foot Locker</span> — reliable stock levels and competitive pricing, especially during sale events.</li>
              <li><span className="font-semibold text-foreground">ASOS</span> — worth checking during sale periods. Free returns make it low-risk if you're unsure on sizing.</li>
              <li><span className="font-semibold text-foreground">Schuh</span> — good for wide-foot friendly sizing advice and often has the full size run when others are low.</li>
              <li><span className="font-semibold text-foreground">StockX / GOAT</span> — for sold-out colourways. Prices are above RRP but authentication is guaranteed.</li>
            </ul>
          </section>

          {/* Price guide */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">How Much Should You Pay?</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Colourway</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Retail Price</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Sale Price Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["White / Black / Metallic Silver", "£109.95", "£85–£99"],
                    ["Black / White", "£109.95", "£85–£99"],
                    ["Cream / Gum", "£109.95", "£90–£99"],
                    ["Olive / Khaki", "£109.95", "Rarely discounted"],
                    ["Platinum Violet", "£109.95", "£90–£99"],
                    ["Collaboration / Limited", "£120–£160", "Never discounted"],
                  ].map((row) => (
                    <tr key={row[0]} className="hover:bg-secondary/30">
                      {row.map((cell, i) => (
                        <td key={i} className="px-4 py-2 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The P-6000 rarely goes below £85. If you see it cheaper than £80 for a standard colourway, check the seller carefully — counterfeits are common on marketplace platforms.
            </p>
          </section>

          {/* Authenticity */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Spotting a Fake Nike P-6000</h2>
            <p className="mb-3 text-muted-foreground">
              Demand for the P-6000 has made it a target for counterfeiters. Quick checks:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>The Swoosh should be stitched cleanly — no loose threads or uneven edges.</li>
              <li>The midsole has a subtle texture; fakes often use a smooth, plasticky finish.</li>
              <li>The insole carries a Nike size label — on fakes it's often poorly printed or missing.</li>
              <li>Reflective details on the heel counter should be crisp and even.</li>
              <li>Always buy from authorised retailers or use StockX/GOAT for authentication.</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest P-6000 right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across Nike, JD Sports, Size?, Foot Locker, ASOS and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("Nike P-6000 White Black Metallic Silver")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default NikeP6000Guide;
