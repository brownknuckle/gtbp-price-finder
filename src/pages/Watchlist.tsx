import { ArrowDown, ArrowUp, Bell, BellOff } from "lucide-react";
import { watchlistItems } from "@/lib/mockData";

const Watchlist = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Watchlist</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {watchlistItems.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-secondary">
              <img
                src={item.image}
                alt={item.name}
                className="h-3/4 w-3/4 object-contain"
              />
            </div>

            <h3 className="text-sm font-semibold text-foreground line-clamp-2">
              {item.name}
            </h3>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-lg font-extrabold text-accent">
                  ${item.currentBestPrice.toFixed(2)}
                </span>
                {item.priceChange === "down" && (
                  <ArrowDown className="h-4 w-4 text-accent" />
                )}
                {item.priceChange === "up" && (
                  <ArrowUp className="h-4 w-4 text-destructive" />
                )}
              </div>

              <button className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary">
                {item.alertEnabled ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </button>
            </div>

            {item.priceChange !== "same" && (
              <p className="mt-1 text-xs text-muted-foreground">
                was ${item.previousPrice.toFixed(2)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
