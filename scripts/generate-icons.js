// Generates minimal PNG icons for the extension
// Uses raw PNG encoding (no dependencies needed)
import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

function createPNG(size, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    // CRC
    const crcData = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc ^= 0xffffffff;
    buf.writeInt32BE(crc, buf.length - 4);
    return buf;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT - raw pixel data with filter bytes
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const si = (y * size + x) * 4;
      const di = y * (size * 4 + 1) + 1 + x * 4;
      raw[di] = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
      raw[di + 3] = pixels[si + 3];
    }
  }
  const compressed = deflateSync(raw);

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", iend),
  ]);
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    // Alpha blend
    const srcA = a / 255;
    const dstA = pixels[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      pixels[i] = Math.round((r * srcA + pixels[i] * dstA * (1 - srcA)) / outA);
      pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA);
      pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA);
      pixels[i + 3] = Math.round(outA * 255);
    }
  }

  function fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        setPixel(x + dx, y + dy, r, g, b, a);
      }
    }
  }

  function fillCircle(cx, cy, radius, r, g, b, a = 255) {
    for (let dy = -radius - 1; dy <= radius + 1; dy++) {
      for (let dx = -radius - 1; dx <= radius + 1; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          setPixel(cx + dx, cy + dy, r, g, b, a);
        } else if (dist <= radius + 1) {
          const aa = Math.round(a * (1 - (dist - radius)));
          if (aa > 0) setPixel(cx + dx, cy + dy, r, g, b, aa);
        }
      }
    }
  }

  function fillRoundedRect(x, y, w, h, rad, r, g, b, a = 255) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        let inside = true;
        // Check corners
        if (dx < rad && dy < rad) {
          inside = Math.sqrt((dx - rad) ** 2 + (dy - rad) ** 2) <= rad;
        } else if (dx >= w - rad && dy < rad) {
          inside = Math.sqrt((dx - (w - rad - 1)) ** 2 + (dy - rad) ** 2) <= rad;
        } else if (dx < rad && dy >= h - rad) {
          inside = Math.sqrt((dx - rad) ** 2 + (dy - (h - rad - 1)) ** 2) <= rad;
        } else if (dx >= w - rad && dy >= h - rad) {
          inside = Math.sqrt((dx - (w - rad - 1)) ** 2 + (dy - (h - rad - 1)) ** 2) <= rad;
        }
        if (inside) setPixel(x + dx, y + dy, r, g, b, a);
      }
    }
  }

  function strokeRoundedRect(x, y, w, h, rad, lineW, r, g, b, a = 255) {
    for (let dy = -lineW; dy < h + lineW; dy++) {
      for (let dx = -lineW; dx < w + lineW; dx++) {
        // Distance to rectangle edge
        let cornerDist = Infinity;
        let edgeDist = Infinity;

        // Simple approach: check if pixel is near the border
        const px = dx;
        const py = dy;
        const inside = px >= 0 && px < w && py >= 0 && py < h;
        const inOuter = px >= -lineW && px < w + lineW && py >= -lineW && py < h + lineW;
        if (!inOuter) continue;

        // Check distance to border
        let minDist;
        if (px < rad && py < rad) {
          minDist = Math.abs(Math.sqrt((px - rad) ** 2 + (py - rad) ** 2) - rad);
        } else if (px >= w - rad && py < rad) {
          minDist = Math.abs(Math.sqrt((px - (w - rad - 1)) ** 2 + (py - rad) ** 2) - rad);
        } else if (px < rad && py >= h - rad) {
          minDist = Math.abs(Math.sqrt((px - rad) ** 2 + (py - (h - rad - 1)) ** 2) - rad);
        } else if (px >= w - rad && py >= h - rad) {
          minDist = Math.abs(Math.sqrt((px - (w - rad - 1)) ** 2 + (py - (h - rad - 1)) ** 2) - rad);
        } else {
          minDist = Math.min(
            Math.abs(px), Math.abs(px - w + 1),
            Math.abs(py), Math.abs(py - h + 1)
          );
        }

        if (minDist <= lineW) {
          const aa = minDist < lineW - 1 ? a : Math.round(a * (1 - (minDist - (lineW - 1))));
          if (aa > 0) setPixel(x + dx, y + dy, r, g, b, aa);
        }
      }
    }
  }

  const s = size;
  const pad = Math.max(1, Math.round(s * 0.06));
  const bgRad = Math.round(s * 0.2);

  // Background
  fillRoundedRect(pad, pad, s - pad * 2, s - pad * 2, bgRad, 10, 10, 15);

  // Green border
  const bw = Math.max(1, Math.round(s * 0.04));
  strokeRoundedRect(pad, pad, s - pad * 2, s - pad * 2, bgRad, bw, 34, 197, 94);

  // Lock body (green rounded rect)
  const lockW = Math.round(s * 0.38);
  const lockH = Math.round(s * 0.26);
  const lockX = Math.round((s - lockW) / 2);
  const lockY = Math.round(s * 0.48);
  const lockRad = Math.max(2, Math.round(s * 0.06));
  fillRoundedRect(lockX, lockY, lockW, lockH, lockRad, 34, 197, 94);

  // Lock shackle (arc above lock body)
  const shackleR = Math.round(lockW * 0.35);
  const shackleCX = Math.round(s / 2);
  const shackleCY = lockY;
  const shackleW = Math.max(1, Math.round(s * 0.06));

  for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.01) {
    const ax = shackleCX + Math.cos(angle) * shackleR;
    const ay = shackleCY + Math.sin(angle) * shackleR;
    fillCircle(Math.round(ax), Math.round(ay), shackleW / 2, 34, 197, 94);
  }

  // Keyhole dot
  const khR = Math.max(1, Math.round(s * 0.04));
  const khX = Math.round(s / 2);
  const khY = Math.round(lockY + lockH * 0.4);
  fillCircle(khX, khY, khR, 10, 10, 15);

  // Keyhole line
  const lineLen = Math.max(1, Math.round(s * 0.08));
  const lineW = Math.max(1, Math.round(s * 0.025));
  fillRect(khX - Math.floor(lineW / 2), khY + khR, lineW, lineLen, 10, 10, 15);

  return Buffer.from(pixels);
}

for (const size of [16, 32, 48, 128]) {
  const pixels = drawIcon(size);
  const png = createPNG(size, pixels);
  const path = resolve(outDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`Generated ${path} (${png.length} bytes)`);
}
