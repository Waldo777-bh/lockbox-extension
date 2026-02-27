import React from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "./Popup";
import "../styles/globals.css";

function PopupApp() {
  return (
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
