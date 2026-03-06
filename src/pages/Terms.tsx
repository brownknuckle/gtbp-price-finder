import PageTransition from "@/components/PageTransition";

const Terms = () => (
  <PageTransition>
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 font-display text-3xl uppercase tracking-wider text-primary">Terms of Use</h1>
      <p className="mb-8 text-xs text-muted-foreground">Last updated: March 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 text-base font-bold">1. About GTBP</h2>
          <p>
            GTBP ("Get The Best Price") is a free price comparison tool that searches publicly available
            product pages across UK and international retailers. GTBP is not a retailer — we do not sell,
            ship, or process payments for any product. All purchases are made directly with the relevant
            retailer.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">2. Price Accuracy Disclaimer</h2>
          <p className="mb-2">
            Prices displayed on GTBP are fetched in real time from publicly accessible retailer pages.
            However:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
            <li>Prices may change at any time without notice.</li>
            <li>Cached results may be up to 6 hours old.</li>
            <li>Estimated prices (marked ⚠) are AI-generated approximations and should be verified on the retailer's website before purchase.</li>
            <li>Shipping and duty estimates are indicative and may not reflect the exact charges applied at checkout.</li>
          </ul>
          <p className="mt-2 font-semibold">
            Always verify the final price on the retailer's website before completing any purchase.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">3. Affiliate Links & Commercial Relationships</h2>
          <p className="mb-2">
            Some "Buy Now" links on GTBP are affiliate links. This means GTBP may earn a small
            commission if you make a purchase after clicking — at no extra cost to you. The price
            you pay at the retailer is always the same whether or not you arrived via an affiliate link.
          </p>
          <p>
            Affiliate relationships do not influence which retailers appear, how they are ranked, or
            the prices displayed. Results are always ranked by lowest total cost to you.
            Brand names and trademarks are the property of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">4. Retailer Trust Ratings</h2>
          <p>
            Trust ratings shown on GTBP are sourced from publicly available Trustpilot scores.
            GTBP does not verify, endorse, or guarantee the reliability of any retailer. Always
            exercise your own judgement before purchasing. The "Authorised Retailer" badge indicates
            that a retailer is on a curated list of known official brand stockists — it is not a
            guarantee of any particular standard of service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">5. External Links</h2>
          <p>
            When you click "Buy Now" on GTBP, you leave our site and are subject to the terms and
            policies of the destination retailer. GTBP is not responsible for the content, availability,
            or security of third-party websites.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">6. Limitation of Liability</h2>
          <p>
            GTBP is provided "as is" without warranties of any kind. To the fullest extent permitted
            by UK law, GTBP shall not be liable for any direct, indirect, or consequential loss arising
            from use of this service or reliance on any price information displayed.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">7. Governing Law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any disputes shall be subject
            to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">8. Changes to These Terms</h2>
          <p>
            We may update these terms at any time. Continued use of GTBP after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  </PageTransition>
);

export default Terms;
