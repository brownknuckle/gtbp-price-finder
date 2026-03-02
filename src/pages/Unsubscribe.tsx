import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const item = searchParams.get("item");
    const token = searchParams.get("token");

    if (!item || !token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link. Please remove the item from your watchlist directly.");
      return;
    }

    const params = new URLSearchParams({ item, token });
    fetch(`${SUPABASE_URL}/functions/v1/unsubscribe?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("You've been removed from this price alert. You won't receive further notifications for this item.");
        } else {
          setStatus("error");
          setMessage(data.error || "This unsubscribe link is invalid or has already been used.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please remove the item from your watchlist directly.");
      });
  }, []);

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your request…</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-600" />
              <h1 className="mb-2 text-lg font-bold text-foreground">Unsubscribed</h1>
              <p className="mb-6 text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" onClick={() => navigate("/")}>Back to Search</Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
              <h1 className="mb-2 text-lg font-bold text-foreground">Unsubscribe Failed</h1>
              <p className="mb-6 text-sm text-muted-foreground">{message}</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => navigate("/watchlist")}>Go to Watchlist</Button>
                <Button variant="outline" onClick={() => navigate("/")}>Back to Search</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Unsubscribe;
