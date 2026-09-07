/* ============================================================
   MODULE — dockswipe
   Swipe left/right on the bottom dock nav to move to the next
   or previous page, in the same order the dock already shows
   them in. Pairs with the cross-document View Transition rules
   in components.css (search "dock swipe transition") for the
   slide animation — this module only handles the gesture and
   picks the direction; the actual slide is pure CSS, and simply
   doesn't run for a plain click/tap or under reduced motion.

   Touch/pen only — a mouse drag on the dock shouldn't navigate.
   No wrap-around: swiping past the first or last page does
   nothing, same as a disabled "next" button would.
   ============================================================ */
Vim.register("dockswipe", function (ctx) {
  var dock = ctx.$("[data-dock]");
  if (!dock) return;

  var THRESHOLD = 56;   /* px of horizontal travel before it counts as a swipe */
  var startX = 0, startY = 0, tracking = false, dragging = false;

  function here() {
    var p = location.pathname.split("/").pop();
    return (!p || p.indexOf(".html") === -1) ? "index.html" : p;
  }
  function pageOrder() {
    return ctx.$$(".dock__link, .dock__cta", dock).map(function (a) {
      return a.getAttribute("href");
    });
  }
  function go(step) {
    var list = pageOrder();
    var idx = list.indexOf(here());
    if (idx === -1) return;
    var target = list[idx + step];
    if (!target) return;   /* first/last page — no wrap */
    try { sessionStorage.setItem("vim-nav-dir", step > 0 ? "fwd" : "back"); } catch (e) {}
    document.documentElement.setAttribute("data-nav-dir", step > 0 ? "fwd" : "back");
    location.href = target;
  }

  dock.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") return;
    startX = e.clientX; startY = e.clientY;
    tracking = true; dragging = false;
  }, { passive: true });

  dock.addEventListener("pointermove", function (e) {
    if (!tracking) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (!dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) dragging = true;
  }, { passive: true });

  dock.addEventListener("pointerup", function (e) {
    if (!tracking) return;
    tracking = false;
    if (!dragging) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) < THRESHOLD) return;
    go(dx < 0 ? 1 : -1);   /* swipe left = next page, swipe right = previous */
  }, { passive: true });

  dock.addEventListener("pointercancel", function () { tracking = false; dragging = false; });

  /* clear the direction flag once the incoming page has finished
     transitioning in, so a later plain click doesn't inherit it */
  if ("onpagereveal" in window) {
    window.addEventListener("pagereveal", function (e) {
      if (e.viewTransition) {
        e.viewTransition.finished.finally(function () {
          document.documentElement.removeAttribute("data-nav-dir");
        });
      }
    });
  } else {
    setTimeout(function () { document.documentElement.removeAttribute("data-nav-dir"); }, 700);
  }
});
