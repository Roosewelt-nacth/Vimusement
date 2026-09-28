/* ============================================================
   MODULE — cinebeam  (movies.html)
   "Now showing": point at a poster (or tap it on a phone) and the
   room dims while a projector beam, dust drifting in it, falls from
   the top of the section onto that poster. Voting tears a small
   ticket stub in two. Runs after moviespage.js has drawn the wall.
   ============================================================ */
Vim.register("cinebeam", function (ctx) {
  var sec = ctx.$(".cine-lineup"), wall = ctx.$("[data-cine-posters]");
  if (!sec || !wall) return;
  var dim = document.createElement("div"); dim.className = "cine-dim"; dim.setAttribute("aria-hidden", "true");
  var beam = document.createElement("div"); beam.className = "cine-beam"; beam.setAttribute("aria-hidden", "true");
  var lens = document.createElement("span"); lens.className = "cine-lens"; lens.setAttribute("aria-hidden", "true");
  sec.appendChild(dim); sec.appendChild(beam); sec.appendChild(lens);
  var lit = null, off = null;

  function aim(li) {
    var fr = li.querySelector(".cine-poster__frame") || li;
    var s = sec.getBoundingClientRect(), r = fr.getBoundingClientRect();
    var ax = s.width / 2, ay = 18;                               // the projector: top centre of the section
    var l = r.left - s.left, t = r.top - s.top, rr = l + r.width, b = t + r.height;
    beam.style.clipPath = "polygon(" + [
      [ax - 5, ay], [ax + 5, ay], [rr, t], [rr, b], [l, b], [l, t]
    ].map(function (p) { return p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px"; }).join(",") + ")";
    beam.style.setProperty("--ax", ax + "px"); beam.style.setProperty("--ay", ay + "px");
    lens.style.left = ax + "px"; lens.style.top = ay + "px";
  }
  function show(li) {
    clearTimeout(off);
    if (lit && lit !== li) lit.classList.remove("is-lit");
    lit = li; li.classList.add("is-lit"); aim(li);
    sec.classList.add("is-showing");
  }
  function hide() {
    off = setTimeout(function () {
      sec.classList.remove("is-showing");
      if (lit) lit.classList.remove("is-lit"); lit = null;
    }, 120);
  }
  function posterOf(e) { var li = e.target.closest && e.target.closest(".cine-poster"); return li && wall.contains(li) ? li : null; }

  wall.addEventListener("pointerover", function (e) { if (e.pointerType === "mouse") { var li = posterOf(e); if (li) show(li); } });
  wall.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hide(); });
  wall.addEventListener("focusin", function (e) { var li = posterOf(e); if (li) show(li); });
  wall.addEventListener("focusout", hide);
  wall.addEventListener("click", function (e) {                   // touch: a tap on the art spotlights it
    if (e.target.closest(".cine-vote")) return;
    var li = posterOf(e); if (!li) return;
    if (lit === li && sec.classList.contains("is-showing")) hide(); else show(li);
  });
  document.addEventListener("pointerdown", function (e) { if (lit && !wall.contains(e.target)) hide(); });
  wall.addEventListener("scroll", function () { if (lit) aim(lit); }, { passive: true });
  addEventListener("resize", function () { if (lit) aim(lit); });

  /* voting tears a ticket */
  wall.addEventListener("click", function (e) {
    var btn = e.target.closest(".cine-vote__btn");
    if (!btn || ctx.reducedMotion) return;
    var r = btn.getBoundingClientRect();
    var t = document.createElement("div"); t.className = "cine-stub"; t.setAttribute("aria-hidden", "true");
    t.innerHTML = '<span class="cine-stub__a">ADMIT</span><span class="cine-stub__b">ONE</span>';
    t.style.left = (r.left + r.width / 2) + "px"; t.style.top = (r.top - 8) + "px";
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-torn"); });
    setTimeout(function () { t.remove(); }, 1400);
  }, true);
});
