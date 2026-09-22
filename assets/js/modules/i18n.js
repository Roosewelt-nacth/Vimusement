/* ============================================================
   MODULE — i18n
   Swaps every [data-i18n] element's text (and [data-i18n-placeholder] /
   [data-i18n-aria-label] attributes) to the current language, via the
   ctx.t() dictionary in assets/js/strings.js. The English text stays
   in the markup itself, so nothing goes blank if this module is slow
   or fails — it only ever overwrites, never removes, English as a
   fallback. Runs before render.js so config-driven sections build on
   top of already-translated static chrome.
   ============================================================ */
Vim.register("i18n", function (ctx) {
  /* innerHTML, not textContent — a handful of dictionary strings carry
     light inline markup (<strong>/<em>/<b>), same as everywhere else in
     the codebase that builds HTML from trusted, developer-authored
     content (never from user input). */
  ctx.$$("[data-i18n]").forEach(function (el) {
    el.innerHTML = ctx.t(el.getAttribute("data-i18n"));
  });
  ctx.$$("[data-i18n-placeholder]").forEach(function (el) {
    el.setAttribute("placeholder", ctx.t(el.getAttribute("data-i18n-placeholder")));
  });
  ctx.$$("[data-i18n-aria-label]").forEach(function (el) {
    el.setAttribute("aria-label", ctx.t(el.getAttribute("data-i18n-aria-label")));
  });
  ctx.$$("[data-i18n-title]").forEach(function (el) {
    document.title = ctx.t(el.getAttribute("data-i18n-title"));
  });
  ctx.$$("[data-i18n-content]").forEach(function (el) {
    el.setAttribute("content", ctx.t(el.getAttribute("data-i18n-content")));
  });
});
