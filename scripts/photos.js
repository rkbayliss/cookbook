// Photo housekeeping for recipes/images.
//
//   npm run photos                       Tidy every photo in recipes/images (see below).
//   npm run photos -- --check            Report photos that need tidying; exit 1 if any do.
//   npm run add-photo -- <file> <recipe> <description>
//        e.g. npm run add-photo -- ~/Desktop/IMG_2231.HEIC brined-sous-vide-turkey 2026-carved
//        Saves recipes/images/brined-sous-vide-turkey_2026-carved.jpg and adds it to the
//        recipe's `photos:` list.
//
// "Tidy" means: convert to JPEG (including iPhone HEIC), turn upright, shrink to at most
// 2400px on the long side, and remove ALL metadata, including GPS location. The site is
// public, so location data must never be published.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import convertHeic from "heic-convert";

const DIR = "recipes/images";
const MAX = 2400;
const IMAGE = /\.(jpe?g|png|webp|heic|heif|tiff?|gif|avif)$/i;

export function normalName(name) {
  const base = name.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const i = base.indexOf("_");
  const clean = (s) => s.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (i === -1 ? clean(base) : `${clean(base.slice(0, i))}_${clean(base.slice(i + 1))}`) + ".jpg";
}

async function decode(file) {
  const buf = fs.readFileSync(file);
  if (/\.hei[cf]$/i.test(file)) return Buffer.from(await convertHeic({ buffer: buf, format: "JPEG", quality: 1 }));
  return buf;
}

async function needsWork(file) {
  if (!/\.jpg$/.test(file) || path.basename(file) !== normalName(path.basename(file))) return "rename/convert";
  const m = await sharp(file).metadata();
  if (m.exif || m.xmp || m.iptc) return "has metadata";
  if (Math.max(m.width, m.height) > MAX) return `too large (${m.width}×${m.height})`;
  return "";
}

async function tidy(src, dest) {
  const out = await sharp(await decode(src))
    .rotate()
    .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer(); // sharp drops all metadata unless asked to keep it
  fs.writeFileSync(dest, out);
  return out.length;
}

function recipeFile(slug) {
  for (const fam of fs.readdirSync("recipes", { withFileTypes: true })) {
    if (!fam.isDirectory() || fam.name === "images") continue;
    const f = path.join("recipes", fam.name, `${slug}.md`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

function addToFrontMatter(file, photo) {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^photos:[ \t]*\[(.*)\][ \t]*$/m);
  if (!m) throw new Error(`${file} has no "photos: [...]" line; add the photo to it by hand.`);
  const list = m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  if (list.includes(photo)) return false;
  list.push(photo);
  fs.writeFileSync(file, text.replace(m[0], `photos: [${list.join(", ")}]`));
  return true;
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
const [cmd, ...args] = process.argv.slice(2);
fs.mkdirSync(DIR, { recursive: true });

if (cmd === "add") {
  const [file, slug, ...descWords] = args;
  if (!file || !slug) {
    console.error("Usage: npm run add-photo -- <photo file> <recipe-file-name> <description>");
    process.exit(1);
  }
  const recipe = recipeFile(slug);
  if (!recipe) {
    console.error(`No recipe named "${slug}". Use the recipe's file name without .md, e.g. brined-sous-vide-turkey`);
    process.exit(1);
  }
  const desc = descWords.join("-") || String(Date.now());
  const name = normalName(`${slug}_${desc}`);
  const dest = path.join(DIR, name);
  if (fs.existsSync(dest)) {
    console.error(`${dest} already exists. Choose a different description.`);
    process.exit(1);
  }
  const size = await tidy(file, dest);
  const added = addToFrontMatter(recipe, name);
  console.log(`Saved ${dest} (${kb(size)}, location data removed)${added ? `, added to ${recipe}` : ""}.`);
} else {
  const check = cmd === "--check";
  let pending = 0;
  for (const f of fs.readdirSync(DIR).filter((f) => IMAGE.test(f))) {
    const src = path.join(DIR, f);
    const why = await needsWork(src);
    if (!why) continue;
    pending++;
    const dest = path.join(DIR, normalName(f));
    if (check) { console.log(`${src}: ${why}`); continue; }
    if (dest !== src && fs.existsSync(dest)) { console.warn(`Skipped ${src}: ${dest} already exists.`); continue; }
    const size = await tidy(src, dest);
    if (dest !== src) fs.unlinkSync(src);
    console.log(`${src} → ${dest} (${kb(size)})${dest !== src ? "  ⚠ renamed: update any recipe that lists the old name" : ""}`);
  }
  if (check && pending) { console.log(`${pending} photo(s) need tidying. Run: npm run photos`); process.exit(1); }
  if (!pending) console.log("All photos are tidy.");
}
