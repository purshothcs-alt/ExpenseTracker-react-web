/**
 * Generates PWA PNG icons with zero external dependencies.
 * Run: node scripts/generate-icons.mjs
 */
import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// CRC32 table for PNG chunk checksums
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function uint32BE(n) {
  return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = uint32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = uint32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crc]);
}

// Shortest distance from point (px,py) to segment (ax,ay)-(bx,by)
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function makePNG(size, r, g, b) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);   // width
  ihdr.writeUInt32BE(size, 4);   // height
  ihdr[8] = 8;                   // bit depth
  ihdr[9] = 2;                   // color type: RGB
  // bytes 10-12: compression=0, filter=0, interlace=0

  // Raw image data: each row = filter byte (0) + RGB pixels
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const off = rowStart + 1 + x * 3;

      // Draw rounded rect background
      const cx = size / 2, cy = size / 2, radius = size * 0.38;
      const cornerR = size * 0.18;
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      const inRect = dx <= radius && dy <= radius;
      const inCornerZone = dx > radius - cornerR && dy > radius - cornerR;
      const inRoundedCorner = !inCornerZone ||
        Math.hypot(dx - (radius - cornerR), dy - (radius - cornerR)) <= cornerR;

      if (inRect && inRoundedCorner) {
        // Rupee ₹ symbol: a left vertical stroke, two open-ended top
        // crossbars, and a diagonal leg sweeping to the bottom right.
        const nx = (x - cx) / radius;  // -1 to 1
        const ny = (y - cy) / radius;  // -1 to 1
        const sw = 0.16; // stroke width, in normalized units

        const inLeftStroke = nx > -0.5 && nx < -0.5 + sw && ny > -0.62 && ny < -0.04;
        const inTopBar = nx > -0.5 && nx < 0.34 && ny > -0.62 && ny < -0.62 + sw;
        const inMidBar = nx > -0.5 && nx < 0.34 && ny > -0.2 && ny < -0.2 + sw;
        const onDiag = distToSegment(nx, ny, -0.42, -0.04, 0.3, 0.62) < sw / 2;

        if (inLeftStroke || inTopBar || inMidBar || onDiag) {
          raw[off] = 255; raw[off + 1] = 255; raw[off + 2] = 255; // white symbol
        } else {
          raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; // brand color
        }
      } else {
        raw[off] = 255; raw[off + 1] = 255; raw[off + 2] = 255; // white outside
      }
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Brand blue: #1976D2 = rgb(25, 118, 210)
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  const png = makePNG(size, 25, 118, 210);
  const path = join(OUT, `icon-${size}x${size}.png`);
  const ws = createWriteStream(path);
  ws.write(png);
  ws.end();
  console.log(`✓ icon-${size}x${size}.png`);
}

// apple-touch-icon.png (180x180)
const apple = makePNG(180, 25, 118, 210);
const appleWs = createWriteStream(join(__dir, '..', 'public', 'apple-touch-icon.png'));
appleWs.write(apple);
appleWs.end();
console.log('✓ apple-touch-icon.png');

console.log('\nAll PWA icons generated in public/icons/');
