import { Search, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-foreground px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-serif text-2xl italic tracking-tight text-background">
            GTBP
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-background/50 sm:inline">
            Get The Best Price
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg p-2.5 text-background/60 transition-colors hover:bg-background/10 hover:text-background"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/watchlist")}
            className="rounded-lg p-2.5 text-background/60 transition-colors hover:bg-background/10 hover:text-background"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
