import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { toProductSlug } from "@/lib/utils";

interface BrandData {
  name: string;
  description: string;
  longDescription: string;
  popularProducts: string[];
  categories: string[];
  founded: string;
  country: string;
  emoji: string;
  guides?: { label: string; slug: string }[];
}

const BRANDS: Record<string, BrandData> = {
  nike: {
    name: "Nike",
    emoji: "✔",
    description: "Compare prices on Nike trainers, apparel and accessories across 30+ UK retailers.",
    longDescription: "Nike is the world's largest athletic footwear and apparel brand. From the Air Max to the Dunk, Nike releases some of the most sought-after sneakers in the UK market every year. GTBP tracks prices across Nike.com, JD Sports, Size?, Foot Locker, End Clothing and 25+ more UK and international retailers so you always pay the best price.",
    popularProducts: [
      "Nike Air Force 1 Triple White",
      "Nike Air Max 1 '86 OG",
      "Nike Dunk Low Retro White Black",
      "Nike Air Max 90",
      "Nike Air Max 270",
      "Nike Air Max Plus",
      "Nike Air Max 95",
      "Nike Pegasus 41",
    ],
    categories: ["Trainers", "Running", "Lifestyle", "Apparel", "Accessories"],
    founded: "1964",
    country: "USA",
    guides: [{ label: "Nike Air Force 1 Buying Guide", slug: "nike-air-force-1" }],
  },
  adidas: {
    name: "Adidas",
    emoji: "🔱",
    description: "Compare prices on Adidas Samba, Gazelle, Stan Smith and more across UK retailers.",
    longDescription: "Adidas is one of the most iconic sportswear brands in the world and a dominant force in UK streetwear. The Adidas Samba, Gazelle, and Stan Smith are perennial bestsellers, while Yeezy and collaboration drops remain some of the most anticipated releases of the year. GTBP compares Adidas prices across adidas.co.uk, ASOS, JD Sports, End Clothing, Sneakersnstuff and 25+ more retailers.",
    popularProducts: [
      "Adidas Samba OG White Black",
      "Adidas Gazelle Indoor",
      "Adidas Stan Smith",
      "Adidas Campus 00s",
      "Adidas Handball Spezial",
      "Adidas Ultraboost 5",
      "Adidas Forum Low",
      "Adidas Originals Firebird Track Top",
    ],
    categories: ["Trainers", "Running", "Originals", "Football", "Apparel"],
    founded: "1949",
    country: "Germany",
    guides: [
      { label: "Adidas Samba Buying Guide", slug: "adidas-samba" },
      { label: "Adidas Gazelle Buying Guide", slug: "adidas-gazelle" },
    ],
  },
  "new-balance": {
    name: "New Balance",
    emoji: "N",
    description: "Compare prices on New Balance 550, 1906R, 2002R and more across UK retailers.",
    longDescription: "New Balance has cemented itself as one of the most popular brands in UK streetwear. The 550, 1906R, and 2002R are among the most searched sneakers on GTBP. With a growing presence in fashion collaborations and a loyal UK following, New Balance prices vary significantly across retailers. GTBP compares prices across newbalance.co.uk, JD Sports, Size?, End Clothing, Sneakersnstuff and 25+ more.",
    popularProducts: [
      "New Balance 550 White Grey",
      "New Balance 1906R Protection Pack",
      "New Balance 2002R",
      "New Balance 574",
      "New Balance 990v6 Made in USA",
      "New Balance 530",
      "New Balance 9060",
      "New Balance 1080v13",
    ],
    categories: ["Trainers", "Running", "Lifestyle", "Made in USA", "Apparel"],
    founded: "1906",
    country: "USA",
    guides: [{ label: "New Balance 550 Buying Guide", slug: "new-balance-550" }],
  },
  jordan: {
    name: "Jordan",
    emoji: "🏀",
    description: "Compare prices on Air Jordan 1, 4, 11 and more across UK retailers.",
    longDescription: "Jordan Brand is Nike's premium sub-brand and consistently produces the most sought-after sneaker releases in the UK. The Air Jordan 1 Retro High OG alone generates hundreds of thousands of searches per release. GTBP tracks Jordan prices across Nike.com, JD Sports, Size?, Foot Locker, End Clothing, StockX, GOAT and 25+ more retailers — so you can find the best price whether it's a retail drop or resale.",
    popularProducts: [
      "Air Jordan 1 Retro High OG",
      "Air Jordan 4 Retro",
      "Air Jordan 11 Retro",
      "Air Jordan 3 Retro",
      "Air Jordan 1 Low",
      "Air Jordan 6 Retro",
      "Air Jordan 1 Mid",
      "Air Jordan 5 Retro",
    ],
    categories: ["Basketball", "Lifestyle", "Retro", "Collaboration", "Apparel"],
    founded: "1984",
    country: "USA",
    guides: [{ label: "Air Jordan 1 Buying Guide", slug: "air-jordan-1" }],
  },
  asics: {
    name: "ASICS",
    emoji: "🏃",
    description: "Compare prices on ASICS Gel-Kayano, Gel-Nimbus, Gel-1130 and more across UK retailers.",
    longDescription: "ASICS has become one of the most talked-about brands in UK streetwear and running. The Gel-Kayano 14, Gel-1130, and Gel-Nimbus are staples of the sneaker rotation. GTBP compares ASICS prices across asics.co.uk, JD Sports, Schuh, End Clothing, SNS and 25+ more retailers.",
    popularProducts: [
      "ASICS Gel-Kayano 14",
      "ASICS Gel-1130",
      "ASICS Gel-Nimbus 9",
      "ASICS Gel-Sonoma 15-50",
      "ASICS GT-2160",
      "ASICS Gel-Cumulus 26",
      "ASICS Novablast 4",
      "ASICS Gel-Venture 9",
    ],
    categories: ["Running", "Lifestyle", "Trail", "Court", "Apparel"],
    founded: "1949",
    country: "Japan",
    guides: [{ label: "ASICS Gel-Kayano 14 Buying Guide", slug: "asics-gel-kayano-14" }],
  },
};

const Brand = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const brand = BRANDS[brandSlug || ""];

  useEffect(() => {
    if (!brand) return;
    document.title = `${brand.name} Prices UK — Compare Across 30+ Retailers | GTBP`;
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (metaDesc) metaDesc.content = brand.description;
    return () => {
      document.title = "GTBP — Get The Best Price | Compare UK Prices Instantly";
      if (metaDesc) metaDesc.content = "Find the cheapest price for sneakers, clothing and accessories across UK retailers.";
    };
  }, [brand]);

  if (!brand || !brand.name) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Brand not found</h1>
          <p className="text-sm text-muted-foreground mb-6">Try searching for the brand on GTBP.</p>
          <Button onClick={() => navigate("/")}>Go to Search</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">

        {/* Breadcrumb */}
        <p className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          {" / "}
          <span className="text-foreground">{brand.name}</span>
        </p>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-3xl font-bold text-foreground">{brand.name} Prices UK</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{brand.longDescription}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Founded {brand.founded}</span>
            <span>·</span>
            <span>{brand.country}</span>
          </div>
        </motion.div>

        {/* Quick search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Search any {brand.name} product</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Type a product name, colourway, or SKU — our AI will find it and compare prices across 30+ retailers.</p>
          <Button
            className="gap-2 font-display uppercase tracking-wider"
            onClick={() => navigate("/", { state: { prefill: brand.name } })}
          >
            Search {brand.name} on GTBP <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Popular products */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-lg font-bold text-foreground">Popular {brand.name} products</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {brand.popularProducts.map((product) => (
              <button
                key={product}
                onClick={() => navigate(`/product/${toProductSlug(product)}`)}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary group"
              >
                <span>{product}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </motion.section>

        {/* Categories */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-3 text-lg font-bold text-foreground">{brand.name} categories</h2>
          <div className="flex flex-wrap gap-2">
            {brand.categories.map((cat) => (
              <span key={cat} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {cat}
              </span>
            ))}
          </div>
        </motion.section>

        {/* Buying guides */}
        {brand.guides && brand.guides.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="mb-8"
          >
            <h2 className="mb-3 text-lg font-bold text-foreground">{brand.name} buying guides</h2>
            <div className="flex flex-col gap-2">
              {brand.guides.map((g) => (
                <Link
                  key={g.slug}
                  to={`/guides/${g.slug}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary group"
                >
                  {g.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Other brands */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h2 className="mb-3 text-sm font-bold text-foreground">Compare other brands</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BRANDS)
              .filter(([slug, b]) => slug !== brandSlug && b.name)
              .map(([slug, b]) => (
                <Link
                  key={slug}
                  to={`/brand/${slug}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {b.name}
                </Link>
              ))}
          </div>
        </motion.section>

      </div>
    </PageTransition>
  );
};

export default Brand;
