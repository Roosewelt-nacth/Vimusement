/* ============================================================
   MODULE — crew carousel
   A "memories" slideshow for the Crew section.
   Config: VIM_YEAR.crew.photos = ["assets/img/2026/crew-1.jpg", ...]
           (or [{ src, alt }])  ·  VIM_YEAR.crew.caption
   Mount point: [data-crew-photo]
   • prev / next buttons · dots · swipe · arrow keys
   • gentle autoplay, paused on hover / focus / touch / reduced-motion
   ============================================================ */
Vim.register("crew", function (ctx) {
  var mount = ctx.$("[data-crew-photo]");
  if (!mount) return;

  var c = ctx.year.crew || {};
  var raw = c.photos && c.photos.length ? c.photos : (c.photo ? [c.photo] : []);
  var slides = raw.map(function (p, i) {
    return typeof p === "string"
      ? { src: p, alt: "Vimusement " + ctx.year.year + " crew — photo " + (i + 1) }
      : { src: p.src, alt: p.alt || "Vimusement " + ctx.year.year + " crew — photo " + (i + 1) };
  });

  if (!slides.length) {
    mount.classList.add("crew__photo--empty");
    mount.textContent = "crew photos → assets/img/" + ctx.year.year + "/  (set crew.photos)";
    return;
  }

  mount.classList.add("crew-carousel");
  mount.setAttribute("role", "region");
  mount.setAttribute("aria-roledescription", "carousel");
  mount.setAttribute("aria-label", "Crew photos");
  mount.setAttribute("tabindex", "0");

  var single = slides.length === 1;
  mount.innerHTML =
    '<div class="crew-carousel__viewport">' +
      '<ul class="crew-carousel__track">' +
        slides.map(function (s, i) {
          return '<li class="crew-carousel__slide" aria-hidden="' + (i !== 0) + '">' +
                   '<img src="' + s.src + '" alt="' + s.alt.replace(/"/g, "&quot;") + '" ' +
                        (i === 0 ? '' : 'loading="lazy" ') + 'draggable="false">' +
                 "</li>";
        }).join("") +
      "</ul>" +
    "</div>" +
    (single ? "" :
      '<button class="crew-carousel__nav crew-carousel__nav--prev" type="button" aria-label="Previous photo">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>' +
      "</button>" +
      '<button class="crew-carousel__nav crew-carousel__nav--next" type="button" aria-label="Next photo">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' +
      "</button>" +
      '<div class="crew-carousel__dots" role="tablist" aria-label="Choose photo">' +
        slides.map(function (_, i) {
          return '<button class="crew-carousel__dot" type="button" role="tab" aria-label="Photo ' + (i + 1) + '" aria-selected="' + (i === 0) + '"></button>';
        }).join("") +
      "</div>");

  if (single) return;

  var track = ctx.$(".crew-carousel__track", mount);
  var slideEls = ctx.$$(".crew-carousel__slide", mount);
  var dots = ctx.$$(".crew-carousel__dot", mount);
  var index = 0, timer = null;
  var reduce = ctx.reducedMotion;
  var DELAY = 5000;

  function go(n, userInitiated) {
    index = (n + slides.length) % slides.length;
    track.style.transform = "translateX(" + (-index * 100) + "%)";
    slideEls.forEach(function (el, i) { el.setAttribute("aria-hidden", String(i !== index)); });
    dots.forEach(function (d, i) { d.setAttribute("aria-selected", String(i === index)); });
    zoomActive();
    if (userInitiated) restart();
  }

  /* zoom the newly-active photo in each time it comes into view */
  function zoomActive() {
    if (reduce) return;
    var img = slideEls[index] && slideEls[index].querySelector("img");
    if (img && img.animate) {
      img.animate(
        [{ transform: "scale(1.12)" }, { transform: "scale(1)" }],
        { duration: 900, easing: "cubic-bezier(.22,.68,.32,1)" }
      );
    }
  }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  function start() { if (!reduce && !timer) timer = setInterval(next, DELAY); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  ctx.$(".crew-carousel__nav--prev", mount).addEventListener("click", function () { prev(); restart(); });
  ctx.$(".crew-carousel__nav--next", mount).addEventListener("click", function () { next(); restart(); });
  dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i, true); }); });

  mount.addEventListener("mouseenter", stop);
  mount.addEventListener("mouseleave", start);
  mount.addEventListener("focusin", stop);
  mount.addEventListener("focusout", start);
  mount.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { prev(); restart(); }
    else if (e.key === "ArrowRight") { next(); restart(); }
  });

  /* swipe */
  var x0 = null;
  mount.addEventListener("pointerdown", function (e) { x0 = e.clientX; stop(); });
  mount.addEventListener("pointerup", function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    x0 = null; start();
  });
  mount.addEventListener("pointercancel", function () { x0 = null; start(); });

  /* pause when off-screen · zoom the first photo in when it enters view */
  if ("IntersectionObserver" in window) {
    var seen = false;
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        if (!seen) { seen = true; zoomActive(); }
        start();
      } else {
        stop();
      }
    }, { threshold: 0.25 }).observe(mount);
  } else {
    start();
  }
});
