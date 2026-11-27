import fs from "node:fs";
import path from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { CATEGORY_ORDER, slugify, typography, splitSections, photoCaption, wikiLinks, aboutSections, groupPhotos, withStepPhotos } from "./theme/lib/recipes.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Files that are part of the repo but not pages on the site.
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("CLAUDE.md");
  eleventyConfig.ignores.add("recipes/_template.md");
  eleventyConfig.ignores.add("scripts/**");

  eleventyConfig.addPassthroughCopy({ "theme/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "node_modules/@fontsource-variable/eb-garamond/files": "assets/fonts" });
  // Photos are resized into _site/images by scripts/build-images.js, not copied here.
  eleventyConfig.ignores.add("recipes/images/**");

  eleventyConfig.addCollection("recipes", (api) =>
    api.getFilteredByGlob("recipes/**/*.md").sort((a, b) => a.data.title.localeCompare(b.data.title)),
  );

  // Markdown: link bare URLs, turn [[wiki-links]] into real links, typographic fractions.
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ linkify: true, typographer: true });
    md.core.ruler.before("normalize", "wikilinks", (state) => {
      state.src = wikiLinks(state.src, recipeSlugs());
    });
    md.core.ruler.push("fractions", (state) => {
      for (const block of state.tokens) {
        if (block.type !== "inline") continue;
        for (const t of block.children) if (t.type === "text") t.content = typography(t.content);
      }
    });
    // Any relative image path in a recipe points at the shared photo folder.
    const defaultImage = md.renderer.rules.image;
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const t = tokens[idx];
      const src = t.attrGet("src");
      if (src && !/^(https?:)?\//.test(src)) {
        const name = path.basename(src).replace(/\.[^.]+$/, "");
        t.attrSet("src", `/images/${name}.jpg`);
        t.attrSet("loading", "lazy");
      }
      return defaultImage(tokens, idx, options, env, self);
    };
  });

  eleventyConfig.addFilter("sections", splitSections);
  eleventyConfig.addFilter("aboutSections", aboutSections);
  eleventyConfig.addFilter("typography", typography);
  // A recipe's source: any web address in it becomes a link, shown as the site's name.
  eleventyConfig.addFilter("linkUrls", (s) =>
    String(s ?? "").replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)"']/g, (u) => `<a href="${u}">${new URL(u).hostname.replace(/^www\./, "")}</a>`),
  );
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addFilter("photoName", (file) => path.basename(String(file)).replace(/\.[^.]+$/, ""));
  eleventyConfig.addFilter("photoCaption", photoCaption);
  eleventyConfig.addFilter("groupPhotos", groupPhotos);
  eleventyConfig.addFilter("withStepPhotos", withStepPhotos);
  // Only the listed photos that exist in recipes/images (a typo shouldn't show a broken image).
  eleventyConfig.addFilter("availablePhotos", (list, have) =>
    (Array.isArray(list) ? list : list ? [list] : []).filter((p) => have[path.basename(String(p)).replace(/\.[^.]+$/, "")]),
  );
  // Section forewords: forewords/<file>.md with category: <the section's name>. A section with
  // one gets a clickable heading on the home page.
  eleventyConfig.addCollection("forewords", (api) => api.getFilteredByGlob("forewords/*.md"));
  eleventyConfig.addFilter("forewordFor", (forewords, category) =>
    (forewords || []).find((f) => f.data.category === category),
  );
  eleventyConfig.addFilter("inCategory", (recipes, category) =>
    recipes.filter((r) => r.data.category === category && r.data.archive !== true),
  );

  eleventyConfig.addFilter("roman", (n) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ?? String(n + 1));

  // Recipes grouped by category, in cookbook order (unknown categories go last).
  eleventyConfig.addFilter("byCategory", (recipes) => {
    const groups = new Map();
    for (const r of recipes) {
      const c = r.data.category || "Other";
      if (!groups.has(c)) groups.set(c, []);
      groups.get(c).push(r);
    }
    const rank = (c) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : 99);
    return [...groups.entries()]
      .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
      .map(([name, items]) => ({ name, slug: slugify(name), items }));
  });
  eleventyConfig.addFilter("fromFamily", (recipes, family) =>
    family ? recipes.filter((r) => (r.data.from || "").toLowerCase() === family.toLowerCase()) : recipes,
  );
  // archive: true puts a recipe in The Archive instead of the everyday chapters.
  eleventyConfig.addFilter("archived", (recipes) => recipes.filter((r) => r.data.archive === true));
  eleventyConfig.addFilter("everyday", (recipes) => recipes.filter((r) => r.data.archive !== true));
  eleventyConfig.addFilter("finished", (recipes) => recipes.filter((r) => r.data.status !== "draft"));
  // Kitchens in the order given (site.json "kitchens"); any others follow alphabetically.
  eleventyConfig.addFilter("families", (recipes, order = []) => {
    const found = [...new Set(recipes.map((r) => r.data.from).filter(Boolean))];
    const rank = (k) => (order.includes(k) ? order.indexOf(k) : order.length);
    return found.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  });
  eleventyConfig.addFilter("allTags", (recipes) =>
    [...new Set(recipes.flatMap((r) => r.data.tags || []))].filter((t) => t !== "recipe").sort(),
  );
  // Plain text used by the search box on the home page.
  eleventyConfig.addFilter("searchText", (r) => {
    const body = fs.readFileSync(r.inputPath, "utf8").replace(/^---[\s\S]*?---/, "");
    const ingredients = (body.match(/## Ingredients([\s\S]*?)(\n## |$)/) || [, ""])[1];
    return [r.data.title, r.data.credit, r.data.from, r.data.category, ...(r.data.tags || []), ingredients]
      .join(" ")
      .replace(/[*#\-\[\]|]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  });

  let slugCache;
  function recipeSlugs() {
    if (!slugCache) {
      slugCache = new Set();
      for (const fam of fs.readdirSync("recipes", { withFileTypes: true })) {
        if (!fam.isDirectory() || fam.name === "images") continue;
        for (const f of fs.readdirSync(path.join("recipes", fam.name))) if (f.endsWith(".md")) slugCache.add(f.slice(0, -3));
      }
    }
    return slugCache;
  }
  eleventyConfig.on("eleventy.before", () => (slugCache = undefined));

  return {
    dir: { input: ".", includes: "theme/_includes", data: "theme/_data", output: "_site" },
    markdownTemplateEngine: false, // recipes are plain Markdown; a stray {{ }} won't break the build
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
