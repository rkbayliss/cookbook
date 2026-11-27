// Helpers shared by the site build. Kept free of Eleventy so they are easy to test.

export const CATEGORY_ORDER = ["Weeknight Mains", "Weeknight Sides", "Holidays", "Special Occasion", "Desserts", "Magnificent Cakes", "Drinks"];

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const FRACTIONS = {
  "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾",
  "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
};

// "1 1/2 cups" -> "1½ cups". Leaves dates, URLs and other numbers alone.
export function typography(text) {
  return String(text ?? "")
    .replace(/(?<![\d/])(\d\/\d)(?![\d/])/g, (m) => FRACTIONS[m] ?? m)
    .replace(/(\d) (?=[½⅓⅔¼¾⅛⅜⅝⅞])/g, "$1")
    .replace(/(\p{L})'(?=\p{L})/gu, "$1’") // Bill's -> Bill’s
    .replace(/(\p{L}s)'(?=\s|$)/gu, "$1’"); // Chris' -> Chris’
}

// Obsidian-style links: [[slug]] or [[slug|Text]] -> Markdown links; ![[photo.jpg]] -> image.
export function wikiLinks(src, slugs) {
  return src
    .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, file) => `![](images/${file.trim()})`)
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, text) => {
      const slug = target.trim().replace(/\.md$/, "").split("/").pop();
      const label = (text || slug).trim();
      return slugs.has(slug) ? `[${label}](/${slug}/)` : label;
    });
}

const METHOD = ["preparation", "method", "directions", "instructions", "steps"];

// Splits rendered recipe HTML at each <h2> so the layout can place the parts.
export function splitSections(html) {
  const chunks = String(html).split(/(?=<h2[\s>])/);
  const out = { intro: "", stories: [], ingredients: "", ingredientsLabel: "Ingredients", method: "", methodLabel: "Preparation", notes: "", gallery: "", other: [] };
  if (!/^<h2[\s>]/.test(chunks[0] || "")) out.intro = chunks.shift() || "";
  for (const chunk of chunks) {
    const m = chunk.match(/^<h2[^>]*>([\s\S]*?)<\/h2>\s*/);
    const heading = m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
    const body = m ? chunk.slice(m[0].length) : chunk;
    const key = heading.toLowerCase();
    // "Ingredients", "Ingredients & Equipment", "Preparation", "Method"... keep the writer's wording
    if (key.startsWith("ingredients") && !out.ingredients) { out.ingredients = body; out.ingredientsLabel = heading; }
    else if (METHOD.some((w) => key.startsWith(w)) && !out.method) { out.method = body; out.methodLabel = heading; }
    else if (key === "notes") out.notes = body;
    else if (key === "gallery") out.gallery = body;
    // "## From Rod and Katherine", "## From Katherine", ... : a signed description
    else if (key.startsWith("from ")) {
      if (body.replace(/<[^>]+>|\s/g, "")) out.stories.push({ label: heading, body });
    }
    else out.other.push({ heading, body });
  }
  // A recipe whose Notes section is still just an empty "- " bullet shows no Notes.
  if (!out.notes.replace(/<[^>]+>|\s/g, "")) out.notes = "";
  return out;
}

// The About page: one { heading, body } per "## " section that has something in it.
export function aboutSections(html) {
  return String(html)
    .split(/(?=<h2[\s>])/)
    .map((chunk) => {
      const m = chunk.match(/^<h2[^>]*>([\s\S]*?)<\/h2>\s*/);
      return m ? { heading: m[1], body: chunk.slice(m[0].length) } : null;
    })
    .filter((s) => s && s.body.replace(/<!--[\s\S]*?-->|<[^>]+>|\s/g, ""));
}

// recipe-slug_2006-sabrina-age-14.jpg -> "2006 · Sabrina age 14"
export function photoCaption(file) {
  const base = String(file).split("/").pop().replace(/\.[^.]+$/, "");
  const desc = base.includes("_") ? base.slice(base.indexOf("_") + 1) : "";
  if (!desc) return "";
  if (/^card(-front)?$/.test(desc)) return "The original recipe card";
  if (desc === "card-back") return "The original recipe card (back)";
  if (/^book-\d{4}/.test(desc)) return `From the ${desc.slice(5, 9)} family cookbook`;
  const step = desc.match(/^step-\d+-?(.*)$/);
  if (step) return step[1] ? step[1].replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()) : "";
  const m = desc.match(/^(\d{4})-?(.*)$/);
  const words = (s) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  if (m) return m[2] ? `${m[1]} · ${words(m[2])}` : m[1];
  return words(desc);
}

// ---------- Photos by kind (decided by the file name) ----------
//   <recipe>_card.jpg, _card-front, _card-back   the original recipe card or sheet
//   <recipe>_step-3.jpg, _step-3-folding          a photo for step 3
//   anything else                                 the first is the dish photo at the top,
//                                                 the rest are snapshots after the Notes
const base = (f) => String(f).split("/").pop().replace(/\.[^.]+$/, "");
const desc = (f) => (base(f).includes("_") ? base(f).slice(base(f).indexOf("_") + 1) : "");

export function groupPhotos(list, exclude = []) {
  const out = { hero: null, cards: [], steps: {}, snaps: [] };
  const skip = new Set(exclude || []);
  for (const f of list || []) {
    if (skip.has(base(f))) continue; // written into the Gallery: shown there only
    const d = desc(f);
    const step = d.match(/^step-(\d+)/);
    if (/^card(-|$)/.test(d)) out.cards.push(f);
    else if (step) (out.steps[step[1]] ||= []).push(f);
    else if (!out.hero) out.hero = f;
    else out.snaps.push(f);
  }
  return out;
}

// The Gallery ("## Gallery", after the Notes): sentimental or contextual photos and words.
// Each paragraph is one item: a photo (![](images/<file>.jpg)) with any words written right
// under it, or words on their own. Photos in `photos:` that aren't the main photo, a card or a
// step photo, and aren't written into the Gallery, join it at the end.
export function galleryPhotoNames(html) {
  return [...String(html || "").matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map((m) => base(m[1]));
}

export function galleryItems(html, snaps = [], have = {}) {
  const items = [];
  const blocks = String(html || "").match(/<(p|ul|ol|blockquote)\b[^>]*>[\s\S]*?<\/\1>/g) || [];
  for (const b of blocks) {
    const img = b.startsWith("<p") && b.match(/<img\b[^>]*>/);
    if (img) {
      const name = base((img[0].match(/\ssrc="([^"]+)"/) || [])[1] || "");
      const alt = (img[0].match(/\salt="([^"]*)"/) || [])[1] || "";
      const text = b.replace(/^<p[^>]*>|<\/p>$/g, "").replace(img[0], "").replace(/^\s*(<br\s*\/?>)?\s*/, "").trim();
      // A photo that isn't in recipes/images (a typo, or the template's example) is left out.
      if (have[name]) items.push({ photo: name, alt, caption: photoCaption(name), text: text ? `<p>${text}</p>` : "" });
      else if (text) items.push({ text: `<p>${text}</p>` });
    } else if (b.replace(/<[^>]+>|\s/g, "")) items.push({ text: b });
  }
  const used = new Set(items.map((i) => i.photo).filter(Boolean));
  for (const f of snaps || []) if (!used.has(base(f))) items.push({ photo: base(f), alt: "", caption: photoCaption(f), text: "" });
  return items;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Puts each step's photos at the end of that step (the Nth item of the first numbered list).
// Photos for steps that don't exist, or a method without a numbered list, go after the method.
export function withStepPhotos(html, steps, title = "") {
  const figure = (f) => {
    const name = base(f), cap = photoCaption(f);
    return `<figure class="step-photo"><a href="/images/${name}.jpg" class="zoom"><img src="/images/${name}-800.jpg" loading="lazy" alt="${esc(cap || title)}"></a>${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}</figure>`;
  };
  const left = { ...steps };
  html = String(html);
  const olStart = html.indexOf("<ol");
  if (olStart !== -1) {
    // walk the top-level <li> elements of the first <ol>
    const re = /<(\/?)(ol|ul|li)\b[^>]*>/g;
    re.lastIndex = olStart;
    let depth = 0, item = 0, m, out = html.slice(0, olStart), last = olStart;
    while ((m = re.exec(html))) {
      const [tag, close, name] = m;
      if (name === "ol" || name === "ul") depth += close ? -1 : 1;
      if (name === "li" && !close && depth === 1) item++;
      if (name === "li" && close && depth === 1 && left[item]) {
        out += html.slice(last, m.index) + left[item].map(figure).join("");
        last = m.index;
        delete left[item];
      }
      if (depth === 0) break;
    }
    html = out + html.slice(last);
  }
  const rest = Object.keys(left).sort((a, b) => a - b).flatMap((k) => left[k]);
  return html + (rest.length ? `<div class="step-photos-extra">${rest.map(figure).join("")}</div>` : "");
}
