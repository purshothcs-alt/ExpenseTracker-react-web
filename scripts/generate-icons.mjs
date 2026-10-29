/**
 * Generates PWA icons (and favicon/apple-touch-icon) plus Android launcher
 * icons from a source photo.
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

// Android launcher icons, keyed by density: [legacy/round size, adaptive foreground size]
const ANDROID_RES = join(__dir, '..', 'android', 'app', 'src', 'main', 'res');
const ANDROID_DENSITIES = {
  mdpi: [48, 108],
  hdpi: [72, 162],
  xhdpi: [96, 216],
  xxhdpi: [144, 324],
  xxxhdpi: [192, 432],
};

// Square crop centred on the face.
function cropSquare(meta) {
  const squareSize = Math.round(Math.min(meta.width, meta.height) * 0.62);

  const left = Math.min(
    Math.max(Math.round(meta.width * 0.56 - squareSize / 2), 0),
    meta.width - squareSize,
  );
  const top = Math.min(
    Math.max(Math.round(meta.height * 0.65 - squareSize / 2), 0),
    meta.height - squareSize,
  );

  return sharp(SOURCE).extract({ left, top, width: squareSize, height: squareSize }).toBuffer();
}

function circleMask(size) {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`,
  );
}

// Adaptive icon launchers only show the centre ~72dp of the 108dp foreground,
// so place the PWA crop over that (with margin to hide its edge under the mask)
// and fill the bleed with a blurred copy of it.
async function adaptiveForeground(squareBuffer, size) {
  const inner = Math.round((size * 84) / 108);
  const offset = Math.round((size - inner) / 2);
  const centre = await sharp(squareBuffer).resize(inner, inner).toBuffer();

  return sharp(squareBuffer)
    .resize(size, size)
    .blur(size / 20)
    .composite([{ input: centre, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function generateAndroid(squareBuffer) {
  for (const [density, [size, fgSize]] of Object.entries(ANDROID_DENSITIES)) {
    const dir = join(ANDROID_RES, `mipmap-${density}`);

    await sharp(squareBuffer).resize(size, size).png().toFile(join(dir, 'ic_launcher.png'));
    await sharp(squareBuffer)
      .resize(size, size)
      .composite([{ input: circleMask(size), blend: 'dest-in' }])
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'));
    await sharp(await adaptiveForeground(squareBuffer, fgSize)).toFile(
      join(dir, 'ic_launcher_foreground.png'),
    );
    console.log(`✓ android mipmap-${density}`);
  }
}

async function run() {
  const meta = await sharp(SOURCE).metadata();
  // Tight crop around the face so the icon reads clearly at small sizes.
  const squareBuffer = await cropSquare(meta);

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

  await generateAndroid(squareBuffer);

  console.log('\nAll PWA and Android icons generated from app-icon-source.jpeg');
}

run();
