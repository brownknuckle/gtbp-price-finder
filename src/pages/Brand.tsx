import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
  tags: string[];
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
    tags: ["Sneakers", "Sportswear"],
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
    tags: ["Sneakers", "Sportswear"],
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
    tags: ["Sneakers", "Running"],
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
    tags: ["Sneakers", "Sportswear"],
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
    tags: ["Sneakers", "Running"],
    founded: "1949",
    country: "Japan",
    guides: [{ label: "ASICS Gel-Kayano 14 Buying Guide", slug: "asics-gel-kayano-14" }],
  },
  puma: {
    name: "Puma",
    emoji: "🐆",
    description: "Compare prices on Puma Suede, Palermo, Speedcat and more across UK retailers.",
    longDescription: "Puma is having a major moment in the UK market. The Palermo and Speedcat have become essential additions to any sneaker rotation, while the classic Suede remains a wardrobe staple. GTBP compares Puma prices across puma.com, JD Sports, ASOS, Schuh, Size? and 20+ more UK retailers.",
    popularProducts: [
      "Puma Palermo",
      "Puma Speedcat OG",
      "Puma Suede Classic XXI",
      "Puma Clyde",
      "Puma RS-X",
      "Puma Mayze Stack",
      "Puma T7 Track Jacket",
      "Puma Nitefox",
    ],
    categories: ["Trainers", "Lifestyle", "Running", "Football", "Apparel"],
    tags: ["Sneakers", "Sportswear"],
    founded: "1948",
    country: "Germany",
  },
  reebok: {
    name: "Reebok",
    emoji: "🔵",
    description: "Compare prices on Reebok Classic, Club C, Question and more across UK retailers.",
    longDescription: "Reebok is one of the most iconic heritage brands in UK sportswear. The Classic Leather and Club C are everyday essentials, while the Question Mid and Answer bring basketball heritage to the streets. GTBP compares Reebok prices across reebok.co.uk, JD Sports, ASOS, End Clothing and 20+ more UK retailers.",
    popularProducts: [
      "Reebok Classic Leather",
      "Reebok Club C 85",
      "Reebok Question Mid",
      "Reebok Freestyle Hi",
      "Reebok Pump Fury",
      "Reebok Nano X4",
      "Reebok Workout Plus",
      "Reebok Instapump Fury",
    ],
    categories: ["Trainers", "Basketball", "Lifestyle", "Fitness", "Apparel"],
    tags: ["Sneakers", "Sportswear"],
    founded: "1958",
    country: "UK",
  },
  vans: {
    name: "Vans",
    emoji: "🛹",
    description: "Compare prices on Vans Old Skool, Sk8-Hi, Slip-On and more across UK retailers.",
    longDescription: "Vans is the original skate brand and a UK streetwear mainstay. The Old Skool, Sk8-Hi, and Slip-On are some of the best-selling trainers in the UK year after year. GTBP compares Vans prices across vans.co.uk, ASOS, JD Sports, Foot Locker, Schuh and 20+ more retailers.",
    popularProducts: [
      "Vans Old Skool Black White",
      "Vans Sk8-Hi",
      "Vans Slip-On",
      "Vans Authentic",
      "Vans Era",
      "Vans Knu Stack",
      "Vans Ward",
      "Vans ComfyCush Old Skool",
    ],
    categories: ["Skate", "Lifestyle", "Casual", "Apparel", "Accessories"],
    tags: ["Sneakers", "Streetwear"],
    founded: "1966",
    country: "USA",
  },
  converse: {
    name: "Converse",
    emoji: "⭐",
    description: "Compare prices on Converse Chuck Taylor, Run Star and more across UK retailers.",
    longDescription: "Converse is one of the most recognisable trainer brands in the world, with the Chuck Taylor All Star worn by everyone from artists to athletes. GTBP compares Converse prices across converse.com, JD Sports, ASOS, Schuh, Office and 20+ more UK retailers so you get the best price on every colourway.",
    popularProducts: [
      "Converse Chuck Taylor All Star Black",
      "Converse Chuck 70 High Top",
      "Converse Run Star Hike",
      "Converse Chuck Taylor All Star White",
      "Converse One Star",
      "Converse Chuck 70 Low Top",
      "Converse Pro Leather",
      "Converse Run Star Legacy",
    ],
    categories: ["Lifestyle", "Basketball Heritage", "Casual", "Apparel"],
    tags: ["Sneakers", "Sportswear"],
    founded: "1908",
    country: "USA",
  },
  salomon: {
    name: "Salomon",
    emoji: "🏔️",
    description: "Compare prices on Salomon XT-6, Speedcross, ACS Pro and more across UK retailers.",
    longDescription: "Salomon has crossed over from technical trail running into the heart of UK streetwear. The XT-6, ACS Pro, and Pulsar Advanced have become some of the most-hyped silhouettes of the past two years. GTBP compares Salomon prices across salomon.com, End Clothing, SNS, Size? and 20+ more UK retailers.",
    popularProducts: [
      "Salomon XT-6",
      "Salomon Speedcross 6",
      "Salomon ACS Pro",
      "Salomon Pulsar Advanced",
      "Salomon XA Pro 3D",
      "Salomon XT-Wings 2",
      "Salomon Ultra Glide 2",
      "Salomon Genesis",
    ],
    categories: ["Trail", "Lifestyle", "Running", "Outdoor"],
    tags: ["Sneakers", "Running", "Outdoor"],
    founded: "1947",
    country: "France",
  },
  on: {
    name: "On Running",
    emoji: "☁️",
    description: "Compare prices on On Cloudmonster, Cloudrunner, Cloud 5 and more across UK retailers.",
    longDescription: "On Running has become one of the fastest-growing footwear brands in the UK. The CloudTec sole technology has won over serious runners and style-conscious buyers alike. The Cloudmonster, Cloud 5, and Cloudrunner are among the most-searched On models on GTBP. Prices are compared across on-running.com, JD Sports, Runners Need, End Clothing and 20+ more retailers.",
    popularProducts: [
      "On Cloudmonster",
      "On Cloud 5",
      "On Cloudrunner 2",
      "On Cloudflow 4",
      "On Cloudvista",
      "On Cloudboom Echo 3",
      "On Cloudultra 2",
      "On The Roger Advantage",
    ],
    categories: ["Running", "Lifestyle", "Trail", "Performance"],
    tags: ["Running", "Sneakers"],
    founded: "2010",
    country: "Switzerland",
  },
  hoka: {
    name: "Hoka",
    emoji: "🌈",
    description: "Compare prices on Hoka Clifton, Bondi, Speedgoat and more across UK retailers.",
    longDescription: "Hoka has gone from niche ultra-running brand to mainstream UK staple. The maximalist cushioning of the Bondi and Clifton appeals to runners and lifestyle buyers alike, while the Speedgoat dominates trail running. GTBP compares Hoka prices across hoka.com, JD Sports, Runners Need, Wiggle and 20+ more UK retailers.",
    popularProducts: [
      "Hoka Bondi 8",
      "Hoka Clifton 9",
      "Hoka Speedgoat 5",
      "Hoka Challenger ATR 7",
      "Hoka Mach 5",
      "Hoka Kawana 2",
      "Hoka Anacapa Low GTX",
      "Hoka Transport",
    ],
    categories: ["Running", "Trail", "Lifestyle", "Outdoor"],
    tags: ["Running", "Outdoor"],
    founded: "2009",
    country: "France",
  },
  saucony: {
    name: "Saucony",
    emoji: "🏅",
    description: "Compare prices on Saucony Jazz, Shadow 6000, Kinvara and more across UK retailers.",
    longDescription: "Saucony is a beloved heritage running brand with a strong presence in UK streetwear. The Jazz Original, Shadow 6000, and Grid Azura have become cult favourites. GTBP compares Saucony prices across saucony.co.uk, JD Sports, Size?, End Clothing, SNS and 20+ more UK retailers.",
    popularProducts: [
      "Saucony Jazz Original",
      "Saucony Shadow 6000",
      "Saucony Grid Azura",
      "Saucony Kinvara 14",
      "Saucony Endorphin Speed 4",
      "Saucony Ride 17",
      "Saucony Tempus",
      "Saucony Triumph 22",
    ],
    categories: ["Running", "Lifestyle", "Heritage", "Performance"],
    tags: ["Sneakers", "Running"],
    founded: "1898",
    country: "USA",
  },
  "new-era": {
    name: "New Era",
    emoji: "🧢",
    description: "Compare prices on New Era 59FIFTY, 9FORTY and fitted caps across UK retailers.",
    longDescription: "New Era is the world's leading headwear brand and an essential part of UK streetwear culture. The 59FIFTY fitted and 9FORTY adjustable caps are must-haves, with team and collaboration colourways driving constant demand. GTBP compares New Era prices across neweracap.eu, JD Sports, ASOS, Foot Locker and 20+ more UK retailers.",
    popularProducts: [
      "New Era 59FIFTY New York Yankees Navy",
      "New Era 9FORTY New York Yankees",
      "New Era 59FIFTY Los Angeles Dodgers",
      "New Era 9FIFTY Chicago Bulls",
      "New Era 59FIFTY League Essential",
      "New Era 9FORTY A-Frame Trucker",
      "New Era 59FIFTY Boston Red Sox",
      "New Era Diamond Era 9FIFTY",
    ],
    categories: ["Caps", "Accessories", "Streetwear", "Collaboration"],
    tags: ["Accessories", "Streetwear"],
    founded: "1920",
    country: "USA",
  },
  carhartt: {
    name: "Carhartt WIP",
    emoji: "🔧",
    description: "Compare prices on Carhartt WIP jackets, hoodies and accessories across UK retailers.",
    longDescription: "Carhartt Work In Progress (WIP) has been a cornerstone of UK workwear-influenced streetwear for over 30 years. From the iconic Detroit Jacket to the Chase hoodie, Carhartt WIP is a go-to for durable, functional style. GTBP compares prices across carhartt-wip.com, END Clothing, ASOS, Size? and 20+ more UK retailers.",
    popularProducts: [
      "Carhartt WIP Active Jacket",
      "Carhartt WIP Chase Hoodie",
      "Carhartt WIP Simple Pant",
      "Carhartt WIP OG Detroit Jacket",
      "Carhartt WIP Bib Overall",
      "Carhartt WIP Script Cap",
      "Carhartt WIP Nimbus Pullover",
      "Carhartt WIP Medley Half-Zip",
    ],
    categories: ["Jackets", "Hoodies", "Trousers", "Accessories", "Streetwear"],
    tags: ["Streetwear", "Clothing"],
    founded: "1989",
    country: "USA",
  },
  "stone-island": {
    name: "Stone Island",
    emoji: "🧭",
    description: "Compare prices on Stone Island jackets, knitwear and accessories across UK retailers.",
    longDescription: "Stone Island is one of the most iconic Italian menswear brands with a massive UK following in streetwear and football culture. Known for their unique garment dyeing and fabric research, the compass badge is instantly recognisable. GTBP compares Stone Island prices across stoneisland.com, END Clothing, Selfridges, ASOS and 20+ more UK retailers.",
    popularProducts: [
      "Stone Island Ghost Piece Overshirt",
      "Stone Island Nylon Metal Jacket",
      "Stone Island Garment Dyed Hoodie",
      "Stone Island Cargo Pants",
      "Stone Island Ribbed Knit",
      "Stone Island Reflective Badge Sweatshirt",
      "Stone Island Shadow Project",
      "Stone Island Logo Cap",
    ],
    categories: ["Jackets", "Knitwear", "Trousers", "Accessories", "Streetwear"],
    tags: ["Streetwear", "Clothing"],
    founded: "1982",
    country: "Italy",
  },
};

const ALL_TAGS = ["All", "Sneakers", "Running", "Streetwear", "Clothing", "Accessories", "Outdoor", "Sportswear"];

const Brand = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const brand = BRANDS[brandSlug || ""];
  const [activeTag, setActiveTag] = useState("All");

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

        {/* Browse all brands */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h2 className="mb-3 text-sm font-bold text-foreground">Browse all brands</h2>

          {/* Tag filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTag === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Brand grid */}
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(BRANDS)
              .filter(([slug, b]) => {
                if (slug === brandSlug) return false;
                if (activeTag === "All") return true;
                return b.tags.includes(activeTag);
              })
              .map(([slug, b]) => (
                <Link
                  key={slug}
                  to={`/brand/${slug}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary group"
                >
                  <span>{b.emoji} {b.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
          </div>
        </motion.section>

      </div>
    </PageTransition>
  );
};

export default Brand;
