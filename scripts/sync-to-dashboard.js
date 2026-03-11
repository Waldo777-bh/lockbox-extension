#!/usr/bin/env node
// Sync built extension artifacts to the lockbox-dashboard public/downloads/ folder.
// Run after building: npm run build && node scripts/pack-crx.js && node scripts/sync-to-dashboard.js

import { copyFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extRoot = resolve(__dirname, "..");

// Dashboard path — sibling repo in same parent directory
const dashboardRoot = resolve(extRoot, "../lockbox-dashboard");
const downloadsDir = resolve(dashboardRoot, "public/downloads");

if (!existsSync(dashboardRoot)) {
  console.error("Dashboard repo not found at:", dashboardRoot);
  process.exit(1);
}

mkdirSync(downloadsDir, { recursive: true });

// Build the zip from dist/
const distDir = resolve(extRoot, "dist");
const zipOut = resolve(extRoot, "lockbox-extension.zip");

console.log("Creating zip from dist/...");
execSync(
  `powershell -Command "if (Test-Path '${zipOut}') { Remove-Item '${zipOut}' }; Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipOut}' -Force"`,
);

// Files to sync
const artifacts = [
  { src: "lockbox-extension.crx", dst: "lockbox-extension.crx" },
  { src: "lockbox-extension.zip", dst: "lockbox-extension.zip" },
  { src: "lockbox-extension.zip", dst: "lockbox-extension-latest.zip" },
];

let synced = 0;
for (const { src, dst } of artifacts) {
  const srcPath = resolve(extRoot, src);
  const dstPath = resolve(downloadsDir, dst);

  if (!existsSync(srcPath)) {
    console.warn(`  Skipping ${src} (not found)`);
    continue;
  }

  copyFileSync(srcPath, dstPath);
  console.log(`  Synced ${src} → public/downloads/${dst}`);
  synced++;
}

console.log(`\nDone — ${synced} file(s) synced to dashboard.`);
