import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t px-4 py-10 mt-auto">
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="font-display text-lg uppercase tracking-wider text-primary">GTBP</p>
          <p className="mt-1 text-xs text-muted-foreground">Get The Best Price</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground/70">
            The UK's smartest way to compare sneaker and clothing prices across 30+ retailers.
          </p>
        </div>
        <div className="flex flex-wrap gap-8 text-xs">
          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wider text-foreground">Discover</p>
            <div className="space-y-1.5">
              <div><Link to="/releases" className="text-muted-foreground transition-colors hover:text-primary">Upcoming Releases</Link></div>
              <div><Link to="/clothing" className="text-muted-foreground transition-colors hover:text-primary">Clothing</Link></div>
              <div><Link to="/brand/nike" className="text-muted-foreground transition-colors hover:text-primary">Nike Prices</Link></div>
              <div><Link to="/brand/adidas" className="text-muted-foreground transition-colors hover:text-primary">Adidas Prices</Link></div>
              <div><Link to="/brand/new-balance" className="text-muted-foreground transition-colors hover:text-primary">New Balance Prices</Link></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wider text-foreground">Guides</p>
            <div className="space-y-1.5">
              <div><Link to="/guides" className="text-muted-foreground transition-colors hover:text-primary">All Guides</Link></div>
              <div><Link to="/guides/nike-air-force-1" className="text-muted-foreground transition-colors hover:text-primary">Air Force 1 Guide</Link></div>
              <div><Link to="/guides/adidas-samba" className="text-muted-foreground transition-colors hover:text-primary">Adidas Samba Guide</Link></div>
              <div><Link to="/guides/new-balance-550" className="text-muted-foreground transition-colors hover:text-primary">New Balance 550 Guide</Link></div>
              <div><Link to="/guides/air-jordan-1" className="text-muted-foreground transition-colors hover:text-primary">Air Jordan 1 Guide</Link></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wider text-foreground">Company</p>
            <div className="space-y-1.5">
              <div><Link to="/about" className="text-muted-foreground transition-colors hover:text-primary">About</Link></div>
              <div><Link to="/partner" className="text-muted-foreground transition-colors hover:text-primary">Partner with us</Link></div>
              <div><a href="mailto:hello@getthebestprice.co.uk" className="text-muted-foreground transition-colors hover:text-primary">Contact</a></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wider text-foreground">Legal</p>
            <div className="space-y-1.5">
              <div><Link to="/privacy" className="text-muted-foreground transition-colors hover:text-primary">Privacy Policy</Link></div>
              <div><Link to="/terms" className="text-muted-foreground transition-colors hover:text-primary">Terms of Use</Link></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t pt-5 text-center text-xs text-muted-foreground/50">
        <p>GTBP is a price comparison service. We are not affiliated with any retailer. Prices are indicative — always verify on the retailer's site before purchasing.</p>
        <p className="mt-1">© {new Date().getFullYear()} GTBP. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
