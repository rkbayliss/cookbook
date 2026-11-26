// Tells the site builder how to turn every recipe file in this folder into a page.
// You never need to edit this file to add or change a recipe.
export default {
  layout: "recipe.njk",
  permalink: (data) => `/${data.page.fileSlug}/`,
  eleventyComputed: {
    family: (data) => data.from || data.page.filePathStem.split("/")[2],
  },
};
