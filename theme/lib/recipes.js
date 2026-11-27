// Helpers shared by the site build. Kept free of Eleventy so they are easy to test.

export const CATEGORY_ORDER = ["Weeknight Mains", "Weeknight Sides", "Holidays", "Special Occasion", "Desserts", "Drinks"];

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
  const out = { intro: "", stories: [], ingredients: "", method: "", notes: "", other: [] };
  if (!/^<h2[\s>]/.test(chunks[0] || "")) out.intro = chunks.shift() || "";
  for (const chunk of chunks) {
    const m = chunk.match(/^<h2[^>]*>([\s\S]*?)<\/h2>\s*/);
    const heading = m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
    const body = m ? chunk.slice(m[0].length) : chunk;
    const key = heading.toLowerCase();
    if (key === "ingredients") out.ingredients = body;
    else if (METHOD.includes(key)) out.method = body;
    else if (key === "notes") out.notes = body;
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
  const m = desc.match(/^(\d{4})-?(.*)$/);
  const words = (s) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  if (m) return m[2] ? `${m[1]} · ${words(m[2])}` : m[1];
  return words(desc);
}
