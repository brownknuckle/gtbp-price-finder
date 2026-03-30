import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import CookieBanner from "@/components/CookieBanner";
import Index from "./pages/Index";
import Results from "./pages/Results";
import Watchlist from "./pages/Watchlist";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Partner from "./pages/Partner";
import Releases from "./pages/Releases";
import Brand from "./pages/Brand";
import NikeAirForce1Guide from "./pages/guides/NikeAirForce1Guide";
import AdidasSambaGuide from "./pages/guides/AdidasSambaGuide";
import NewBalance550Guide from "./pages/guides/NewBalance550Guide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/product/:slug" element={<Results />} />
        <Route path="/results" element={<Results />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route path="/partner" element={<Partner />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/brand/:brandSlug" element={<Brand />} />
        <Route path="/guides/nike-air-force-1" element={<NikeAirForce1Guide />} />
        <Route path="/guides/adidas-samba" element={<AdidasSambaGuide />} />
        <Route path="/guides/new-balance-550" element={<NewBalance550Guide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <AnimatedRoutes />
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
