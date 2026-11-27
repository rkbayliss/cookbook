# The Family Cookbook (Bayliss & Paseman)

Rod and Katherine's family cookbook. Every recipe is a Markdown file. This repo is the only
copy; there is no other vault or document to keep in sync. The site is built with Eleventy and
published to GitHub Pages (later at `cookbook.rkbayliss.com`).

Both Rod and Katherine edit through their own Claude accounts, so follow these conventions
exactly. Consistency across recipes matters more than any one recipe's formatting.

## Where things live

```
recipes/
  _template.md          Copy this for every new recipe
  bayliss/              Recipes from the Bayliss side (and recipes Rod & Katherine created)
  paseman/              Recipes from the Paseman side
  images/               All recipe photos, flat, named <recipe-file-name>_<description>.jpg
theme/                  Site design: templates (_includes, pages), CSS/JS (assets), helpers (lib)
scripts/                photos.js (photo tidying), build-images.js, build-pdf.js
```

## Recipe files

- **File name**: lowercase, hyphenated, no apostrophes, `.md`, e.g. `aunt-bs-pot-roast.md`.
  The file name is the recipe's web address (`/aunt-bs-pot-roast/`) and the prefix of its
  photos. **Don't rename an existing recipe**: it breaks links and photo names.
- **Folder**: `recipes/bayliss/` or `recipes/paseman/`, matching `from:`.
- **Front matter**, in this order (see `recipes/_template.md`):
  - `title`: in quotes if it contains an apostrophe, e.g. `"Waltraud's Citrus Salad"`.
  - `from`: `Bayliss` or `Paseman`. This is the kitchen it's listed under.
  - `credit`: the person it came from, as the family calls them (`Mommy`, `Aunt B`, `Bill`).
  - `category`: exactly one of `Appetizers and Snacks`, `Main Dishes`, `Side Dishes`,
    `Desserts`, `Beverages`.
  - `tags`: occasions and other useful words, lowercase, e.g. `[thanksgiving, christmas]`.
    `[]` if none.
  - `serves`, `time`: free text, may be blank.
  - `status`: `draft` while being written down, `done` when it's final. Only `done`
    recipes go into the printed book; drafts show on the site marked "in progress".
  - `archive`: `true` puts the recipe in **The Archive**: dishes from the family's history that
    were made and written down but aren't part of everyday or holiday cooking (Katherine
    didn't really grow up eating them). They get their own section at the end of the home page
    and their own final part in the PDF. Leave it out, or set `false`, for everything else.
    Only Rod or Katherine decide what goes in; don't move recipes there on your own judgment.
  - `source`: only for recipes from another book, e.g. `"Paseman Family Cookbook (2012), page 47"`.
  - `photos`: list of photo file names, first one is the main photo. `[]` if none.
- **Body**, in this order:
  1. The story: a short paragraph about who makes it and where it came from, with no heading.
  2. `## Ingredients`: a `- ` bullet list. Sub-groups get a bold line of their own,
     e.g. `**For the brine**`, followed by their bullets.
  3. `## Preparation`: a numbered list. A step may start with a bold lead-in, e.g.
     `1. **Brine:** ...`.
  4. `## Notes`: bullets. **Lessons from a particular time the dish was made go here, dated**,
     e.g. `- **Thanksgiving 2026:** brined 48h, too salty at the drumsticks. Try 36h.`
     Add new dated notes at the end. Never delete or rewrite earlier ones; they are the
     family's history of the dish.
- Write fractions as `1/2`, `1 1/2`. The site turns them into ½ and 1½ by itself.
- Link to another recipe with `[[file-name|Display Text]]`, e.g.
  `[[turkey-gravy-and-carcass-stock|Turkey Gravy and Carcass Stock]]`.
- Keep the family's voice. Clean up spelling and obvious typos, but don't rewrite stories,
  quotes, or how someone describes their own recipe. For recipes from the 2012 book, keep the
  original wording.

## Photos

The site is **public**. Photos must never carry location (GPS) data.

- All photos go in `recipes/images/`, named `<recipe-file-name>_<description>.jpg`:
  - Exactly one underscore, between the recipe name and the description.
  - Description: lowercase words joined with hyphens. Start with the year when known,
    e.g. `2026-carved`, `2006-sabrina-age-14`. It becomes the caption ("2006 · Sabrina age 14").
  - Reserved descriptions: `card` (or `card-front` / `card-back`) for a scan of a handwritten
    recipe card, and `book-2012` for a photo from the 2012 Paseman cookbook.
- To add a photo, **always** use the script. It converts (including iPhone HEIC), turns the
  photo upright, shrinks it to at most 2400px, strips all metadata including GPS, names it,
  and adds it to the recipe's `photos:` list:
  `npm run add-photo -- <path-to-photo> <recipe-file-name> <description>`
- `npm run photos` tidies anything already in `recipes/images` that isn't compliant.
  `npm run photos -- --check` only reports. The deploy workflow runs the tidy step too, but
  anything pushed to GitHub stays in its history, so tidy photos **before** committing.
- To show a photo inside the method or notes: `![Caption](images/<file>.jpg)`.

## Building and checking

```
npm install
npm start          # preview at http://localhost:8080, rebuilds as you edit
npm run build      # site into _site/
npm run pdf        # after build: _site/pdf/*.pdf (needs Chrome from puppeteer)
```

After editing recipes, run `npm run build` and check it finishes with no errors. After a
change to the book layout, also run `npm run pdf` and confirm that every contents entry has a
page number (the script warns when one doesn't).

## Publishing

Pushing to `main` publishes the site automatically (`.github/workflows/deploy.yml`): it tidies
photos, builds the site and the PDFs, and deploys to GitHub Pages. Commit messages should say
what changed in plain words, e.g. "Add Thanksgiving 2026 notes to the sous vide turkey".
