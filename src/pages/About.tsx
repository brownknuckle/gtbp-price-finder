import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe, TrendingUp, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const stats = [
  { value: "30+", label: "UK & EU retailers" },
  { value: "£0", label: "Always free to use" },
  { value: "AI", label: "Powered price search" },
  { value: "Real‑time", label: "Live price data" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Transparency first",
    desc: "We show you every price we find — ranked by total cost including shipping and duties. No hidden fees, no sponsored placements pushing you towards a pricier option.",
  },
  {
    icon: Zap,
    title: "Built for speed",
    desc: "We use real-time AI-powered search to find current prices across 30+ retailers in under 30 seconds. No outdated data, no stale price lists.",
  },
  {
    icon: Globe,
    title: "UK-focused, globally aware",
    desc: "We prioritise UK retailers and show total landed cost when comparing EU and global sellers — so you always know the real price before you buy.",
  },
  {
    icon: TrendingUp,
    title: "Helping you buy smarter",
    desc: "With 30-day price history, trust badges, and in-stock indicators, GTBP gives you the full picture — not just the number.",
  },
];

const About = () => {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            About GTBP
          </p>
          <h1 className="mb-4 font-display text-5xl uppercase tracking-wider text-primary sm:text-6xl">
            GTBP
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            Get The Best Price is the UK's smartest way to compare sneaker and clothing prices.
            We search 30+ retailers in real time so you never overpay — and so brands can be
            confident their products reach the right buyers at the right moment.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-5 text-center"
            >
              <p className="font-display text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="mb-14"
        >
          <h2 className="mb-4 text-xl font-bold text-foreground">Our mission</h2>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The UK streetwear and sneaker market is fragmented. The same pair of trainers can
              vary by £40 or more across retailers — and most shoppers have no easy way to know
              that. GTBP fixes that.
            </p>
            <p>
              We built a platform that uses AI to identify any product from a name, SKU, URL, or
              photo — then instantly searches every major UK retailer and presents results ranked
              by total cost. Shipping included. Duties calculated. No surprises.
            </p>
            <p>
              Our goal is to be the most trusted price comparison platform in UK fashion and
              footwear — a resource that shoppers rely on every time they make a purchase decision,
              and a platform that retailers and brands are proud to be featured on.
            </p>
          </div>
        </motion.section>

        {/* Values */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mb-14"
        >
          <h2 className="mb-6 text-xl font-bold text-foreground">What we stand for</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-foreground">{v.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="mb-14"
        >
          <h2 className="mb-6 text-xl font-bold text-foreground">How GTBP works</h2>
          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "You search",
                desc: "Type a product name, paste a URL, enter a SKU, or upload a photo. Our AI identifies the exact product — including colourway and model details.",
              },
              {
                step: "02",
                title: "We search every retailer",
                desc: "We simultaneously search 30+ UK and international retailers for the product. Every result includes item price, shipping, and any applicable import duties.",
              },
              {
                step: "03",
                title: "You get the full picture",
                desc: "Results are ranked by total cost. You see trust badges (Authorised Retailer, Free Returns), stock status, Trustpilot ratings, and 30-day price history.",
              },
              {
                step: "04",
                title: "You buy direct",
                desc: "Click Buy Now and you go straight to the retailer's product page. GTBP never handles your payment or personal data.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="font-display mt-0.5 shrink-0 text-2xl font-bold text-primary/20">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Retailers */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="mb-14 rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Retailers we cover</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            We compare prices across the UK's leading footwear and fashion retailers, including:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Nike", "Adidas", "JD Sports", "Size?", "Foot Locker", "Schuh",
              "ASOS", "END Clothing", "Offspring", "Selfridges", "Harvey Nichols",
              "New Balance", "Flannels", "Zalando", "StockX", "GOAT", "Farfetch",
              "Sports Direct", "Footasylum", "Tessuti", "Office", "Schuh",
              "Foot Patrol", "Sneakersnstuff", "Solebox", "Klekt", "Laced", "and more…",
            ].map((r) => (
              <span
                key={r}
                className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {r}
              </span>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          className="flex flex-col items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
        >
          <Users className="h-8 w-8 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Want to work with GTBP?</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            We're building the UK's go-to price comparison platform for fashion and footwear.
            If you're a retailer, brand, or affiliate network and want to explore a partnership,
            we'd love to hear from you.
          </p>
          <Link to="/partner">
            <Button className="font-display uppercase tracking-wider">
              Partner with us
            </Button>
          </Link>
        </motion.div>

      </div>
    </PageTransition>
  );
};

export default About;
