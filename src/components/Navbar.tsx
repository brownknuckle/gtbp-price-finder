import { Heart, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-primary px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-3xl uppercase leading-none tracking-wide text-primary-foreground">
            GTBP
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] text-primary-foreground/60 sm:inline">
            Get The Best Price
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {isAdmin(user?.email) && (
            <button
              onClick={() => navigate("/admin")}
              className="rounded-md p-2.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
              title="Ad Manager"
            >
              <Megaphone className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => navigate("/watchlist")}
            className="rounded-md p-2.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
          >
            <Heart className="h-4 w-4" />
          </button>
          <AuthDialog />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
