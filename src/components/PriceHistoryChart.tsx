import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import { fetchPriceHistory, type PriceHistoryPoint } from "@/lib/api";

interface Props {
  productKey: string;
}

export default function PriceHistoryChart({ productKey }: Props) {
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPriceHistory(productKey)
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [productKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        Could not load price history.
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No price history yet — check back after the next price refresh.
      </p>
    );
  }

  const prices = data.map((d) => d.bestPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Add a bit of padding to the Y axis
  const yMin = Math.floor(minPrice * 0.97);
  const yMax = Math.ceil(maxPrice * 1.03);

  return (
    <div className="mt-2">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => `£${v}`}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value: number) => [`£${value.toFixed(2)}`, "Best price"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="monotone"
            dataKey="bestPrice"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={data.length <= 14}
            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-1 text-right text-[10px] text-muted-foreground/60">
        Best available price across all retailers
      </p>
    </div>
  );
}
