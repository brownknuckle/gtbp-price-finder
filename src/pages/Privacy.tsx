import PageTransition from "@/components/PageTransition";

const Privacy = () => (
  <PageTransition>
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 font-display text-3xl uppercase tracking-wider text-primary">Privacy Policy</h1>
      <p className="mb-8 text-xs text-muted-foreground">Last updated: March 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 text-base font-bold">1. Who We Are</h2>
          <p>
            GTBP ("Get The Best Price") is a free UK price comparison service for fashion and footwear.
            We do not sell products. We do not require you to create an account. When you click "Buy Now"
            you leave GTBP and go directly to the retailer.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">2. Data We Collect</h2>
          <p className="mb-2">GTBP does not collect personally identifiable information. Specifically:</p>
          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
            <li>No registration or login is required to search.</li>
            <li>We do not store your search queries against any personal profile.</li>
            <li>Search results and prices are cached anonymously to speed up repeat searches.</li>
            <li>If you use the Watchlist feature, you must sign in. Your saved products are stored in our secure database (Supabase) and associated with your account. You can delete your watchlist data at any time by removing items or contacting us.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">3. Third-Party Services</h2>
          <p className="mb-2">To deliver results, GTBP uses the following third-party services:</p>
          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
            <li><span className="font-semibold text-foreground">Firecrawl</span> — fetches publicly available product pages from retailer websites to extract prices.</li>
            <li><span className="font-semibold text-foreground">Google Gemini AI</span> — analyses page content to identify and validate prices.</li>
            <li><span className="font-semibold text-foreground">Supabase</span> — stores anonymous price cache data.</li>
            <li><span className="font-semibold text-foreground">Lovable</span> — our hosting platform. Their privacy policy governs platform-level data (e.g. server logs).</li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            We do not share any personal data with these services because we do not collect personal data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">4. Cookies</h2>
          <p>
            GTBP does not set first-party cookies. Our hosting platform (Lovable) may set technically
            necessary cookies for security and performance. We do not use tracking, advertising, or
            analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">5. Your Rights (UK GDPR)</h2>
          <p>
            As we do not collect personal data, there is no personal data to access, correct, or delete.
            If you believe we hold personal data about you, please contact us and we will respond within
            30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">6. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. The date at the top of this page shows the
            most recent revision.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">7. Contact</h2>
          <p>
            For privacy enquiries, email: <span className="font-semibold">privacy@getthebestprice.co.uk</span>
          </p>
        </section>
      </div>
    </div>
  </PageTransition>
);

export default Privacy;
