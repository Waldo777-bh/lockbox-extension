import React from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import "@/styles/sidepanel.css";
import App from "../popup/App";

const root = document.getElementById("root")!;
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
