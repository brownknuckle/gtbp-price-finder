import PageTransition from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();
  const updated = "2 March 2026";

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Terms of Service</h1>
        <p className="mb-8 text-xs text-muted-foreground">Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">1. Acceptance of terms</h2>
            <p>
              By using GTBP you agree to these Terms of Service. If you do not agree, please do not use the service.
              We may update these terms at any time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">2. What GTBP is</h2>
            <p>
              GTBP is a price comparison tool. We search publicly available information across retail websites
              to help you find competitive prices. We do not sell products, process payments, or act as a retailer.
              When you click "Buy Now", you leave GTBP and transact directly with the retailer under their
              own terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">3. Price accuracy</h2>
            <p>
              Prices shown on GTBP are indicative only and sourced from third-party retailer websites.
              They may be out of date, subject to change, or differ from the price shown at checkout due to
              promotions, stock availability, or currency conversion. Shipping and duty estimates are
              approximate and may not reflect actual charges. Always verify the final price on the retailer's
              website before purchasing.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">4. Price alerts</h2>
            <p>
              Price drop alerts are sent on a best-effort basis. We do not guarantee delivery,
              timing, or accuracy of alerts. Alerts are triggered when our automated checks detect a
              price change; occasional failures may mean alerts are delayed or not sent. You can
              unsubscribe from alerts at any time by removing items from your watchlist or using the
              unsubscribe link in any alert email.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">5. Acceptable use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Scrape, crawl, or systematically extract data from GTBP.</li>
              <li>Use automated tools to make excessive requests to our service.</li>
              <li>Attempt to circumvent any rate limiting or security measures.</li>
              <li>Use the service for any unlawful purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">6. Intellectual property</h2>
            <p>
              Product names, brand names, and trademarks referenced on GTBP belong to their respective owners.
              GTBP makes no claim of ownership over any third-party trademarks or product images.
              Product information is used for comparative purposes under fair use principles.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">7. Disclaimer of warranties</h2>
            <p>
              GTBP is provided "as is" without warranty of any kind. We do not guarantee that the service
              will be uninterrupted, error-free, or that prices shown will be available at the linked retailer.
              To the maximum extent permitted by law, we disclaim all warranties, express or implied.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, GTBP shall not be liable for any indirect, incidental,
              or consequential damages arising from your use of the service, including any losses arising from
              purchasing decisions made based on prices shown. Our total liability to you shall not exceed £100.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">9. Governing law</h2>
            <p>
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to
              the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">10. Contact</h2>
            <p>
              For questions about these terms, please contact us through the feedback link in the app.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Terms;
