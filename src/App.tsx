import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
// Core routes — loaded eagerly (user hits these most)
import Index from "./pages/Index";
import Results from "./pages/Results";
// Secondary routes — lazy loaded
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const Partner = lazy(() => import("./pages/Partner"));
const Releases = lazy(() => import("./pages/Releases"));
const Brand = lazy(() => import("./pages/Brand"));
const Clothing = lazy(() => import("./pages/Clothing"));
const Guides = lazy(() => import("./pages/Guides"));
const NikeAirForce1Guide = lazy(() => import("./pages/guides/NikeAirForce1Guide"));
const AdidasSambaGuide = lazy(() => import("./pages/guides/AdidasSambaGuide"));
const NewBalance550Guide = lazy(() => import("./pages/guides/NewBalance550Guide"));
const AirJordan1Guide = lazy(() => import("./pages/guides/AirJordan1Guide"));
const AdidasGazelleGuide = lazy(() => import("./pages/guides/AdidasGazelleGuide"));
const AsicsGelKayano14Guide = lazy(() => import("./pages/guides/AsicsGelKayano14Guide"));
const NikeP6000Guide = lazy(() => import("./pages/guides/NikeP6000Guide"));
const AdidasHandballSpezialGuide = lazy(() => import("./pages/guides/AdidasHandballSpezialGuide"));
const BestPriceIndex = lazy(() => import("./pages/BestPriceIndex"));
const BestPrice = lazy(() => import("./pages/BestPrice"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={null}>
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
        <Route path="/clothing" element={<Clothing />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/nike-air-force-1" element={<NikeAirForce1Guide />} />
        <Route path="/guides/adidas-samba" element={<AdidasSambaGuide />} />
        <Route path="/guides/new-balance-550" element={<NewBalance550Guide />} />
        <Route path="/guides/air-jordan-1" element={<AirJordan1Guide />} />
        <Route path="/guides/adidas-gazelle" element={<AdidasGazelleGuide />} />
        <Route path="/guides/asics-gel-kayano-14" element={<AsicsGelKayano14Guide />} />
        <Route path="/guides/nike-p-6000" element={<NikeP6000Guide />} />
        <Route path="/guides/adidas-handball-spezial" element={<AdidasHandballSpezialGuide />} />
        <Route path="/best-price" element={<BestPriceIndex />} />
        <Route path="/best-price/:slug" element={<BestPrice />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
    </Suspense>
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
          <Footer />
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
