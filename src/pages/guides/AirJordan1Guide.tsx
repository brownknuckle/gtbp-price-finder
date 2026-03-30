import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const AirJordan1Guide = () => {
  useEffect(() => {
    document.title = "Air Jordan 1 Buying Guide — Best Prices & Size Guide UK | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "The complete UK guide to buying the Air Jordan 1. Size guide, High vs Low vs Mid comparison, best colourways, and where to find the cheapest price.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  const colorways = [
    { name: "Jordan 1 High OG Chicago", slug: "Air Jordan 1 Retro High OG Chicago", desc: "The most iconic colourway. Red, white and black. Rarely available at retail — commands a significant resale premium." },
    { name: "Jordan 1 High OG Bred", slug: "Air Jordan 1 Retro High OG Bred", desc: "Black and red. Originally MJ's banned colourway. One of the most sought-after AJ1s every time it retros." },
    { name: "Jordan 1 High OG University Blue", slug: "Air Jordan 1 Retro High OG University Blue", desc: "White and blue. One of the cleaner high colourways — easier to find at or near retail." },
    { name: "Jordan 1 Low OG Black Toe", slug: "Air Jordan 1 Low OG Black Toe", desc: "White, black and red on a low silhouette. More wearable for everyday use than the High." },
    { name: "Jordan 1 Mid Chicago", slug: "Air Jordan 1 Mid Chicago", desc: "A more accessible take on the Chicago colourway at a lower price point. Widely available." },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guide</p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Air Jordan 1 UK Buying Guide</h1>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            The Air Jordan 1 is one of the most iconic sneakers ever made. Originally designed for Michael Jordan in 1985,
            it's now one of the most coveted shoes in the UK market. Every retro release sells out fast. Here's what you need to know.
          </p>
        </motion.div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Sizing */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Air Jordan 1 Size Guide</h2>
            <p className="mb-3 text-muted-foreground">
              The AJ1 fits <span className="font-semibold text-foreground">true to size</span> for most people.
              If you're between sizes or have wide feet, go half a size up — the leather upper is stiff at first and takes time to break in.
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
          </section>

          {/* High vs Mid vs Low */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">Jordan 1 High vs Mid vs Low — Which to Buy?</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Jordan 1 High OG",
                  price: "~£150",
                  points: ["Original ankle-high silhouette", "OG colourways and retros", "Higher resale value", "Best for collectors", "Most hyped releases"],
                },
                {
                  title: "Jordan 1 Mid",
                  price: "~£110",
                  points: ["Mid-top cut", "More colourways available", "Easier to find at retail", "Good everyday option", "Lower resale premium"],
                },
                {
                  title: "Jordan 1 Low",
                  price: "~£100",
                  points: ["Low-top silhouette", "More wearable day-to-day", "Cleaner, sleeker look", "Easier to style", "Often overlooked — good value"],
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
            <h2 className="mb-3 text-xl font-bold text-foreground">Where to Buy the Air Jordan 1 in the UK</h2>
            <p className="mb-3 text-muted-foreground">
              OG High releases sell out within minutes. Mid and Low colourways are more accessible. These are the best places to try:
            </p>
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Nike.com / SNKRS</span> — official launch platform for OG releases. Enter raffles via the SNKRS app.</li>
              <li><span className="font-semibold text-foreground">JD Sports</span> — reliable for Mid and Low restocks. Occasional OG allocations.</li>
              <li><span className="font-semibold text-foreground">Size?</span> — often gets exclusive OG allocations and early access.</li>
              <li><span className="font-semibold text-foreground">Foot Locker</span> — good for Mid colourways and sale pricing.</li>
              <li><span className="font-semibold text-foreground">StockX / GOAT</span> — resale platforms for sold-out OG releases. Compare prices carefully.</li>
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
                    <th className="px-4 py-2.5 text-left font-semibold">Resale Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["AJ1 High OG (standard)", "£149.95", "£180–£300+"],
                    ["AJ1 High OG (hyped colourway)", "£149.95", "£300–£600+"],
                    ["AJ1 Mid", "£109.95", "£100–£130"],
                    ["AJ1 Low OG", "£104.95", "£110–£160"],
                    ["AJ1 Collaboration", "£180–£250", "£300–£1,000+"],
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
              Mid colourways often trade at or below retail. OG releases almost always command a premium on the resale market.
            </p>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-base font-bold text-foreground">Find the cheapest Air Jordan 1 right now</p>
            <p className="mb-4 text-sm text-muted-foreground">We compare prices across Nike, JD Sports, StockX, GOAT and 25+ more UK retailers in real time.</p>
            <Link to={`/product/${toProductSlug("Air Jordan 1 Retro High OG")}`}>
              <Button>Compare Prices Now</Button>
            </Link>
          </section>

        </div>
      </div>
    </PageTransition>
  );
};

export default AirJordan1Guide;
