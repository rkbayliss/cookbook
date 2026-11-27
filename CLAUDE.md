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
  rkbayliss/            Rod and Katherine's own recipes (what they cook together now)
  bayliss/              Recipes from Rod's family, the Bayliss side
  paseman/              Recipes from Katherine's family, the Paseman side
  images/               All recipe photos, flat, named <recipe-file-name>_<description>.jpg
forewords/              Section forewords, e.g. magnificent-cakes.md (see below)
theme/                  Site design: templates (_includes, pages), CSS/JS (assets), helpers (lib)
scripts/                photos.js (photo tidying), build-images.js, build-pdf.js
```

## Recipe files

- **File name**: lowercase, hyphenated, no apostrophes, `.md`, e.g. `aunt-bs-pot-roast.md`.
  The file name is the recipe's web address (`/aunt-bs-pot-roast/`) and the prefix of its
  photos. **Don't rename an existing recipe**: it breaks links and photo names.
- **Folder**: `recipes/rkbayliss/`, `recipes/bayliss/` or `recipes/paseman/`, matching `from:`.
- **Front matter**, in this order (see `recipes/_template.md`):
  - `title`: in quotes if it contains an apostrophe, e.g. `"Waltraud's Citrus Salad"`.
  - `from`: `RKBayliss`, `Bayliss` or `Paseman`. This is the kitchen it's listed under:
    RKBayliss for recipes that are Rod and Katherine's own, Bayliss and Paseman for the ones
    that came from their families.
  - `credit`: the person it came from, as the family calls them (`Mommy`, `Aunt B`, `Bill`).
  - `category`: exactly one of `Weeknight Mains`, `Weeknight Sides`, `Holidays`,
    `Special Occasion`, `Desserts`, `Magnificent Cakes`, `Drinks`. Magnificent Cakes is for
    showpiece layer cakes; other sweets go in Desserts. Pick by how the dish is mainly used: anything
    made on ordinary weeknights is Weeknight, even if it also appears at a holiday (give it the
    holiday tag instead). Holidays is for dishes made for a holiday (Thanksgiving, Christmas,
    St. Patrick's Day, New Year's). Special Occasion is for birthdays, guests, weekend
    breakfasts like the Dutch baby and crepes, and appetizers. A recipe made to go into another
    one (ragu, polpette, preserved lemons) takes that dish's category.
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
  - `story_by`: who wrote the original description (the first paragraph), e.g. `Bill`. It
    shows as "From Bill" above it. Blank if there isn't an original description, or if
    Rod and Katherine wrote it.
  - `photos`: list of photo file names, first one is the main photo. `[]` if none.
- **Body**: `recipes/_template.md` is the model, laid out like `potato-salad.md`: a signed
  `## From Katherine` (or Rod, or Rod and Katherine) description, `## Ingredients & Equipment`
  (equipment first), numbered `## Preparation` steps that each start with a bold lead-in
  (`1. **Boil the potatoes:** ...`), and `## Notes`. Every section in the template is lorem
  ipsum: replace it all when making a new recipe, and never leave lorem ipsum in a recipe
  (it would show on the public site). A section with nothing to say yet is left empty instead.
  In this order:
  1. The original description, with no heading: in its writer's own words (for the 2012-book
     recipes, Bill's). Never rewrite it, and name its writer in `story_by`.
  2. `## From Rod and Katherine`: Rod and Katherine's own description: what the dish means to
     them, when they make it, and who they make it for. Every recipe has this heading, and
     it's left empty (hidden on the site) until they write something. When only one of them
     is speaking ("I"), rename the heading to `## From Katherine` or `## From Rod`; any
     `## From <name>` heading before Ingredients is shown as a signed description. Write
     only what they tell you, in their words; don't invent memories.
  3. `## Ingredients` (a heading that starts with "Ingredients", like
     `## Ingredients & Equipment`, also works): a `- ` bullet list. Sub-groups get a bold line of their own,
     e.g. `**For the brine**`, followed by their bullets.
  4. `## Preparation`: a numbered list. A step may start with a bold lead-in, e.g.
     `1. **Brine:** ...`.
  5. `## Notes`: bullets. **Lessons from a particular time the dish was made go here, dated**,
     e.g. `- **Thanksgiving 2026:** brined 48h, too salty at the drumsticks. Try 36h.`
     Add new dated notes at the end. Never delete or rewrite earlier ones; they are the
     family's history of the dish.
  6. `## Gallery` (optional): sentimental or contextual photos and words, shown after the
     Notes in two columns. Each paragraph is one item: a photo line
     `![Alt text](images/<file>.jpg)`, optionally with words on the very next line (they show
     under the photo), or a paragraph of words on its own (shown as a small card). A photo
     written into the Gallery appears only there, never as the main photo. Photos in
     `photos:` that aren't placed anywhere else also join the end of the Gallery.
- Write fractions as `1/2`, `1 1/2`. The site turns them into ½ and 1½ by itself.
- Link to another recipe with `[[file-name|Display Text]]`, e.g.
  `[[turkey-gravy-and-carcass-stock|Turkey Gravy and Carcass Stock]]`.
- Keep the family's voice. Clean up spelling and obvious typos, but don't rewrite stories,
  quotes, or how someone describes their own recipe. For recipes from the 2012 book, keep the
  original wording.

## About page

`about.md` is the "About the cookbook" page, linked from the top of the home page. It has a
`## From Katherine` section (Katherine's own words; only write what she gives you) and a
`## From the 2012 Paseman Family Cookbook` section (Bill's original introduction, copied
exactly). An empty section is hidden.

`pantry.md` (The Paseman Bayliss Pantry) and `make-your-own.md` (Make Your Own Cookbook) work
the same way: each `## ` heading is a section, and an empty one is hidden. On the pantry page,
every bullet is one item, written `- **Name** a few words about it` (no dash or colon after the
bold name); sections are free, e.g. `## Always in the pantry`, `## Equipment we love`. These
pages and About each have an Edit button that opens the file on GitHub.

**Section forewords** live in `forewords/`, one file per section, e.g. `forewords/magnificent-cakes.md`
(copy it for a new one: set `title`, `category` to the section's exact name, and `permalink:
/section/<slug>/`). A section with a foreword gets a clickable heading on the home page, and its
page lists the section's recipes after the text. Write only Katherine's (or Rod's) own words.

## Photos

The site is **public**. Photos must never carry location (GPS) data.

- All photos go in `recipes/images/`, named `<recipe-file-name>_<description>.jpg`:
  - Exactly one underscore, between the recipe name and the description.
  - Description: lowercase words joined with hyphens. Start with the year when known,
    e.g. `2026-carved`, `2006-sabrina-age-14`. It becomes the caption ("2006 · Sabrina age 14").
  - The description decides where the photo appears on the recipe page:
    - `card` (or `card-front` / `card-back`): the original recipe card or sheet. Shown
      uncropped, pinned beside the descriptions; tap to read it full size.
    - `step-3` (or `step-3-folding-the-dough`, which also becomes the caption): a photo for
      step 3, placed at the end of that step. Several per step are fine. **When you renumber
      a recipe's steps, rename its step photos to match** (and update `photos:`).
    - Anything else: the first one in `photos:` is the dish photo across the top of the
      page; the rest go in the Gallery after the Notes (people, moments, the table). Photos
      written into the `## Gallery` section are never the dish photo, and can have words
      under them there.
    - `book-2012`: a photo from the 2012 Paseman cookbook (shown in the Gallery).
  - Every photo must be listed in the recipe's `photos:`; `add-photo` does that for you.
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
