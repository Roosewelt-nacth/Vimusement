/* ============================================================
   MODULE — theme toggle
   Default is ALWAYS the visitor's OS setting (prefers-color-scheme).
   The button cycles: System → Light → Dark → System.
   "System" stores nothing and follows the OS live; Light/Dark pin it.
   The no-flash init in each page <head> only applies a *pinned* choice.
   ============================================================ */
Vim.register("theme", function (ctx) {
  var btn = ctx.$("[data-theme-toggle]");
  if (!btn) return;

  var KEY = "vim-theme";
  var mq = matchMedia("(prefers-color-scheme: dark)");

  var ICON = {
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v3"/>',
    light:  '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 3.6 3.6M20.4 20.4 19 19M19 5l1.4-1.4M3.6 20.4 5 19"/>',
    dark:   '<path d="M20.5 13A8.5 8.5 0 1 1 11 3.5 6.6 6.6 0 0 0 20.5 13Z"/>'
  };
  var NEXT  = { system: "light", light: "dark", dark: "system" };
  var LABEL = { system: "Theme: follows your system. Tap for light.",
                light:  "Theme: light. Tap for dark.",
                dark:   "Theme: dark. Tap to follow your system." };

  function stored() {
    try { var v = localStorage.getItem(KEY); return (v === "light" || v === "dark") ? v : "system"; }
    catch (e) { return "system"; }
  }
  function render(mode) {
    if (mode === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", mode);
    btn.setAttribute("aria-label", LABEL[mode]);
    btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICON[mode] + '</svg>';
  }
  function set(mode) {
    try { if (mode === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
    render(mode);
  }

  render(stored());
  btn.addEventListener("click", function () { set(NEXT[stored()]); });

  // in "system" mode, reflect a live OS theme change (CSS already repaints;
  // this just keeps the button's label honest)
  var onOS = function () { if (stored() === "system") render("system"); };
  if (mq.addEventListener) mq.addEventListener("change", onOS);
  else if (mq.addListener) mq.addListener(onOS);
});
