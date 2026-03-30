import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const AsicsGelKayano14Guide = () => {
  useEffect(() => {
    document.title = "ASICS Gel-Kayano 14 Buying Guide — Best Prices & Size Guide UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "The complete UK guide to buying the ASICS Gel-Kayano 14. Size guide, colourway comparison, Kayano 14 vs Gel-1130 breakdown, and where to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "Kayano 14 White Sage", slug: "ASICS Gel-Kayano 14 White Sage", desc: "White mesh with sage green overlays. One of the most popular colourways driving the Kayano 14's streetwear moment." },
    { name: "Kayano 14 Cream Black", slug: "ASICS Gel-Kayano 14 Cream Black", desc: "Off-white upper with black detailing. A cleaner colourway that works with almost everything." },
    { name: "Kayano 14 Sheet Rock", slug: "ASICS Gel-Kayano 14 Sheet Rock", desc: "Grey and tan. Tonal, understated colourway — good for those who want the silhouette without the bold colours." },
    { name: "Kayano 14 Blue Expanse", slug: "ASICS Gel-Kayano 14 Blue Expanse", desc: "Dusty blue upper. Softer take on the Kayano 14 palette." },
    { name: "Kayano 14 x Kiko Kostadinov", slug: "ASICS Gel-Kayano 14 Kiko Kostadinov", desc: "Designer collaboration. Commands a resale premium." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">ASICS Gel-Kayano 14 UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The ASICS Gel-Kayano 14 is a 2008 performance running shoe that became one of the UK's most wanted
            trainers in 2022–2024. Its chunky, technical silhouette fits the current appetite for retro runners.
            Here's everything you need to know before buying.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Sizing */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">ASICS Gel-Kayano 14 Size Guide</h2>
            <p className="mb-3 text-muted-foreground">
              The Gel-Kayano 14 fits <span className="font-semibold text-foreground">true to size</span>.
              ASICS sizing is consistent — if you know your size in other ASICS models, stick with it.
              The toe box is roomy, making it comfortable for most foot shapes.
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
                    ["6", "7", "8", "40", "25"],
                    ["6.5", "7.5", "8.5", "40.5", "25.5"],
                    ["7", "8", "9", "41.5", "26"],
                    ["7.5", "8.5", "9.5", "42", "26.5"],
                    ["8", "9", "10", "42.5", "27"],
                    ["8.5", "9.5", "10.5", "43.5", "27.5"],
                    ["9", "10", "11", "44", "28"],
                    ["9.5", "10.5", "11.5", "44.5", "28.5"],
                    ["10", "11", "12", "45", "29"],
                    ["11", "12", "13", "46.5", "30"],
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

          {/* Kayano 14 vs Gel-1130 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Gel-Kayano 14 vs Gel-1130 — Which Should You Buy?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Gel-Kayano 14",
                  price: "~£120",
                  points: ["Chunkier, more technical silhouette", "Higher stack height", "More visible gel unit", "Bolder look", "Best for statement outfits"],
                },
                {
                  title: "Gel-1130",
                  price: "~£100",
                  points: ["Sleeker, lower profile", "Lighter weight feel", "More versatile colourways", "Easier to style casually", "Best for everyday wear"],
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
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy the ASICS Gel-Kayano 14 in the UK</h2>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">asics.co.uk</span> — direct from brand. Widest colourway selection, new drops first.</li>
              <li><span className="font-semibold text-foreground">End Clothing</span> — best for collaboration and limited colourways.</li>
              <li><span className="font-semibold text-foreground">SNS (Sneakersnstuff)</span> — good for exclusive colourways and EU releases.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — accessible option with regular size availability.</li>
              <li><span className="font-semibold text-foreground">Schuh</span> — reliable stock and competitive pricing for standard colourways.</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest ASICS Gel-Kayano 14 right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across asics.co.uk, End Clothing, JD Sports and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("ASICS Gel-Kayano 14 White Sage")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default AsicsGelKayano14Guide;
