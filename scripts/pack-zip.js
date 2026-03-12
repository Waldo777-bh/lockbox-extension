// Pack the dist/ folder into a .zip for Chrome Web Store submission
import { existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");
const outPath = resolve(__dirname, "../lockbox-extension.zip");

if (!existsSync(distDir)) {
  console.error("Error: dist/ folder not found. Run 'npm run build' first.");
  process.exit(1);
}

// Remove old zip if it exists
try {
  execSync(`del "${outPath}" 2>nul`, { stdio: "ignore" });
} catch {}

// Use PowerShell to create the zip (available on all modern Windows)
execSync(
  `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${outPath}' -Force"`,
);

const size = statSync(outPath).size;
const sizeKB = (size / 1024).toFixed(1);
console.log(`\n✓ Created ${outPath}`);
console.log(`  Size: ${sizeKB} KB`);
console.log(`\nNext steps:`);
console.log(`  1. Go to https://chrome.google.com/webstore/devconsole`);
console.log(`  2. Select "Lockbox — API Key Wallet"`);
console.log(`  3. Package tab → Upload new package → select the .zip above`);
console.log(`  4. Submit for review\n`);
