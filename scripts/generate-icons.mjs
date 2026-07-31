// Generates all app icons from the Westercove logo mark.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARK = path.join(root, 'assets/images/westercove-mark.png');
const OUT = path.join(root, 'assets/images');

// Warm cream brand background (matches the app's light surface).
const CREAM = { r: 246, g: 239, b: 230, alpha: 1 };

/** Render the mark centered on a square canvas.
 * @param size canvas size in px
 * @param coverage fraction of the canvas width the mark should span
 * @param background solid background, or null for transparency
 */
async function composeMark(size, coverage, background) {
  const markW = Math.round(size * coverage);
  const mark = await sharp(MARK)
    .resize({ width: markW, fit: 'inside' })
    .toBuffer();
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  return canvas
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function write(name, buffer) {
  await sharp(buffer).toFile(path.join(OUT, name));
  console.log('wrote', name);
}

async function main() {
  // iOS + fallback app icon: opaque, on cream.
  await write('icon.png', await composeMark(1024, 0.58, CREAM));

  // Android adaptive foreground: transparent, smaller to sit inside the safe zone.
  await write('android-icon-foreground.png', await composeMark(1024, 0.46, null));
  // Solid cream background layer (backgroundColor also set in app.json).
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: CREAM },
  })
    .png()
    .toFile(path.join(OUT, 'android-icon-background.png'));
  console.log('wrote android-icon-background.png');
  // Monochrome (themed icon): a dark silhouette whose shape is the mark's alpha.
  const fg = await composeMark(1024, 0.46, null);
  const alpha = await sharp(fg).ensureAlpha().extractChannel(3).toColourspace('b-w').toBuffer();
  const mono = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 30, g: 24, b: 42 } },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
  await write('android-icon-monochrome.png', mono);

  // Splash: transparent mark (expo tints the surrounding area via backgroundColor).
  await write('splash-icon.png', await composeMark(512, 0.72, null));

  // Web favicon.
  await write('favicon.png', await sharp(await composeMark(64, 0.62, CREAM)).png().toBuffer());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
