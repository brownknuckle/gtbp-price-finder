import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

const POPULAR_SEARCHES = [
  "Stone Island Shadow Project Jacket",
  "Palace Tri-Ferg Hoodie",
  "Carhartt WIP Chase Hoodie",
  "Supreme Box Logo Hoodie",
  "Nike Tech Fleece Tracksuit",
  "Adidas Originals Firebird Track Top",
  "Arc'teryx Beta AR Jacket",
  "North Face 700 Down Jacket",
  "Stussy Stock Logo Hoodie",
  "CP Company Goggle Jacket",
  "Trapstar Irongate Hoodie",
  "Represent Owners Club Hoodie",
];

const CLOTHING_BRANDS = [
  { name: "Stone Island", slug: "stone-island", emoji: "🧭", desc: "Compare prices on Stone Island jackets, knitwear and accessories." },
  { name: "Palace", slug: "palace", emoji: "🔺", desc: "Palace Skateboards hoodies, tees, jackets and accessories." },
  { name: "Supreme", slug: "supreme", emoji: "📦", desc: "Supreme box logo hoodies, tees, jackets and accessories." },
  { name: "Carhartt WIP", slug: "carhartt-wip", emoji: "🔧", desc: "Carhartt WIP jackets, hoodies and workwear essentials." },
  { name: "Arc'teryx", slug: "arcteryx", emoji: "🏔️", desc: "Arc'teryx technical and luxury outerwear at the best price." },
  { name: "Nike Apparel", slug: "nike-apparel", emoji: "✔", desc: "Nike Tech Fleece, tracksuits, hoodies and more." },
];

const Clothing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Clothing Prices UK — Compare Across 30+ Retailers | GTBP";
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (metaDesc) metaDesc.content = "Compare clothing prices from Supreme, Palace, Stone Island, Carhartt WIP, Arc'teryx and more across 30+ UK retailers.";
    return () => {
      document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly";
      if (metaDesc) metaDesc.content = "Find the cheapest price for sneakers, clothing and accessories across UK retailers.";
    };
  }, []);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">

        {/* Breadcrumb */}
        <p className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          {" / "}
          <span className="text-foreground">Clothing</span>
        </p>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-3xl font-bold text-foreground">Clothing Prices UK</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Compare prices on hoodies, jackets, tracksuits and more across 30+ UK and international retailers.
            From Supreme and Palace to Stone Island and Arc'teryx — search any item and we'll find the cheapest price instantly.
          </p>
        </motion.div>

        {/* Search CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Search any clothing item</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Type a brand, item name, or colourway — our AI identifies the exact product and compares prices across 30+ retailers.
          </p>
          <Button
            className="gap-2 font-display uppercase tracking-wider"
            onClick={() => navigate("/", { state: { prefill: "" } })}
          >
            Search clothing on GTBP <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Popular searches */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-lg font-bold text-foreground">Popular clothing searches</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                onClick={() => navigate(`/product/${toProductSlug(item)}`)}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary group"
              >
                <span>{item}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </motion.section>

        {/* Clothing brands */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-lg font-bold text-foreground">Shop by brand</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CLOTHING_BRANDS.map((brand) => (
              <button
                key={brand.slug}
                onClick={() => navigate("/", { state: { prefill: brand.name } })}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-primary/5 group"
              >
                <span className="text-2xl">{brand.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary">{brand.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{brand.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Also see */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h2 className="mb-3 text-sm font-bold text-foreground">Also compare</h2>
          <div className="flex flex-wrap gap-2">
            {["Sneakers", "Accessories", "Releases"].map((label) => (
              <Link
                key={label}
                to={label === "Releases" ? "/releases" : "/"}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.section>

      </div>
    </PageTransition>
  );
};

export default Clothing;
