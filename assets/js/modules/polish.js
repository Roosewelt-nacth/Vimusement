/* ============================================================
   MODULE — polish  (site-wide finishing touches)
     1. a thin scroll-progress line across the top of the page
     2. a sliding indicator under the active dock link
   Section-title underline draw and cross-page fade are pure CSS
   (see components.css / base.css).
   ============================================================ */
Vim.register("polish", function (ctx) {
  var reduce = ctx.reducedMotion;

  /* ---- 1. scroll progress ------------------------------------- */
  (function () {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var doc = document.documentElement;
    var raf = 0;
    function paint() {
      raf = 0;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 4 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(paint); }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    paint();
  })();

  /* ---- 2. sliding dock indicator ----------------------------- */
  (function () {
    var links = ctx.$(".dock__links");
    if (!links) return;
    var ind = document.createElement("span");
    ind.className = "dock__indicator";
    ind.setAttribute("aria-hidden", "true");
    links.appendChild(ind);

    function place() {
      var a = links.querySelector(".dock__link[aria-current]");
      if (!a) { ind.style.opacity = "0"; return; }
      ind.style.opacity = "1";
      ind.style.width = a.offsetWidth + "px";
      ind.style.transform = "translateX(" + a.offsetLeft + "px)";
    }

    new MutationObserver(place).observe(links, {
      subtree: true, attributes: true, attributeFilter: ["aria-current"]
    });
    var dock = links.closest(".dock");
    if (dock) new MutationObserver(function () {
      // the capsule expands/contracts over ~0.26s; re-measure after it settles
      setTimeout(place, 300);
    }).observe(dock, { attributes: true, attributeFilter: ["data-min"] });
    addEventListener("resize", place, { passive: true });

    requestAnimationFrame(place);
    setTimeout(place, 250);            // after fonts / layout settle
    if (reduce) ind.style.transition = "opacity .15s";
  })();
});
