import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const AdidasGazelleGuide = () => {
  useEffect(() => {
    document.title = "Adidas Gazelle Buying Guide — Best Prices & Size Guide UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "The complete UK guide to buying the Adidas Gazelle. Size guide, Gazelle vs Samba comparison, best colourways, and where to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "Gazelle Indoor Green", slug: "Adidas Gazelle Indoor Green", desc: "Deep green suede. One of the most popular colourways driving the Gazelle's 2023 revival." },
    { name: "Gazelle Bold Black", slug: "Adidas Gazelle Bold Black", desc: "Platform version in all-black. Women's focused silhouette with a taller outsole." },
    { name: "Gazelle OG Navy", slug: "Adidas Gazelle OG Navy", desc: "Classic navy suede with white three stripes. The original OG colourway — always in stock." },
    { name: "Gazelle Indoor Burgundy", slug: "Adidas Gazelle Indoor Burgundy", desc: "Deep burgundy suede. A rich alternative to the green — equally popular." },
    { name: "Gazelle x Gucci", slug: "Adidas Gazelle Gucci", desc: "High-profile collaboration. Commands significant resale premium." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Adidas Gazelle UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The Adidas Gazelle has been around since 1968, but its 2022–2024 revival turned it into one of
            the UK's most-worn shoes. Worn by Bella Hadid and Rihanna, the Gazelle became the it-shoe of its era.
            Here's everything you need to know before buying.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Sizing */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Adidas Gazelle Size Guide</h2>
            <p className="mb-3 text-muted-foreground">
              The Gazelle runs <span className="font-semibold text-foreground">small</span> — similar to the Samba.
              Most people should go half a size up. If you have wide feet, go a full size up.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 mb-4">
              <span className="font-semibold">Sizing tip:</span> If you normally wear a UK 9 in Stan Smiths, try a UK 9.5 in the Gazelle.
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">UK</th>
                    <th className="px-4 py-2.5 text-left font-semibold">US Men's</th>
                    <th className="px-4 py-2.5 text-left font-semibold">US Women's</th>
                    <th className="px-4 py-2.5 text-left font-semibold">EU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["6", "6.5", "7.5", "39.5"],
                    ["6.5", "7", "8", "40"],
                    ["7", "7.5", "8.5", "40.5"],
                    ["7.5", "8", "9", "41.5"],
                    ["8", "8.5", "9.5", "42"],
                    ["8.5", "9", "10", "42.5"],
                    ["9", "9.5", "10.5", "43.5"],
                    ["9.5", "10", "11", "44"],
                    ["10", "10.5", "11.5", "44.5"],
                    ["11", "11.5", "12.5", "46"],
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
          </section>

          {/* Gazelle vs Samba */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Adidas Gazelle vs Samba — Which Should You Buy?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Adidas Gazelle",
                  price: "~£80",
                  points: ["Suede upper", "Slimmer, lower profile", "Slightly lower price", "Softer, more casual look", "Best for everyday casual wear"],
                },
                {
                  title: "Adidas Samba",
                  price: "~£90",
                  points: ["Leather upper", "Chunkier, retro profile", "Gum outsole", "Bolder statement shoe", "Best for streetwear outfits"],
                },
              ].map((v) => (
                <div key={v.title} className="rounded-xl border border-border bg-card p-5">
                  <p className="font-bold text-foreground">{v.title}</p>
                  <p className="mb-3 text-xs text-muted-foreground">RRP {v.price}</p>
                  <ul className="space-y-1">
                    {v.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Colourways */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Best Colourways to Buy</h2>
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
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy the Adidas Gazelle in the UK</h2>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">adidas.co.uk</span> — full colourway range, new Indoor colourways first. Free delivery over £50.</li>
              <li><span className="font-semibold text-foreground">ASOS</span> — frequently has sale prices and free returns.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — wide size range and student discounts.</li>
              <li><span className="font-semibold text-foreground">End Clothing</span> — good for limited colourways and collaboration pairs.</li>
              <li><span className="font-semibold text-foreground">Zalando</span> — competitive pricing and broad size availability.</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest Adidas Gazelle right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across adidas.co.uk, JD Sports, ASOS, End Clothing and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("Adidas Gazelle Indoor Green")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default AdidasGazelleGuide;
