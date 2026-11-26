// Makes the web-sized copies of every photo in recipes/images:
//   _site/images/<name>.jpg      1600px, for the large photo at the top of a recipe
//   _site/images/<name>-800.jpg  800px, for phones and the gallery
// Runs after Eleventy in `npm run build`. Unchanged photos are skipped.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import convertHeic from "heic-convert";

const SRC = "recipes/images";
const OUT = "_site/images";
fs.mkdirSync(OUT, { recursive: true });

let made = 0;
for (const f of fs.existsSync(SRC) ? fs.readdirSync(SRC) : []) {
  if (!/\.(jpe?g|png|webp|heic|heif|tiff?|avif)$/i.test(f)) continue;
  const src = path.join(SRC, f);
  const name = f.replace(/\.[^.]+$/, "");
  const big = path.join(OUT, `${name}.jpg`);
  if (fs.existsSync(big) && fs.statSync(big).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  let input = fs.readFileSync(src);
  if (/\.hei[cf]$/i.test(f)) input = Buffer.from(await convertHeic({ buffer: input, format: "JPEG", quality: 1 }));
  for (const [w, file] of [[1600, big], [800, path.join(OUT, `${name}-800.jpg`)]]) {
    await sharp(input).rotate().resize({ width: w, height: w, fit: "inside", withoutEnlargement: true })
      .toColourspace("srgb").jpeg({ quality: 80, mozjpeg: true }).toFile(file);
  }
  made++;
}
console.log(`Photos: ${made} resized.`);
