import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..');

const pages = [
  { file: 'screenshot-1-vault.html', out: 'screenshot-1-1280x800.png', width: 1280, height: 800 },
  { file: 'screenshot-2-key-detail.html', out: 'screenshot-2-1280x800.png', width: 1280, height: 800 },
  { file: 'screenshot-3-autofill.html', out: 'screenshot-3-1280x800.png', width: 1280, height: 800 },
  { file: 'small-tile-440x280.html', out: 'small-tile-440x280.png', width: 440, height: 280 },
  { file: 'marquee-1400x560.html', out: 'marquee-1400x560.png', width: 1400, height: 560 },
];

async function main() {
  const browser = await chromium.launch();

  for (const { file, out, width, height } of pages) {
    const page = await browser.newPage({ viewport: { width, height } });
    const filePath = path.join(__dirname, file);
    await page.goto(`file://${filePath.replace(/\\/g, '/')}`);
    // Wait for font loading
    await page.waitForTimeout(2000);
    const outPath = path.join(outDir, out);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`✓ ${out} (${width}x${height})`);
    await page.close();
  }

  await browser.close();
  console.log('\nAll images rendered to:', outDir);
}

main().catch(console.error);
