import React from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

const root = document.getElementById("root")!;
createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
