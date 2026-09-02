/* ============================================================
   VIMUSEMENT — entry point (loaded last)
   ============================================================ */
(function () {
  "use strict";
  function start() { window.Vim.boot(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
