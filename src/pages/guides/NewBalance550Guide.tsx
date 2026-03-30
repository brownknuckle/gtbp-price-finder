import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const NewBalance550Guide = () => {
  useEffect(() => {
    document.title = "New Balance 550 Buying Guide — Best Prices & Size Guide UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "The complete UK guide to buying the New Balance 550. Size guide, colourway comparison, 550 vs 574 breakdown, and where to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "550 White Grey", slug: "New Balance 550 White Grey", desc: "The most popular colourway. Clean white leather with grey suede overlays. Works with everything." },
    { name: "550 White Green", slug: "New Balance 550 White Green", desc: "White base with green accents. One of the standout colourways from the 550's 2020 revival." },
    { name: "550 White Navy", slug: "New Balance 550 White Navy", desc: "White and navy. A classic combination that's easy to style and always in stock." },
    { name: "550 Burgundy", slug: "New Balance 550 Burgundy White", desc: "Burgundy suede with white leather. A rich colourway that works well in autumn and winter." },
    { name: "550 x Aimé Leon Dore", slug: "New Balance 550 Aime Leon Dore", desc: "The collaboration that relaunched the 550. Highly sought-after, commands a resale premium." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">New Balance 550 UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The New Balance 550 was originally a 1989 basketball shoe that sat unnoticed for 30 years.
            Its 2020 revival — sparked by a collaboration with Aimé Leon Dore — turned it into one of
            the most popular trainers in the UK. Here's what you need to know before buying.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Sizing */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">New Balance 550 Size Guide</h2>
            <p className="mb-3 text-muted-foreground">
              The 550 fits <span className="font-semibold text-foreground">true to size</span> for most people.
              Unlike the Samba, you don't need to size up. If you have wide feet, the 550 has a comfortable
              box toe that accommodates most foot shapes well.
            </p>
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
                    ["6", "6.5", "8", "39.5"],
                    ["6.5", "7", "8.5", "40"],
                    ["7", "7.5", "9", "40.5"],
                    ["7.5", "8", "9.5", "41.5"],
                    ["8", "8.5", "10", "42"],
                    ["8.5", "9", "10.5", "42.5"],
                    ["9", "9.5", "11", "43.5"],
                    ["9.5", "10", "11.5", "44"],
                    ["10", "10.5", "12", "44.5"],
                    ["11", "11.5", "13", "46"],
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

          {/* 550 vs others */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">New Balance 550 vs 574 — Which Should You Buy?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "New Balance 550",
                  price: "~£110",
                  points: ["Basketball-inspired silhouette", "Chunky, retro profile", "Leather and suede upper", "Bolder, more fashion-forward look", "Best for streetwear outfits"],
                },
                {
                  title: "New Balance 574",
                  price: "~£85",
                  points: ["Running-inspired silhouette", "Slimmer, more understated profile", "Mesh and suede upper", "Classic, versatile everyday trainer", "Best for casual, everyday wear"],
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
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy the New Balance 550 in the UK</h2>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">newbalance.co.uk</span> — widest colourway selection, direct from brand. Free delivery over £60.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — reliable stock and regular student discounts.</li>
              <li><span className="font-semibold text-foreground">Size?</span> — often gets exclusive or early-release colourways.</li>
              <li><span className="font-semibold text-foreground">End Clothing</span> — good for collaboration pairs and rarer colourways.</li>
              <li><span className="font-semibold text-foreground">ASOS</span> — competitive pricing and free returns.</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest New Balance 550 right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across newbalance.co.uk, JD Sports, ASOS, End Clothing and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("New Balance 550 White Grey")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default NewBalance550Guide;
