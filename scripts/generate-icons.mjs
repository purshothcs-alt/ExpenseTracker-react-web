/**
 * Generates PWA icons (and favicon/apple-touch-icon) from a source photo.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dir = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(__dir, '..', 'src', 'assets', 'app-icon-source.jpeg');
const ICONS_OUT = join(__dir, '..', 'public', 'icons');
const PUBLIC_OUT = join(__dir, '..', 'public');

mkdirSync(ICONS_OUT, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function run() {
  const meta = await sharp(SOURCE).metadata();
  // Tight crop around the face so the icon reads clearly at small sizes.
  const squareSize = Math.round(Math.min(meta.width, meta.height) * 0.62);

  const left = Math.min(
    Math.max(Math.round(meta.width * 0.56 - squareSize / 2), 0),
    meta.width - squareSize,
  );
  const top = Math.min(
    Math.max(Math.round(meta.height * 0.65 - squareSize / 2), 0),
    meta.height - squareSize,
  );

  const square = sharp(SOURCE).extract({ left, top, width: squareSize, height: squareSize });
  const squareBuffer = await square.toBuffer();

  for (const size of SIZES) {
    await sharp(squareBuffer)
      .resize(size, size)
      .png()
      .toFile(join(ICONS_OUT, `icon-${size}x${size}.png`));
    console.log(`✓ icon-${size}x${size}.png`);
  }

  await sharp(squareBuffer).resize(180, 180).png().toFile(join(PUBLIC_OUT, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  await sharp(squareBuffer).resize(32, 32).png().toFile(join(PUBLIC_OUT, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  console.log('\nAll PWA icons generated from app-icon-source.jpeg');
}

run();
