import { Search, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-foreground/10 bg-foreground px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-3xl uppercase leading-none tracking-wide text-background">
            GTBP
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] text-background/40 sm:inline">
            Get The Best Price
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/")}
            className="rounded-md p-2.5 text-background/50 transition-colors hover:bg-background/10 hover:text-background"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/watchlist")}
            className="rounded-md p-2.5 text-background/50 transition-colors hover:bg-background/10 hover:text-background"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
