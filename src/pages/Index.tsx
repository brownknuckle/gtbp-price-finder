import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera } from "lucide-react";
import { motion } from "framer-motion";
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
import PageTransition from "@/components/PageTransition";

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sizeType, setSizeType] = useState<"clothing" | "shoes">("shoes");

  const handleSearch = () => {
    navigate("/results");
  };

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-1 text-5xl font-extrabold tracking-tight text-primary sm:text-6xl"
          >
            GTBP
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-10 text-lg font-medium text-muted-foreground"
          >
            Get The Best Price
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-4 flex flex-col gap-3 sm:flex-row"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {trendingSearches.map((term, i) => (
              <motion.button
                key={term}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                onClick={() => {
                  setQuery(term);
                  navigate("/results");
                }}
                className="rounded-full border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {term}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
