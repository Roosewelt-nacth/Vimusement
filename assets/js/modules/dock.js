/* ============================================================
   MODULE — dock (bottom floating navigation)
   • minimises (labels collapse, capsule contracts) while the
     page scrolls DOWN; springs back open on scroll UP or when
     near the top of the page
   • highlights the section currently in view
   Markup: <nav class="dock" data-dock> … <a class="dock__link" href="#id">
   ============================================================ */
Vim.register("dock", function (ctx) {
  var dock = ctx.$("[data-dock]");
  if (!dock) return;

  /* ---- minimise on scroll-down ---- */
  var lastY = window.scrollY;
  var ticking = false;
  var IDLE_MS = 900;
  var idleTimer;

  function update() {
    var y = Math.max(0, window.scrollY);
    var delta = y - lastY;
    var nearTop = y < 120;
    var nearBottom = (window.innerHeight + y) >= (document.body.scrollHeight - 120);

    if (nearTop || nearBottom) {
      dock.removeAttribute("data-min");
    } else if (delta > 4) {
      dock.setAttribute("data-min", "");          // scrolling down → shrink
    } else if (delta < -4) {
      dock.removeAttribute("data-min");           // scrolling up → grow
    }

    lastY = y;
    ticking = false;

    // if the user stops scrolling, re-open after a beat
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { dock.removeAttribute("data-min"); }, IDLE_MS);
  }

  addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();

  /* ---- active-section highlight ---- */
  var links = ctx.$$('.dock__link[href^="#"]', dock).filter(function (a) {
    return a.getAttribute("href").length > 1;
  });
  var map = {};
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute("href").slice(1));
    if (el) map[el.id] = a;
  });
  if (!Object.keys(map).length || !("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      if (map[en.target.id]) map[en.target.id].setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
});
