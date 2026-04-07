import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: "https://57e915d058b552bfce31e12072c53d5e@o4510997651456000.ingest.de.sentry.io/4510997672099920",
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById("root")!).render(<App />);
