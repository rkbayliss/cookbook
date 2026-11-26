// Names (without extension) of photos present in recipes/images, so pages only
// show photos that actually exist.
import fs from "node:fs";

export default function () {
  const dir = "recipes/images";
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    if (/\.(jpe?g|png|webp|heic|heif|tiff?)$/i.test(f)) out[f.replace(/\.[^.]+$/, "")] = true;
  }
  return out;
}
