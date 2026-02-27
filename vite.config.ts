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

// Plugin to flatten popup.html to dist root and fix asset paths
function flattenPopupHtml(): Plugin {
  return {
    name: "flatten-popup-html",
    closeBundle() {
      const nested = resolve(__dirname, "dist/src/popup/popup.html");
      const target = resolve(__dirname, "dist/popup.html");
      if (existsSync(nested)) {
        // Read and fix relative paths (../../ -> ./ since we're flattening to root)
        let html = readFileSync(nested, "utf-8");
        html = html.replace(/(?:\.\.\/)+/g, "./");
        writeFileSync(target, html);
        // Clean up nested src directory
        rmSync(resolve(__dirname, "dist/src"), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), flattenPopupHtml()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        "service-worker": resolve(
          __dirname,
          "src/background/service-worker.ts",
        ),
        "content-script": resolve(
          __dirname,
          "src/content/content-script.ts",
        ),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith(".css")) return "[name].[ext]";
          return "assets/[name].[ext]";
        },
        // Inline dynamic imports for service worker (MV3 requires single file)
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
});
