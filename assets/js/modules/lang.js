/* ============================================================
   MODULE — language toggle
   English by default. The button flips English ⇄ தமிழ். No "system"
   concept — language has no OS-level signal to follow, unlike theme.
   Toggling triggers a full reload: render.js and friends only run
   once at boot, so a reload (picking the new language up via the
   no-flash <head> script, same as theme) is simpler and safer than
   trying to re-bind everything live.
   ============================================================ */
Vim.register("lang", function (ctx) {
  var btn = ctx.$("[data-lang-toggle]");
  if (!btn) return;

  var KEY = "vim-lang";

  function stored() {
    try { return localStorage.getItem(KEY) === "ta" ? "ta" : "en"; }
    catch (e) { return "en"; }
  }
  function render(lang) {
    btn.textContent = lang === "ta" ? "EN" : "த";
    btn.setAttribute("aria-label", ctx.t(lang === "ta" ? "lang.toggle.ta" : "lang.toggle.en"));
  }

  render(ctx.lang);
  btn.addEventListener("click", function () {
    var next = stored() === "ta" ? "en" : "ta";
    try {
      if (next === "en") localStorage.removeItem(KEY); else localStorage.setItem(KEY, next);
    } catch (e) {}
    location.reload();
  });
});
