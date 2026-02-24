import { Search, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b bg-primary px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-primary-foreground">
            GTBP
          </span>
          <span className="hidden text-xs font-medium text-primary-foreground/70 sm:inline">
            Get The Best Price
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full p-2 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate("/watchlist")}
            className="rounded-full p-2 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
