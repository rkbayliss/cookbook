// Renders the printable book pages to PDF with headless Chrome. Run after `npm run build`:
//   npm run pdf  ->  _site/pdf/family-cookbook.pdf, bayliss-kitchen.pdf, paseman-kitchen.pdf
//
// Chrome can't fill in table-of-contents page numbers itself, so each book is printed twice:
// the first pass's PDF bookmarks tell us which page every recipe starts on, those numbers are
// written into the contents, and the second pass is the final PDF.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import puppeteer from "puppeteer";
import { PDFDocument, PDFDict, PDFName, PDFString, PDFHexString, PDFArray, PDFRef } from "pdf-lib";

const SITE = path.resolve("_site");
const PREFIX = (process.env.PATH_PREFIX || "/").replace(/\/?$/, "/");
const EDITIONS = [
  ["book/", "family-cookbook.pdf"],
  ["book/bayliss/", "bayliss-kitchen.pdf"],
  ["book/paseman/", "paseman-kitchen.pdf"],
];
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

// A tiny static server, so the pages load exactly as they would on the live site.
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!p.startsWith(PREFIX)) return res.writeHead(404).end();
  p = path.join(SITE, p.slice(PREFIX.length));
  if (!p.startsWith(SITE)) return res.writeHead(403).end();
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}${PREFIX}`;

// Chrome drops the space where a long title wraps, so whitespace is ignored when matching.
const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();

// Walks the PDF's bookmark tree and returns [{ title, page }] in document order.
async function bookmarks(pdfBytes) {
  const doc = await PDFDocument.load(pdfBytes);
  const pageIndex = new Map(doc.getPages().map((p, i) => [p.ref.toString(), i + 1]));
  const out = [];
  const lookup = (o) => (o instanceof PDFRef ? doc.context.lookup(o) : o);
  const walk = (item) => {
    for (let node = lookup(item); node instanceof PDFDict; node = lookup(node.get(PDFName.of("Next")))) {
      const t = node.get(PDFName.of("Title"));
      const title = t instanceof PDFString || t instanceof PDFHexString ? t.decodeText() : "";
      let dest = lookup(node.get(PDFName.of("Dest")));
      if (!dest) {
        const action = lookup(node.get(PDFName.of("A")));
        dest = action instanceof PDFDict ? lookup(action.get(PDFName.of("D"))) : null;
      }
      const ref = dest instanceof PDFArray ? dest.get(0) : null;
      out.push({ title, page: ref ? pageIndex.get(ref.toString()) : undefined });
      if (node.get(PDFName.of("First"))) walk(node.get(PDFName.of("First")));
    }
  };
  const outlines = lookup(doc.catalog.get(PDFName.of("Outlines")));
  if (outlines instanceof PDFDict) walk(outlines.get(PDFName.of("First")));
  return out;
}

fs.mkdirSync(path.join(SITE, "pdf"), { recursive: true });
const browser = await puppeteer.launch({ args: process.env.CI ? ["--no-sandbox"] : [] });
try {
  for (const [url, out] of EDITIONS) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.warn(`  page error: ${e.message}`));
    await page.goto(origin + url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    const pdfOptions = { preferCSSPageSize: true, printBackground: true, outline: true, tagged: true };

    // Pass 1: find the page each recipe starts on.
    const marks = await bookmarks(await page.pdf(pdfOptions));
    const pages = {};
    for (const m of marks) if (m.page && !(norm(m.title) in pages)) pages[norm(m.title)] = m.page;

    // Write the numbers into the contents (they sit in space already reserved, so nothing moves).
    const missing = await page.evaluate((pages) => {
      const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
      let missing = 0;
      for (const a of document.querySelectorAll(".toc-list a")) {
        const n = pages[norm(a.querySelector(".toc-title").textContent)];
        a.querySelector(".toc-page").textContent = n ?? "";
        if (!n) missing++;
      }
      return missing;
    }, pages);
    if (missing) console.warn(`  ${missing} contents entr${missing === 1 ? "y" : "ies"} without a page number`);

    // Pass 2: the final PDF.
    const file = path.join(SITE, "pdf", out);
    await page.pdf({ ...pdfOptions, path: file });
    const count = (await PDFDocument.load(fs.readFileSync(file))).getPageCount();
    console.log(`PDF: ${path.relative(".", file)} (${count} pages)`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
