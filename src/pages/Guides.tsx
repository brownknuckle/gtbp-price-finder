import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";

const guides = [
  {
    slug: "nike-air-force-1",
    name: "Nike Air Force 1",
    desc: "Size guide, colourway breakdown, price guide and where to buy the UK's best-selling sneaker.",
    brand: "Nike",
    emoji: "👟",
  },
  {
    slug: "adidas-samba",
    name: "Adidas Samba",
    desc: "Size guide (runs small), OG vs ADV comparison, best colourways and UK stockists.",
    brand: "Adidas",
    emoji: "⚽",
  },
  {
    slug: "adidas-gazelle",
    name: "Adidas Gazelle",
    desc: "Size guide, Gazelle vs Samba comparison, best colourways and where to find the cheapest price.",
    brand: "Adidas",
    emoji: "🔱",
  },
  {
    slug: "new-balance-550",
    name: "New Balance 550",
    desc: "Size guide, 550 vs 574 comparison, best colourways and UK retailer breakdown.",
    brand: "New Balance",
    emoji: "N",
  },
  {
    slug: "air-jordan-1",
    name: "Air Jordan 1",
    desc: "Size guide, High vs Mid vs Low breakdown, colourway price guide and where to buy.",
    brand: "Jordan",
    emoji: "🏀",
  },
  {
    slug: "asics-gel-kayano-14",
    name: "ASICS Gel-Kayano 14",
    desc: "Size guide, Kayano 14 vs Gel-1130 comparison, best colourways and UK stockists.",
    brand: "ASICS",
    emoji: "🏃",
  },
];

const Guides = () => {
  useEffect(() => {
    document.title = "Sneaker Buying Guides UK — Size Guides & Best Prices | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = "UK sneaker buying guides — size charts, colourway comparisons, and where to find the cheapest price. Covers Nike Air Force 1, Adidas Samba, Jordan 1, New Balance 550 and more.";
    return () => { document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly"; };
  }, []);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Buying Guides</p>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">UK Sneaker Buying Guides</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Size guides, colourway breakdowns, and price comparisons for the UK's most popular sneakers.
            Each guide tells you exactly what to buy, what size to get, and where to find the cheapest price.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide, i) => (
            <motion.div
              key={guide.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <Link
                to={`/guides/${guide.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl">{guide.emoji}</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{guide.brand}</p>
                    <p className="font-bold text-foreground">{guide.name}</p>
                  </div>
                </div>
                <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{guide.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Guides;
