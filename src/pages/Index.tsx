import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trendingSearches, sizeOptions } from "@/lib/mockData";

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sizeType, setSizeType] = useState<"clothing" | "shoes">("shoes");

  const handleSearch = () => {
    navigate("/results");
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-1 text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
          GTBP
        </h1>
        <p className="mb-10 text-lg font-medium text-muted-foreground">
          Get The Best Price
        </p>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by item name, brand, or paste a URL…"
              className="h-12 pr-10 text-base"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary">
              <Camera className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <Select defaultValue="shoes" onValueChange={(v) => setSizeType(v as "clothing" | "shoes")}>
              <SelectTrigger className="h-12 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="shoes">Shoes</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="10">
              <SelectTrigger className="h-12 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(sizeType === "clothing" ? sizeOptions.clothing : sizeOptions.shoes).map(
                  (size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} className="h-12 px-6 text-base">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {trendingSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                navigate("/results");
              }}
              className="rounded-full border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
