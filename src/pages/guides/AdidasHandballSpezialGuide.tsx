import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const AdidasHandballSpezialGuide = () => {
  useEffect(() => {
    document.title = "Adidas Handball Spezial Buying Guide — Size Guide, Best Colourways & UK Prices | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "Everything you need to know about buying the Adidas Handball Spezial in the UK. Size guide (runs narrow), best colourways, Spezial vs Samba, and where to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "Blue / Gum", slug: "Adidas Handball Spezial Blue Gum", desc: "The one that started it all. Bright royal blue suede with a gum sole. The most iconic Spezial colourway and the hardest to keep in stock." },
    { name: "Dark Brown / Gum", slug: "Adidas Handball Spezial Dark Brown Gum", desc: "Earth-toned suede that pairs with almost anything. A slightly more understated take compared to the blue — still sells out fast." },
    { name: "Core Black / White", slug: "Adidas Handball Spezial Core Black White", desc: "The all-black pair with a clean white sole. Most versatile colourway in the range and the easiest to find in full size run." },
    { name: "Green / Gum", slug: "Adidas Handball Spezial Green Gum", desc: "Olive-green suede with the signature gum sole. Harder to pull off than the blue but uniquely stylish with the right fit." },
    { name: "Red / Gum", slug: "Adidas Handball Spezial Red Gum", desc: "Bold red suede with gum sole. A statement colourway — less common than blue but equally desirable. Sells out quickly on drop day." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Adidas Handball Spezial UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The Adidas Handball Spezial is the sneaker of the moment. Originally designed in 1979 for indoor handball courts,
            it sat quietly in the Adidas archive for decades before exploding into mainstream fashion in 2023 — worn by Bella
            Hadid, pushed hard by Adidas, and now one of JD Sports' four best-selling trainers. Here's everything you need
            to know before buying.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* What is it */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">What Is the Handball Spezial?</h2>
            <p className="text-muted-foreground">
              The Handball Spezial ("Spezial" is German for "special") was built for indoor court sports. Its defining
              features are a low-profile suede upper, a flat gum rubber sole with pivot points for indoor grip, a T-toe
              overlay at the front, and the classic three-stripe branding on the sides. It's essentially a flatter, more
              minimalist cousin of the Adidas Samba — same DNA, different character.
            </p>
            <p className="mt-3 text-muted-foreground">
              The modern retro sits at £100 RRP — cheap compared to most hyped trainers. That price point, combined with
              its clean silhouette, is a big part of why it's crossed over from sneakerhead culture into everyday fashion.
            </p>
          </section>

          {/* Size guide */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Handball Spezial Size Guide</h2>
            <p className="mb-2 text-muted-foreground">
              <span className="font-semibold text-foreground">The Handball Spezial runs narrow.</span> If you have wider feet,
              go half a size up. For normal-width feet, true to size is fine — the suede softens with wear and the shoe
              breaks in well. If you're between sizes, size up.
            </p>
            <p className="mb-4 text-muted-foreground">
              Compared to the Samba: the Spezial has a slightly lower profile and a narrower toe box. If you wear a UK 9
              in Samba, start with UK 9 in Spezial but be prepared to go 9.5 if you have a wider foot.
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
                    ["5.5", "6", "7.5", "38.5", "23.5"],
                    ["6", "6.5", "8", "39", "24"],
                    ["6.5", "7", "8.5", "40", "24.5"],
                    ["7", "7.5", "9", "40.5", "25"],
                    ["7.5", "8", "9.5", "41", "25.5"],
                    ["8", "8.5", "10", "42", "26"],
                    ["8.5", "9", "10.5", "42.5", "26.5"],
                    ["9", "9.5", "11", "43", "27"],
                    ["9.5", "10", "11.5", "44", "27.5"],
                    ["10", "10.5", "12", "44.5", "28"],
                    ["10.5", "11", "12.5", "45", "28.5"],
                    ["11", "11.5", "13", "46", "29"],
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
              Wide-footed buyers: go half a size up. The suede upper has minimal stretch so it won't accommodate wide feet at TTS.
            </p>
          </section>

          {/* Colourways */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Best Colourways to Buy</h2>
            <p className="mb-4 text-muted-foreground">
              Adidas releases the Spezial in small batches — restocks happen but sell out fast. These are the colourways worth tracking:
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

          {/* Spezial vs Samba */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Handball Spezial vs Adidas Samba</h2>
            <p className="mb-4 text-muted-foreground">
              These are the two most-compared Adidas court shoes right now. Here's how they actually differ:
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold"></th>
                    <th className="px-4 py-2.5 text-left font-semibold">Handball Spezial</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Adidas Samba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["RRP", "£100", "£100"],
                    ["Upper", "Suede", "Suede + leather"],
                    ["Sole", "Flat gum (indoor grip)", "Cupsole (slightly thicker)"],
                    ["Toe box", "Narrow", "Slightly roomier"],
                    ["Sizing", "Go half up if wide feet", "Go half up — runs small overall"],
                    ["Profile", "Very flat and low", "Slightly more cushioned"],
                    ["Best for", "Minimal, clean look", "More structured silhouette"],
                  ].map((row) => (
                    <tr key={row[0]} className="hover:bg-secondary/30">
                      {row.map((cell, i) => (
                        <td key={i} className={`px-4 py-2 text-muted-foreground ${i === 0 ? "font-semibold text-foreground" : ""}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              If you're on the fence: the Samba is easier to size and more forgiving on width. The Spezial is cleaner and more minimalist. Both are worth owning.
            </p>
          </section>

          {/* Where to buy */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy in the UK</h2>
            <p className="mb-3 text-muted-foreground">
              Demand exceeds supply on popular colourways. Signing up for restock alerts at these retailers is the best strategy:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Adidas.co.uk</span> — primary stockist. First to have new colourways and the only place with the full range. Subscribe to email alerts for your size.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — largest physical UK stockist. Good for trying on sizing before buying. Student discount available.</li>
              <li><span className="font-semibold text-foreground">Size?</span> — often carries exclusive colourways. Worth checking when JD and Adidas are sold out.</li>
              <li><span className="font-semibold text-foreground">Schuh</span> — reliable restocks and good half-size availability. Free next-day delivery on orders over £60.</li>
              <li><span className="font-semibold text-foreground">Zalando</span> — useful when other UK retailers are out. Free returns make it low-risk for sizing.</li>
              <li><span className="font-semibold text-foreground">END. Clothing</span> — stocks limited colourways and collabs. Good reputation, fast dispatch.</li>
              <li><span className="font-semibold text-foreground">StockX / GOAT / Klekt</span> — for sold-out colourways. Prices above RRP but authenticated. Klekt tends to be cheapest of the three for UK buyers.</li>
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
                    <th className="px-4 py-2.5 text-left font-semibold">Resale Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Blue / Gum", "£100", "£110–£160 (most hyped)"],
                    ["Dark Brown / Gum", "£100", "£105–£130"],
                    ["Core Black / White", "£100", "£100–£115 (easiest to find at retail)"],
                    ["Green / Gum", "£100", "£105–£140"],
                    ["Red / Gum", "£100", "£110–£150"],
                    ["Collaboration", "£120–£150", "£150–£300+"],
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
              The Spezial rarely goes on sale — Adidas keeps supply tight. If you see it below £90 from an unknown seller, be cautious. Fakes are common.
            </p>
          </section>

          {/* Spotting fakes */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Spotting a Fake Handball Spezial</h2>
            <p className="mb-3 text-muted-foreground">
              The Spezial's popularity has made it a prime target for counterfeiters. Key checks:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li>The suede should feel soft and even — fakes often use rougher, stiffer material that doesn't bed in.</li>
              <li>The three stripes should be stitched, not printed or glued. Check that they're parallel and evenly spaced.</li>
              <li>The gum sole should be translucent amber — fakes often use an opaque yellow or orange rubber.</li>
              <li>The Adidas trefoil logo on the tongue should be clean and centred, not blurry or off-centre.</li>
              <li>The insole carries a size label with EU and UK size — fakes often omit the UK size or misspell "Adidas".</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest Handball Spezial right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across Adidas, JD Sports, Size?, Schuh, Zalando and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("Adidas Handball Spezial Blue Gum")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default AdidasHandballSpezialGuide;
