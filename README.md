# The Family Cookbook

Recipes from the Bayliss and Paseman kitchens. Every recipe is a text file in `recipes/`, and
this repository is the master copy. The website and the printable PDFs are generated from
these files automatically.

## Reading

- **The website** is best on a phone in the kitchen. On a recipe page you can tap ingredients
  to tick them off, tap a step to mark your place, and turn on *Keep screen on*.
- **PDFs**: the whole book, or one kitchen, are linked at the bottom of the home page.
  *Choose recipes to print* lets you tick any recipes and print just those.

## Editing

| How | Best for |
|---|---|
| Ask Claude (claude.ai/code, or Claude Code on a laptop) | New recipes, "add what we learned today", anything with photos |
| The **Edit** button on any recipe page | Quick fixes: a typo, a temperature |
| github.com → `recipes/` → a file → pencil icon | Same as above |

When a change is saved to `main`, the site updates itself within a few minutes.

**To add today's lessons**, add a dated bullet at the end of the recipe's Notes:

```markdown
- **Thanksgiving 2026:** pulled the breasts at 130°F after 14h, perfect. Legs needed the full 24h.
```

**New recipe**: copy `recipes/_template.md` into `recipes/bayliss/` or `recipes/paseman/`
with a lowercase-hyphenated name, like `grandmas-apple-pie.md`, and fill it in.

**Photos**: the site is public, and phone photos record where they were taken. Ask Claude
to add them, or turn off location when you share from the phone (iPhone: *Share → Options →
Location off*). See `CLAUDE.md` for naming rules.

The full conventions are in [`CLAUDE.md`](CLAUDE.md). Both of your Claudes read it before
editing anything.

## Working on the site itself

```
npm install
npm start        # preview at http://localhost:8080
npm run build    # build the site into _site/
npm run pdf      # build the PDFs (after build)
```
