import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const NotFound = () => (
  <PageTransition>
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="font-display text-8xl font-bold text-primary/20">404</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          This page doesn't exist. Try searching for a product instead.
        </p>
        <Link to="/">
          <Button className="font-display uppercase tracking-wider">Back to Search</Button>
        </Link>
      </motion.div>
    </div>
  </PageTransition>
);

export default NotFound;
