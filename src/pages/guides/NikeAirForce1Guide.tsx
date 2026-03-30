import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const NikeAirForce1Guide = () => {
  useEffect(() => {
    document.title = "Nike Air Force 1 Buying Guide — Best Prices & Size Guide UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "Everything you need to know about buying the Nike Air Force 1 in the UK. Size guide, colourway comparison, best retailers, and how to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "Triple White", slug: "Nike Air Force 1 Triple White", desc: "The classic. All-white leather upper, clean and versatile. The most popular AF1 colourway in the UK." },
    { name: "Black", slug: "Nike Air Force 1 Low Black", desc: "All-black leather. Easier to keep clean than Triple White and works with almost any outfit." },
    { name: "Panda (White/Black)", slug: "Nike Air Force 1 Low White Black Panda", desc: "White upper with black swoosh and sole. A go-to colourway that's always available at retail." },
    { name: "Sage Low", slug: "Nike Air Force 1 Low Sage", desc: "Platform version with a taller sole. Popular with women's sizing." },
    { name: "Shadow", slug: "Nike Air Force 1 Shadow", desc: "Deconstructed double swoosh design. Women's exclusive colourway with premium detailing." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Nike Air Force 1 UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The Nike Air Force 1 is the best-selling sneaker in the UK. Originally released in 1982 as a basketball shoe,
            it became a streetwear staple and has never left. Here's everything you need to know before you buy.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Size guide */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Air Force 1 Size Guide</h2>
            <p className="mb-4 text-muted-foreground">
              The Air Force 1 fits true to size for most people. If you're between sizes, go half a size up —
              the leather upper can feel snug at first but softens with wear.
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
              Women's AF1s run 1.5 sizes smaller than men's. A women's UK 6 = men's UK 4.5.
            </p>
          </section>

          {/* Colourways */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Popular Colourways</h2>
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

          {/* Where to buy */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy in the UK</h2>
            <p className="mb-3 text-muted-foreground">
              The Air Force 1 is widely available, but prices vary significantly between retailers — especially on sale colourways.
              These are the most reliable UK stockists:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Nike.com</span> — full range, often the only place with specific colourways at launch. Free delivery over £50.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — largest physical presence in the UK. Regular promotions and student discounts.</li>
              <li><span className="font-semibold text-foreground">Size?</span> — stocks exclusive colourways and limited editions. Good for hard-to-find pairs.</li>
              <li><span className="font-semibold text-foreground">Foot Locker</span> — competitive pricing, frequent sales, and wide size range.</li>
              <li><span className="font-semibold text-foreground">ASOS</span> — good for sale prices and free returns on most orders.</li>
              <li><span className="font-semibold text-foreground">Schuh</span> — reliable UK retailer with good size availability.</li>
            </ul>
          </section>

          {/* Price guide */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">How Much Should You Pay?</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Model</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Retail Price</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Sale Price Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Air Force 1 '07 (standard)", "£89.95", "£65–£80"],
                    ["Air Force 1 '07 LV8", "£99.95", "£75–£90"],
                    ["Air Force 1 Shadow (Women's)", "£104.95", "£80–£95"],
                    ["Air Force 1 Sage Low (Women's)", "£99.95", "£75–£90"],
                    ["Air Force 1 High '07", "£109.95", "£85–£100"],
                    ["Air Force 1 Collaboration", "£120–£180", "Rarely discounted"],
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
              Standard colourways regularly go on sale. Limited edition and collaboration pairs rarely drop below RRP.
            </p>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest Air Force 1 right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across Nike, JD Sports, Foot Locker, ASOS and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("Nike Air Force 1 Triple White")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default NikeAirForce1Guide;
