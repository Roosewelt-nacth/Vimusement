/* ============================================================
   MODULE — creditsig
   The footer credit ("Curious who built this? Meet Austin →") with a
   little life in it, all quiet unless someone goes looking:
     1. "Austin" is a hand-written signature. The first time the footer is
        seen it writes itself, stroke by stroke (the word, then the t-bar and
        the i-dot), with a small gold nib on the tip of the ink leaving a short
        trail of sparks. Hover replays it.
     2. Press and hold the signature (long-press on phones): it flips up into
        a small card with photo, name, role, Instagram and the credits page.
        A normal tap still just opens the credits page.
     3. The hidden roll: tap the footer's small print 5 times quickly, or
        type "austin", for a short cinema-style end-credits roll.
   The signature is one hand-drawn pen path (no font), so the ink and the nib
   move together exactly.
   ============================================================ */
Vim.register("creditsig", function (ctx) {
  var link = ctx.$(".footer__secret");
  if (!link) return;
  var svg = link.querySelector(".footer__sign-name");
  var holder = link.querySelector(".footer__secret-text");
  if (!svg || !holder) return;
  var reduced = ctx.reducedMotion;
  var PHOTO = "assets/img/shared/austin-thumb-1.jpg";
  var IG = "https://www.instagram.com/___roosxwxlt___/?hl=en";

  /* ---------- 1 · the signature, drawn stroke by stroke, the nib riding the tip ---------- */
  var paths = [svg.querySelector(".sig-main"), svg.querySelector(".sig-bar"), svg.querySelector(".sig-dot")];
  if (!paths[0]) return;
  var lens = paths.map(function (p) { return p.getTotalLength(); });
  // [start, end] of each stroke as a share of the whole write: the word, a pause, the t-bar, the i-dot
  var PLAN = [[0, .8], [.84, .94], [.96, 1]], DUR = 2400;
  var nib = document.createElement("span"); nib.className = "footer__nib"; nib.setAttribute("aria-hidden", "true");
  holder.appendChild(nib);
  function setDraw(i, p) { paths[i].style.strokeDasharray = lens[i] + " " + lens[i]; paths[i].style.strokeDashoffset = (lens[i] * (1 - p)).toFixed(2); }
  function hideAll() { for (var i = 0; i < 3; i++) setDraw(i, 0); }
  function showAll() { for (var i = 0; i < 3; i++) setDraw(i, 1); }
  function tipAt(i, p) {                                        // the pen tip, in the holder's pixels
    var pt = paths[i].getPointAtLength(lens[i] * p), m = paths[i].getScreenCTM(), hb = holder.getBoundingClientRect();
    var q = new DOMPoint(pt.x, pt.y).matrixTransform(m);
    return { x: q.x - hb.left, y: q.y - hb.top };
  }
  var writing = false;
  function write() {
    if (writing) return;
    if (reduced) { showAll(); return; }
    writing = true; hideAll(); link.classList.add("is-signed");
    var t0 = performance.now(), lastInk = 0;
    nib.style.opacity = "1";
    (function step(now) {
      var T = Math.min(1, (now - t0) / DUR), active = -1, lp = 0;
      for (var i = 0; i < 3; i++) {
        var a0 = PLAN[i][0], a1 = PLAN[i][1], p = Math.max(0, Math.min(1, (T - a0) / (a1 - a0)));
        if (i === 0) p = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // the pen speeds up, then settles
        setDraw(i, p);
        if (T >= a0 && T <= a1) { active = i; lp = p; }
      }
      if (active >= 0) {
        var tip = tipAt(active, lp);
        nib.style.transform = "translate(" + tip.x.toFixed(1) + "px," + tip.y.toFixed(1) + "px)";
        nib.style.opacity = "1";
        if (now - lastInk > 34) { lastInk = now; ink(tip.x, tip.y); }
      } else nib.style.opacity = "0";                              // lifted between strokes
      if (T < 1) requestAnimationFrame(step);
      else { nib.style.opacity = "0"; showAll(); setTimeout(function () { writing = false; }, 300); }
    })(t0);
  }
  function ink(x, y) {
    var d = document.createElement("span"); d.className = "footer__ink"; d.setAttribute("aria-hidden", "true");
    d.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    d.style.setProperty("--dx", ((Math.random() - .5) * 9).toFixed(1) + "px");
    d.style.setProperty("--dy", (3 + Math.random() * 7).toFixed(1) + "px");
    holder.appendChild(d); setTimeout(function () { d.remove(); }, 800);
  }
  if (reduced || !("IntersectionObserver" in window)) showAll();
  else {
    hideAll();                                                     // hidden only once we know we can draw it
    new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(write, 250); } }, { threshold: 1 }).observe(link);
  }
  link.addEventListener("mouseenter", function () { if (link.classList.contains("is-signed")) write(); });

  /* ---------- 2 · press and hold: the signature card ---------- */
  var card = null, holdTimer = null, held = false;
  function openCard() {
    if (card) return;
    var r = link.getBoundingClientRect();
    card = document.createElement("div"); card.className = "sigcard"; card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "Austin Prince Roosewelt");
    card.innerHTML =
      '<button type="button" class="sigcard__x" aria-label="Close">&times;</button>' +
      '<img class="sigcard__photo" src="' + PHOTO + '" alt="">' +
      '<p class="sigcard__name">Austin Prince Roosewelt</p>' +
      '<p class="sigcard__role">' + ctx.t("credits.hero.role") + '</p>' +
      '<div class="sigcard__row">' +
        '<a class="sigcard__btn" href="' + IG + '" target="_blank" rel="noopener">Instagram</a>' +
        '<a class="sigcard__btn sigcard__btn--ghost" href="credits.html">Full credits</a>' +
      '</div>';
    var left = Math.max(12, Math.min(innerWidth - 292, r.left + r.width / 2 - 140));
    card.style.left = left + "px"; card.style.bottom = (innerHeight - r.top + 10) + "px";
    document.body.appendChild(card);
    requestAnimationFrame(function () { card.classList.add("is-open"); });
    card.querySelector(".sigcard__x").addEventListener("click", closeCard);
    setTimeout(function () { document.addEventListener("pointerdown", outside, true); }, 0);
    addEventListener("scroll", closeCard, { once: true, passive: true });
    card.querySelector(".sigcard__btn").focus({ preventScroll: true });
  }
  function outside(e) { if (card && !card.contains(e.target) && !link.contains(e.target)) closeCard(); }
  function closeCard() {
    if (!card) return; var c = card; card = null;
    document.removeEventListener("pointerdown", outside, true);
    c.classList.remove("is-open"); setTimeout(function () { c.remove(); }, 450);
  }
  link.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    held = false; clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { held = true; openCard(); if (navigator.vibrate) navigator.vibrate(8); }, 550);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { link.addEventListener(ev, function () { clearTimeout(holdTimer); }); });
  link.addEventListener("click", function (e) { if (held) { e.preventDefault(); held = false; } });
  link.addEventListener("contextmenu", function (e) { if (held || card) e.preventDefault(); });

  /* ---------- 3 · the hidden end-credits roll ---------- */
  var roll = null;
  function playRoll() {
    if (roll) return;
    closeCard();
    roll = document.createElement("div"); roll.className = "sigroll"; roll.setAttribute("role", "dialog"); roll.setAttribute("aria-label", "Credits");
    roll.innerHTML =
      '<div class="sigroll__crawl">' +
        '<p class="sigroll__eyebrow">VIMUSEMENT 2026</p>' +
        '<p class="sigroll__title">The website</p>' +
        '<img class="sigroll__photo" src="' + PHOTO + '" alt="">' +
        '<p class="sigroll__label">Design &amp; code</p><p class="sigroll__name">Austin Prince Roosewelt</p>' +
        '<p class="sigroll__label">Role</p><p class="sigroll__value">' + ctx.t("credits.hero.role") + '</p>' +
        '<p class="sigroll__label">Built with</p><p class="sigroll__value">Late nights, a lot of chai, and Claude Code</p>' +
        '<p class="sigroll__label">Thanks to</p><p class="sigroll__value">Father, the Victorians Youth committee,<br>and everyone who comes on the 25th</p>' +
        '<div class="sigroll__sign">' + svg.outerHTML.replace('class="footer__sign-name"', 'class="sigroll__svg"') + '</div>' +
        '<p class="sigroll__end">Built, broken, and rebuilt, right up to doomsday.</p>' +
      '</div>';
    document.body.appendChild(roll);
    roll.querySelectorAll('path').forEach(function (p) { p.removeAttribute('style'); });
    requestAnimationFrame(function () { roll.classList.add("is-on"); });
    var done = setTimeout(stopRoll, reduced ? 6000 : 13500);
    roll.addEventListener("click", stopRoll);
    roll._done = done;
  }
  function stopRoll() {
    if (!roll) return; var r = roll; roll = null; clearTimeout(r._done);
    r.classList.remove("is-on"); setTimeout(function () { r.remove(); }, 900);
  }
  var fine = ctx.$(".footer__fine"), taps = [];
  if (fine) fine.addEventListener("click", function () {
    var t = Date.now(); taps = taps.filter(function (x) { return t - x < 2500; }); taps.push(t);
    if (taps.length >= 5) { taps = []; playRoll(); }
  });
  var typed = "";
  addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeCard(); stopRoll(); return; }
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === "austin") { typed = ""; playRoll(); }
  });
});
