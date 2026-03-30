import { useState } from "react";
import { Heart, Menu, X, Search } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthDialog from "@/components/AuthDialog";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/releases", label: "Releases" },
    { to: "/about", label: "About" },
    { to: "/partner", label: "Partner" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-primary px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="font-display text-3xl uppercase leading-none tracking-wide text-primary-foreground">
              GTBP
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] text-primary-foreground/60 sm:inline">
              Get The Best Price
            </span>
          </Link>
          {/* Desktop nav */}
          <div className="hidden items-center gap-4 sm:flex">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {location.pathname !== "/" && (
            <button
              onClick={() => navigate("/")}
              className="rounded-md p-2.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => navigate("/watchlist")}
            className="rounded-md p-2.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
          >
            <Heart className="h-4 w-4" />
          </button>
          <AuthDialog />
          {/* Hamburger — mobile only */}
          <button
            className="ml-1 rounded-md p-2.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-6xl border-t border-primary-foreground/20 pb-2 sm:hidden">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-1 py-3 text-sm font-medium uppercase tracking-wider transition-colors ${
                location.pathname === to
                  ? "text-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => { navigate("/watchlist"); setMenuOpen(false); }}
            className="block w-full px-1 py-3 text-left text-sm font-medium uppercase tracking-wider text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          >
            Watchlist
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
