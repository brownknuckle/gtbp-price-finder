import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Users, Globe, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const benefits = [
  {
    icon: Users,
    title: "High-intent audience",
    desc: "Every visitor has already searched for a specific product. They're not browsing — they're ready to buy. GTBP drives purchase-ready traffic directly to your product pages.",
  },
  {
    icon: TrendingUp,
    title: "Incremental sales",
    desc: "We reach shoppers who are actively comparing options. A click from GTBP is a customer who has chosen to buy — they just need to know where. That's incremental revenue, not cannibalisation.",
  },
  {
    icon: ShieldCheck,
    title: "Brand-safe placement",
    desc: "Results display your brand exactly as your product page presents it — with your imagery, your pricing, and your trust credentials. We never misrepresent retailers.",
  },
  {
    icon: Globe,
    title: "UK-focused reach",
    desc: "Our audience is UK-based shoppers looking for the best price on footwear and fashion. If you're a UK retailer, GTBP puts you directly in front of your target customer at the moment of decision.",
  },
];

const faqs = [
  {
    q: "How does GTBP make money?",
    a: "GTBP is currently in its early growth phase. Our revenue model is affiliate commissions — earned when users click through to a retailer and make a purchase. We are actively building affiliate relationships with UK retailers. There is no cost to users and no cost to retailers for being listed.",
  },
  {
    q: "Do you list all retailers automatically?",
    a: "Our AI identifies the most relevant retailers for each product search. We list the retailers most likely to carry the product — whether or not we have an affiliate relationship with them. Affiliate links enhance the experience but do not determine who appears.",
  },
  {
    q: "How are prices obtained?",
    a: "We use real-time AI-powered search to find current product page prices at the moment of search. We do not cache prices for extended periods — results are always within a few hours of the actual listing.",
  },
  {
    q: "Can I ensure my brand appears with correct information?",
    a: "Yes. If you're an authorised retailer and find any inaccuracy in how your products are presented, contact us directly and we'll resolve it promptly.",
  },
  {
    q: "Do you work with affiliate networks?",
    a: "We are applying to work with major affiliate networks including AWIN, Rakuten, and Impact. If you manage a programme on any of these networks and would like to invite us, email partnerships@getthebestprice.co.uk.",
  },
];

const Partner = () => {
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
            Partnerships
          </p>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Partner with GTBP
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            We're building the UK's leading price comparison platform for fashion and footwear.
            We want to work with brands and retailers who care about putting the right product
            in front of the right buyer.
          </p>
        </motion.div>

        {/* Who we are */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mb-14 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-3 text-base font-bold text-foreground">What GTBP is</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            GTBP (Get The Best Price) is a UK price comparison platform for sneakers, clothing,
            and accessories. Users search for a specific product — by name, SKU, URL, or even a
            photo — and we instantly compare prices across 30+ UK and international retailers,
            ranked by total cost including shipping.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We are not a marketplace. We do not sell products. We drive qualified traffic directly
            to retailer product pages at the moment a purchase decision is being made.
          </p>
        </motion.section>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="mb-14"
        >
          <h2 className="mb-6 text-xl font-bold text-foreground">Why partner with us</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-foreground">{b.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Audience */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="mb-14 rounded-xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-base font-bold text-foreground">Our audience</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Location", value: "UK-based" },
              { label: "Category", value: "Footwear & fashion" },
              { label: "Intent", value: "Purchase-ready" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            GTBP users are actively searching for specific products with the intent to purchase.
            The average session begins with a product search and ends with a click to a retailer.
            This is not passive discovery — it is active buying behaviour.
          </p>
        </motion.section>

        {/* How to work with us */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mb-14"
        >
          <h2 className="mb-6 text-xl font-bold text-foreground">How to work with us</h2>
          <div className="space-y-4">
            {[
              {
                title: "Affiliate programmes (AWIN, Rakuten, Impact)",
                desc: "We are actively applying to affiliate programmes across major networks. If you manage a programme on AWIN, Rakuten, or Impact and would like to work with us, get in touch.",
              },
              {
                title: "Direct partnerships",
                desc: "For brands and retailers who want a closer relationship — including featured placement, dedicated campaigns, or co-branded initiatives — contact us directly.",
              },
              {
                title: "Data & API access",
                desc: "We're open to discussions around pricing data, product data feeds, and API integrations that benefit both parties.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="mb-14"
        >
          <h2 className="mb-6 text-xl font-bold text-foreground">Common questions</h2>
          <div className="space-y-5">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="mb-1 text-sm font-bold text-foreground">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="flex flex-col items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
        >
          <Mail className="h-8 w-8 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Get in touch</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ready to explore a partnership? Email us and we'll get back to you within 2 business days.
          </p>
          <a href="mailto:partnerships@getthebestprice.co.uk">
            <Button className="font-display uppercase tracking-wider">
              partnerships@getthebestprice.co.uk
            </Button>
          </a>
        </motion.div>

      </div>
    </PageTransition>
  );
};

export default Partner;
