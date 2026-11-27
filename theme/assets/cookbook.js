// Small enhancements; every page works without them.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const base = document.querySelector('link[rel="stylesheet"]').getAttribute("href").replace(/assets\/cookbook\.css$/, "");

  // ---- Printing
  $$('[data-action="print"]').forEach((b) => b.addEventListener("click", () => window.print()));

  // ---- Recipe page: keep the screen awake, tick off ingredients, mark the current step
  const wake = $('[data-action="wake"]');
  if (wake && "wakeLock" in navigator) {
    let lock = null;
    wake.hidden = false;
    const set = async (on) => {
      try {
        if (on) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; render(); }); }
        else if (lock) { await lock.release(); lock = null; }
      } catch { lock = null; }
      render();
    };
    const render = () => { wake.classList.toggle("is-on", !!lock); wake.textContent = lock ? "Screen stays on" : "Keep screen on"; };
    wake.addEventListener("click", () => set(!lock));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && wake.classList.contains("is-on") && !lock) set(true); });
  }
  if (document.body.classList.contains("page-recipe")) {
    $$(".recipe-ingredients li").forEach((li) => li.addEventListener("click", (e) => { if (!e.target.closest("a")) li.classList.toggle("is-done"); }));
    $$(".recipe-method ol > li").forEach((li) =>
      li.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const was = li.classList.contains("is-current");
        $$(".recipe-method li.is-current").forEach((x) => x.classList.remove("is-current"));
        if (!was) li.classList.add("is-current");
      }),
    );
  }

  // ---- Photos: tap to see full size (without JavaScript the link opens the image)
  const zooms = $$("a.zoom");
  if (zooms.length && typeof HTMLDialogElement === "function") {
    const box = document.createElement("dialog");
    box.className = "lightbox";
    const big = document.createElement("img");
    box.append(big);
    document.body.append(box);
    box.addEventListener("click", () => box.close());
    zooms.forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        big.src = a.href;
        big.alt = a.querySelector("img")?.alt || "";
        box.showModal();
      }),
    );
  }

  // ---- Home page: search and filters
  const search = $("#search");
  if (search) {
    const entries = $$(".entry");
    const status = $("#finder-status");
    const params = new URLSearchParams(location.search);
    const state = { q: params.get("q") || "", family: params.get("family") || "", tag: params.get("tag") || "" };
    search.value = state.q;

    const apply = () => {
      const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      for (const e of entries) {
        const ok =
          (!state.family || e.dataset.family === state.family) &&
          (!state.tag || e.dataset.tags.split(",").includes(state.tag)) &&
          words.every((w) => e.dataset.search.includes(w));
        e.hidden = !ok;
        if (ok) n++;
      }
      $$(".chapter").forEach((c) => (c.hidden = !$$(".entry", c).some((e) => !e.hidden)));
      $$(".cookbook-section").forEach((s) => (s.hidden = !$$(".entry", s).some((e) => !e.hidden)));
      $$("[data-family]").forEach((b) => b.tagName === "BUTTON" && b.classList.toggle("is-on", b.dataset.family === state.family));
      $$("[data-tag]").forEach((b) => b.classList.toggle("is-on", b.dataset.tag === state.tag));
      const filtered = words.length || state.family || state.tag;
      status.textContent = filtered ? (n ? `${n} recipe${n === 1 ? "" : "s"}` : "No recipes match.") : "";
      const qs = new URLSearchParams(Object.entries(state).filter(([, v]) => v)).toString();
      history.replaceState(null, "", qs ? `?${qs}${location.hash}` : location.pathname + location.hash);
    };
    search.addEventListener("input", () => { state.q = search.value; apply(); });
    $$("button[data-family]").forEach((b) => b.addEventListener("click", () => { state.family = b.dataset.family; apply(); }));
    $$("button[data-tag]").forEach((b) => b.addEventListener("click", () => { state.tag = state.tag === b.dataset.tag ? "" : b.dataset.tag; apply(); }));
    apply();

    // Choose recipes to print
    const toggle = $("#pick-toggle");
    const go = $("#pick-print");
    const bar = $(".print-bar");
    const picked = () => $$(".entry-pick input:checked").map((i) => i.value);
    const update = () => {
      const p = picked();
      go.hidden = !p.length;
      go.textContent = `Print ${p.length} selected`;
      go.href = `${base}book/?r=${p.join(",")}`;
    };
    toggle.addEventListener("click", () => {
      const on = document.body.classList.toggle("picking");
      toggle.textContent = on ? "Done choosing" : "Choose recipes to print";
      bar.classList.toggle("is-sticky", on);
      if (on) $(".contents").scrollIntoView({ behavior: "smooth" });
    });
    $$(".entry-pick input").forEach((i) => i.addEventListener("change", update));
  }

  // ---- Book: ?r=slug,slug prints only those recipes
  if (document.body.classList.contains("page-book")) {
    const want = (new URLSearchParams(location.search).get("r") || "").split(",").filter(Boolean);
    if (want.length) {
      document.body.classList.add("is-selection");
      const articles = new Map($$("article.recipe").map((a) => [a.dataset.slug, a]));
      $$(".book-cover, .book-toc, .book-part, .book-chapter, .book-extras").forEach((el) => el.remove());
      $$("article.recipe").forEach((a) => a.remove());
      want.forEach((slug) => { const a = articles.get(slug); if (a) document.body.appendChild(a); });
      const first = $("article.recipe");
      if (first) first.style.breakBefore = "auto";
      document.title = want.length === 1 && first ? `${$(".recipe-title", first).textContent} · Print` : `${want.length} recipes · Print`;
    }
  }
})();
