/* ============================================================
   MODULE — language toggle
   English by default. The control flips English ⇄ தமிழ். No "system"
   concept — language has no OS-level signal to follow, unlike theme.
   Toggling triggers a full reload: render.js and friends only run
   once at boot, so a reload (picking the new language up via the
   no-flash <head> script, same as theme) is simpler and safer than
   trying to re-bind everything live.

   Two representations share the same [data-lang-toggle] hook and
   both get wired up identically here — which one is actually visible
   at a given screen width is pure CSS (see .lang-toggle--bar /
   .dock__more-lang in components.css): the icon circle next to the
   theme toggle on wider screens, and a plain-language row inside the
   dock's "More" dropdown on narrow phones, where the circle doesn't
   fit the bar without crowding everything else.
   ============================================================ */
Vim.register("lang", function (ctx) {
  var btns = ctx.$$("[data-lang-toggle]");
  if (!btns.length) return;

  var KEY = "vim-lang";

  function stored() {
    try { return localStorage.getItem(KEY) === "ta" ? "ta" : "en"; }
    catch (e) { return "en"; }
  }
  function render(lang) {
    var fullLabel = ctx.t(lang === "ta" ? "lang.toggle.ta" : "lang.toggle.en");
    btns.forEach(function (btn) {
      btn.setAttribute("aria-label", fullLabel);         // screen readers get the full sentence
      var textEl = btn.querySelector("[data-lang-toggle-text]");
      if (textEl) textEl.textContent = ctx.t("lang.menu.label"); // dropdown row — just "Language"
      else btn.textContent = lang === "ta" ? "EN" : "த";          // bar circle — short glyph
    });
  }
  function toggle() {
    var next = stored() === "ta" ? "en" : "ta";
    try {
      if (next === "en") localStorage.removeItem(KEY); else localStorage.setItem(KEY, next);
    } catch (e) {}
    location.reload();
  }

  render(ctx.lang);
  btns.forEach(function (btn) { btn.addEventListener("click", toggle); });
});
