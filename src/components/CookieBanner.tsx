import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_KEY = "gtbp_cookie_consent";

export type ConsentState = "accepted" | "declined" | null;

export function getCookieConsent(): ConsentState {
  try {
    return (localStorage.getItem(COOKIE_KEY) as ConsentState) ?? null;
  } catch {
    return null;
  }
}

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    try {
      if (typeof (window as any).gtag === "function") {
        (window as any).gtag("consent", "update", { analytics_storage: "granted" });
      }
    } catch {}
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-xl"
        >
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  We use cookies
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  We use cookies to improve your experience, analyse site usage, and support analytics via Google Analytics.{" "}
                  <button
                    onClick={() => setShowDetails((v) => !v)}
                    className="underline hover:text-foreground transition-colors"
                  >
                    {showDetails ? "Hide details" : "Learn more"}
                  </button>
                </p>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                        <div>
                          <span className="font-semibold text-foreground">Essential cookies</span>
                          <p>Required for the site to function. Cannot be disabled.</p>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Analytics cookies</span>
                          <p>Google Analytics — helps us understand how people use GTBP so we can improve it. No personal data is sold.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                  Read our{" "}
                  <Link to="/privacy" className="underline hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>{" "}
                  for full details.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decline}
                  className="h-9 px-4 text-xs"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={accept}
                  className="h-9 px-4 text-xs"
                >
                  Accept All
                </Button>
                <button
                  onClick={decline}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
