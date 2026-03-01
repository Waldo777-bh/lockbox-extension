import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "fs";

function flattenHtmlEntries(): Plugin {
  return {
    name: "flatten-html-entries",
    closeBundle() {
      // Flatten popup.html
      const popupNested = resolve(__dirname, "dist/src/popup/popup.html");
      const popupTarget = resolve(__dirname, "dist/popup.html");
      if (existsSync(popupNested)) {
        let html = readFileSync(popupNested, "utf-8");
        html = html.replace(/(?:\.\.\/)+/g, "./");
        writeFileSync(popupTarget, html);
      }

      // Flatten sidepanel.html
      const sidepanelNested = resolve(__dirname, "dist/src/sidepanel/sidepanel.html");
      const sidepanelTarget = resolve(__dirname, "dist/sidepanel.html");
      if (existsSync(sidepanelNested)) {
        let html = readFileSync(sidepanelNested, "utf-8");
        html = html.replace(/(?:\.\.\/)+/g, "./");
        writeFileSync(sidepanelTarget, html);
      }

      // Clean up nested src directory
      const srcDir = resolve(__dirname, "dist/src");
      if (existsSync(srcDir)) {
        rmSync(srcDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), flattenHtmlEntries()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        sidepanel: resolve(__dirname, "src/sidepanel/sidepanel.html"),
        "service-worker": resolve(__dirname, "src/background/service-worker.ts"),
        "content-script": resolve(__dirname, "src/content/content-script.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith(".css")) return "[name].[ext]";
          return "assets/[name].[ext]";
        },
        inlineDynamicImports: false,
      },
    },
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  publicDir: "public",
  optimizeDeps: {
    exclude: ["argon2-browser"],
  },
});
