import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { searchResults, priceHistoryData } from "@/lib/mockData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Detail = () => {
  const best = searchResults[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left — Image */}
        <div>
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-secondary">
            <img
              src="/placeholder.svg"
              alt="Nike Cortez"
              className="h-3/4 w-3/4 object-contain"
            />
          </div>
        </div>

        {/* Right — Breakdown */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nike Cortez</h1>
          <p className="text-muted-foreground">White/Black — Men's Size 10</p>

          <div className="mt-6 rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Cost Breakdown
            </h2>
            <div className="space-y-2 text-sm">
              <Row label="Item Price" value={`$${best.itemPrice.toFixed(2)}`} />
              <Row label="Shipping" value={`$${best.shipping.toFixed(2)}`} />
              <Row label="Import Duties" value={`$${best.duties.toFixed(2)}`} />
              <Row label="Currency Conversion" value="Included" muted />
              <Row label="Platform Fee" value="$0.00" muted />
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">
                TOTAL YOU PAY
              </span>
              <span className="text-3xl font-extrabold text-accent">
                ${best.totalYouPay.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Retailer info */}
          <div className="mt-4 rounded-xl border bg-card p-4 text-sm">
            <p className="font-semibold text-foreground">
              {best.flag} {best.retailer}
            </p>
            <p className="text-muted-foreground">{best.country}</p>
            <p className="mt-1 text-muted-foreground">
              Returns: 30-day free returns
            </p>
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{best.trustRating} / 5 Trust Score</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-4 flex gap-3">
            <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              Buy Now
            </Button>
            <Button variant="outline" className="flex-1">
              Save to Watchlist
            </Button>
          </div>
        </div>
      </div>

      {/* Price History */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Price History — Last 90 Days
        </h2>
        <div className="h-64 w-full rounded-xl border bg-card p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistoryData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" stroke="currentColor" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                domain={["dataMin - 5", "dataMax + 5"]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(150 62% 26%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={muted ? "text-muted-foreground" : "font-medium text-foreground"}>
      {value}
    </span>
  </div>
);

export default Detail;
