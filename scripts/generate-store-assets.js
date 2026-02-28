// Generates Chrome Web Store promotional images as PNGs
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../store-assets");
mkdirSync(outDir, { recursive: true });

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crcData = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    crc ^= 0xffffffff;
    buf.writeInt32BE(crc, buf.length - 4);
    return buf;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (width * 4 + 1) + 1 + x * 4;
      raw[di] = pixels[si]; raw[di+1] = pixels[si+1]; raw[di+2] = pixels[si+2]; raw[di+3] = pixels[si+3];
    }
  }
  const compressed = deflateSync(raw, { level: 6 });
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

function setPixel(pixels, w, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= w || y < 0) return;
  const i = (y * w + Math.floor(x)) * 4;
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
}

function fillRect(pixels, w, h, x0, y0, rw, rh, r, g, b, a = 255) {
  for (let dy = 0; dy < rh; dy++)
    for (let dx = 0; dx < rw; dx++)
      setPixel(pixels, w, x0+dx, y0+dy, r, g, b, a);
}

function fillRoundedRect(pixels, w, h, x0, y0, rw, rh, rad, r, g, b, a = 255) {
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      let inside = true;
      if (dx < rad && dy < rad) inside = Math.sqrt((dx-rad)**2 + (dy-rad)**2) <= rad;
      else if (dx >= rw-rad && dy < rad) inside = Math.sqrt((dx-(rw-rad-1))**2 + (dy-rad)**2) <= rad;
      else if (dx < rad && dy >= rh-rad) inside = Math.sqrt((dx-rad)**2 + (dy-(rh-rad-1))**2) <= rad;
      else if (dx >= rw-rad && dy >= rh-rad) inside = Math.sqrt((dx-(rw-rad-1))**2 + (dy-(rh-rad-1))**2) <= rad;
      if (inside) setPixel(pixels, w, x0+dx, y0+dy, r, g, b, a);
    }
  }
}

function fillCircle(pixels, w, cx, cy, radius, r, g, b, a = 255) {
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++)
      if (dx*dx + dy*dy <= radius*radius)
        setPixel(pixels, w, cx+dx, cy+dy, r, g, b, a);
}

// Simple bitmap font for uppercase text
const FONT = {
  'L': [[1,0],[1,0],[1,0],[1,0],[1,1,1]],
  'O': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  'C': [[1,1,1],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
  'K': [[1,0,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
  'X': [[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],
  'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'P': [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
  'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
  'Y': [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
  'V': [[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
  'U': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  'S': [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
  'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'N': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
  'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
  'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
  'G': [[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
  'H': [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
  '-': [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
  ' ': [[0],[0],[0],[0],[0]],
};

function drawText(pixels, w, text, startX, startY, scale, r, g, b) {
  let cx = startX;
  for (const ch of text) {
    const glyph = FONT[ch.toUpperCase()] || FONT[' '];
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col]) {
          fillRect(pixels, w, 0, cx + col * scale, startY + row * scale, scale, scale, r, g, b);
        }
      }
    }
    cx += (glyph[0].length + 1) * scale;
  }
}

// --- Generate 1280x800 Marquee Promotional Image ---
function generateMarquee() {
  const W = 1280, H = 800;
  const pixels = new Uint8Array(W * H * 4);

  // Dark background
  fillRect(pixels, W, H, 0, 0, W, H, 10, 10, 15);

  // Subtle gradient effect - lighter at center
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - W/2) / W;
      const dy = (y - H/2) / H;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 0.5) {
        const intensity = Math.floor((0.5 - dist) * 20);
        const i = (y * W + x) * 4;
        pixels[i] = Math.min(255, pixels[i] + intensity);
        pixels[i+1] = Math.min(255, pixels[i+1] + intensity);
        pixels[i+2] = Math.min(255, pixels[i+2] + intensity + 5);
        pixels[i+3] = 255;
      }
    }
  }

  // Lock icon (large, centered)
  const lockX = W/2, lockY = 280;
  // Lock body
  fillRoundedRect(pixels, W, H, lockX - 50, lockY, 100, 75, 12, 34, 197, 94);
  // Shackle
  for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.005) {
    const ax = lockX + Math.cos(angle) * 35;
    const ay = lockY + Math.sin(angle) * 35;
    fillCircle(pixels, W, Math.round(ax), Math.round(ay), 6, 34, 197, 94);
  }
  // Keyhole
  fillCircle(pixels, W, lockX, lockY + 28, 8, 10, 10, 15);
  fillRect(pixels, W, H, lockX - 3, lockY + 36, 6, 16, 10, 10, 15);

  // "LOCKBOX" text
  drawText(pixels, W, "LOCKBOX", 460, 400, 10, 255, 255, 255);

  // Subtitle
  drawText(pixels, W, "API KEY VAULT", 420, 510, 6, 161, 161, 170);

  // Accent line under title
  fillRoundedRect(pixels, W, H, W/2 - 100, 490, 200, 3, 1, 34, 197, 94);

  // Feature pills at bottom
  const pillY = 620;
  const pills = ["COPY", "SEARCH", "AUTOFILL"];
  let pillX = 360;
  for (const pill of pills) {
    const pw = pill.length * 4 * 7 + 40;
    fillRoundedRect(pixels, W, H, pillX, pillY, pw, 36, 18, 34, 197, 94, 25);
    // Border
    for (let bx = pillX; bx < pillX + pw; bx++) {
      setPixel(pixels, W, bx, pillY, 34, 197, 94, 60);
      setPixel(pixels, W, bx, pillY + 35, 34, 197, 94, 60);
    }
    for (let by = pillY; by < pillY + 36; by++) {
      setPixel(pixels, W, pillX, by, 34, 197, 94, 60);
      setPixel(pixels, W, pillX + pw - 1, by, 34, 197, 94, 60);
    }
    drawText(pixels, W, pill, pillX + 20, pillY + 8, 4, 34, 197, 94);
    pillX += pw + 20;
  }

  return { pixels, width: W, height: H };
}

// --- Generate 440x280 Small Promotional Tile ---
function generateSmallTile() {
  const W = 440, H = 280;
  const pixels = new Uint8Array(W * H * 4);

  // Dark background
  fillRect(pixels, W, H, 0, 0, W, H, 10, 10, 15);

  // Lock icon
  const lockX = W/2, lockY = 80;
  fillRoundedRect(pixels, W, H, lockX - 30, lockY, 60, 45, 8, 34, 197, 94);
  for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.01) {
    const ax = lockX + Math.cos(angle) * 20;
    const ay = lockY + Math.sin(angle) * 20;
    fillCircle(pixels, W, Math.round(ax), Math.round(ay), 4, 34, 197, 94);
  }
  fillCircle(pixels, W, lockX, lockY + 17, 5, 10, 10, 15);
  fillRect(pixels, W, H, lockX - 2, lockY + 22, 4, 10, 10, 10, 15);

  // "LOCKBOX" text
  drawText(pixels, W, "LOCKBOX", 130, 150, 7, 255, 255, 255);

  // Accent line
  fillRoundedRect(pixels, W, H, W/2 - 60, 210, 120, 2, 1, 34, 197, 94);

  // Subtitle
  drawText(pixels, W, "API KEY VAULT", 128, 225, 4, 161, 161, 170);

  return { pixels, width: W, height: H };
}

// --- Generate 1280x800 Screenshot (popup mockup) ---
function generateScreenshot() {
  const W = 1280, H = 800;
  const pixels = new Uint8Array(W * H * 4);

  // Browser chrome background
  fillRect(pixels, W, H, 0, 0, W, H, 35, 35, 45);

  // Tab bar
  fillRect(pixels, W, H, 0, 0, W, 40, 25, 25, 35);
  fillRoundedRect(pixels, W, H, 10, 8, 180, 32, 8, 35, 35, 45);
  drawText(pixels, W, "LOCKBOX", 30, 16, 3, 200, 200, 210);

  // Address bar
  fillRoundedRect(pixels, W, H, 200, 8, 880, 28, 14, 50, 50, 60);

  // Page content area
  fillRect(pixels, W, H, 0, 44, W, H - 44, 245, 245, 250);

  // Popup overlay (centered, dark theme)
  const popupW = 380, popupH = 460;
  const popupX = W - popupW - 100, popupY = 50;

  // Shadow
  fillRoundedRect(pixels, W, H, popupX + 4, popupY + 4, popupW, popupH, 12, 0, 0, 0, 80);

  // Popup background
  fillRoundedRect(pixels, W, H, popupX, popupY, popupW, popupH, 12, 10, 10, 15);

  // Popup border
  for (let x = popupX; x < popupX + popupW; x++) {
    setPixel(pixels, W, x, popupY, 30, 30, 46);
    setPixel(pixels, W, x, popupY + popupH - 1, 30, 30, 46);
  }
  for (let y = popupY; y < popupY + popupH; y++) {
    setPixel(pixels, W, popupX, y, 30, 30, 46);
    setPixel(pixels, W, popupX + popupW - 1, y, 30, 30, 46);
  }

  // Header area
  const hx = popupX + 16, hy = popupY + 16;
  // Lock icon small
  fillRoundedRect(pixels, W, H, hx, hy, 28, 28, 6, 34, 197, 94, 25);
  drawText(pixels, W, "L", hx + 9, hy + 7, 3, 34, 197, 94);
  // Title
  drawText(pixels, W, "LOCKBOX", hx + 36, hy + 4, 3, 255, 255, 255);
  drawText(pixels, W, "3 VAULTS", hx + 36, hy + 17, 2, 113, 113, 122);
  // Avatar circle
  fillCircle(pixels, W, popupX + popupW - 30, hy + 14, 12, 34, 197, 94, 40);
  drawText(pixels, W, "B", popupX + popupW - 35, hy + 8, 2, 34, 197, 94);

  // Divider
  fillRect(pixels, W, H, popupX, popupY + 56, popupW, 1, 30, 30, 46);

  // Search bar
  fillRoundedRect(pixels, W, H, popupX + 12, popupY + 68, popupW - 24, 34, 8, 18, 18, 26);
  drawText(pixels, W, "SEARCH KEYS", popupX + 36, popupY + 78, 2, 90, 90, 110);

  // Key rows
  const services = [
    { name: "OPENAI", key: "API KEY", color: [16, 163, 127] },
    { name: "STRIPE", key: "SECRET KEY", color: [99, 91, 255] },
    { name: "AWS", key: "ACCESS KEY", color: [255, 153, 0] },
    { name: "GITHUB", key: "TOKEN", color: [240, 246, 252] },
    { name: "ANTHROPIC", key: "API KEY", color: [212, 165, 116] },
  ];

  let ky = popupY + 118;

  // Vault header
  drawText(pixels, W, "PRODUCTION", popupX + 16, ky, 2, 113, 113, 122);
  ky += 20;

  for (const svc of services) {
    // Hover highlight for first item
    if (svc.name === "OPENAI") {
      fillRoundedRect(pixels, W, H, popupX + 4, ky - 4, popupW - 8, 44, 6, 18, 18, 26);
    }

    // Service icon
    fillRoundedRect(pixels, W, H, popupX + 16, ky, 32, 32, 6, svc.color[0], svc.color[1], svc.color[2], 30);
    drawText(pixels, W, svc.name[0], popupX + 24, ky + 9, 3, svc.color[0], svc.color[1], svc.color[2]);

    // Name and masked value
    drawText(pixels, W, svc.name, popupX + 56, ky + 4, 2, 232, 234, 240);
    drawText(pixels, W, svc.key, popupX + 56, ky + 18, 2, 113, 113, 122);

    ky += 46;
  }

  // Bottom actions divider
  fillRect(pixels, W, H, popupX, popupY + popupH - 48, popupW, 1, 30, 30, 46);

  // Action buttons
  fillRoundedRect(pixels, W, H, popupX + 12, popupY + popupH - 38, 170, 28, 6, 34, 197, 94, 20);
  drawText(pixels, W, "ADD KEY", popupX + 52, popupY + popupH - 30, 2, 34, 197, 94);

  fillRoundedRect(pixels, W, H, popupX + 192, popupY + popupH - 38, 176, 28, 6, 18, 18, 26);
  drawText(pixels, W, "DASHBOARD", popupX + 220, popupY + popupH - 30, 2, 161, 161, 170);

  return { pixels, width: W, height: H };
}

// Generate all assets
const marquee = generateMarquee();
writeFileSync(resolve(outDir, "marquee-1280x800.png"), createPNG(marquee.width, marquee.height, Buffer.from(marquee.pixels)));
console.log("Generated marquee-1280x800.png");

const tile = generateSmallTile();
writeFileSync(resolve(outDir, "small-tile-440x280.png"), createPNG(tile.width, tile.height, Buffer.from(tile.pixels)));
console.log("Generated small-tile-440x280.png");

const screenshot = generateScreenshot();
writeFileSync(resolve(outDir, "screenshot-1280x800.png"), createPNG(screenshot.width, screenshot.height, Buffer.from(screenshot.pixels)));
console.log("Generated screenshot-1280x800.png");

console.log("\nAll store assets generated in store-assets/");
