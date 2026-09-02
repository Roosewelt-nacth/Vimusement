/* ============================================================
   MODULE — theme toggle
   No-flash init lives inline in each page's <head>. This wires
   the optional toggle button [data-theme-toggle].
   ============================================================ */
Vim.register("theme", function (ctx) {
  var btn = ctx.$("[data-theme-toggle]");
  if (!btn) return;

  var KEY = "vim-theme";
  function current() {
    return document.documentElement.getAttribute("data-theme")
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function apply(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    btn.setAttribute("aria-label", mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
  btn.addEventListener("click", function () {
    apply(current() === "dark" ? "light" : "dark");
  });
});
