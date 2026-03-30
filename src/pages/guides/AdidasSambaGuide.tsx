import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const AdidasSambaGuide = () => {
  useEffect(() => {
    document.title = "Adidas Samba Buying Guide — Best Prices & Size Guide UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "The complete UK guide to buying the Adidas Samba. Size guide, OG vs ADV comparison, best colourways, and where to find the cheapest price across UK retailers.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "Samba OG White/Black", slug: "Adidas Samba OG White Black", desc: "The original colourway. White leather with black three stripes and gum sole. The most sought-after pair." },
    { name: "Samba OG Black/White", slug: "Adidas Samba OG Black White", desc: "Inverted colourway. Black leather upper with white details. Just as clean as the OG white." },
    { name: "Samba OG White/Green", slug: "Adidas Samba OG White Green", desc: "White leather with sub green three stripes. One of the most popular colourways of the 2024 Samba wave." },
    { name: "Samba ADV", slug: "Adidas Samba ADV", desc: "Skate-inspired version with suede overlays and extra padding. Slightly chunkier silhouette." },
    { name: "Samba OG W (Women's)", slug: "Adidas Samba OG Women's", desc: "Women's specific sizing with the same OG design. Available in exclusive women's colourways." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Adidas Samba UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The Adidas Samba has been one of the UK's most popular trainers since its streetwear revival in 2022.
            Originally a football training shoe from 1950, it's now a wardrobe staple. Here's everything you need to know.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Sizing */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Adidas Samba Size Guide</h2>
            <p className="mb-3 text-muted-foreground">
              The Samba runs small — most people need to go <span className="font-semibold text-foreground">half a size up</span> from their usual Adidas size.
              If you normally wear a UK 9 in Stan Smiths, try a UK 9.5 in the Samba.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 mb-4">
              <span className="font-semibold">Sizing tip:</span> The Samba has a narrow toe box. If you have wide feet, go up a full size.
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

          {/* OG vs ADV */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Samba OG vs Samba ADV — What's the Difference?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Samba OG",
                  price: "~£90",
                  points: ["Smooth leather upper", "Original slim profile", "Gum outsole", "Classic football-inspired look", "Best for lifestyle/casual wear"],
                },
                {
                  title: "Samba ADV",
                  price: "~£90",
                  points: ["Suede and leather combo", "Chunkier profile", "Extra padding for skating", "More textured look", "Best for skate-inspired outfits"],
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
            <h2 className="mb-3 text-xl font-bold text-foreground">Most Popular Colourways</h2>
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
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy the Adidas Samba in the UK</h2>
            <p className="mb-3 text-muted-foreground">
              The Samba is available at most major UK retailers but stock levels vary. Prices are consistent at retail
              but sales do appear — especially at the end of season.
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">adidas.co.uk</span> — full colourway range, new drops first. Free delivery over £50.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — wide size range, student discounts available.</li>
              <li><span className="font-semibold text-foreground">ASOS</span> — often has sale prices and free returns.</li>
              <li><span className="font-semibold text-foreground">End Clothing</span> — stocks exclusive colourways and collaboration pairs.</li>
              <li><span className="font-semibold text-foreground">SNS (Sneakersnstuff)</span> — good for limited releases and EU-exclusive colourways.</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest Adidas Samba right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across adidas.co.uk, JD Sports, ASOS, End Clothing and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("Adidas Samba OG White Black")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default AdidasSambaGuide;
