import PageTransition from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();
  const updated = "2 March 2026";

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mb-8 text-xs text-muted-foreground">Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">1. Who we are</h2>
            <p>
              GTBP ("we", "us", "our") is a UK-based price comparison service operating at this website.
              We help users find the best prices for products across UK and international retailers.
              For data protection purposes we are the data controller.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">2. What data we collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Account data</strong>: When you sign in with Google or Apple, we receive your email address and display name from that provider. We do not receive your password.</li>
              <li><strong>Watchlist data</strong>: Products you choose to save, including the product name, brand, category, and best price found at the time of saving.</li>
              <li><strong>Search queries</strong>: We process your search text and any product images you upload to identify products. Search data is not stored against your account.</li>
              <li><strong>Usage data</strong>: Standard server logs including IP address and request timestamps, retained for up to 30 days for security and debugging purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">3. How we use your data</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide the price comparison service and display search results.</li>
              <li>To maintain your watchlist and send you price drop alerts by email, where you have opted in by saving a product.</li>
              <li>To improve accuracy and performance of our search and identification systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">4. Legal basis for processing (UK GDPR)</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Contract performance</strong>: Processing necessary to provide the service you have requested (search, watchlist).</li>
              <li><strong>Legitimate interests</strong>: Security logging and service improvement.</li>
              <li><strong>Consent</strong>: Price drop alert emails — you consent by saving an item. You can withdraw consent at any time by removing the item from your watchlist or using the unsubscribe link in any alert email.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">5. Third-party services</h2>
            <p className="mb-2">We use the following third-party services, each with their own privacy policies:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong> — database and authentication infrastructure (EU data centres).</li>
              <li><strong>Resend</strong> — email delivery for price alerts.</li>
              <li><strong>Firecrawl</strong> — web search and content extraction for finding prices.</li>
              <li><strong>Google / Lovable AI Gateway</strong> — AI-powered product identification and price extraction.</li>
              <li><strong>Google / Apple</strong> — OAuth authentication providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">6. Data retention</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Watchlist data is kept until you delete items or close your account.</li>
              <li>Price cache data is automatically deleted after 6 hours.</li>
              <li>Price history data is automatically deleted after 90 days.</li>
              <li>Account data is retained until you request deletion.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">7. Your rights</h2>
            <p className="mb-2">Under UK GDPR you have the right to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability.</li>
              <li>Lodge a complaint with the ICO (ico.org.uk).</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us via the details below.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">8. Cookies</h2>
            <p>
              We use only functional cookies necessary to maintain your session and authentication state.
              We do not use tracking, advertising, or analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">9. Contact</h2>
            <p>
              For any privacy-related queries or to exercise your rights, please contact us through the feedback link in the app.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Privacy;
