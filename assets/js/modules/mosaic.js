/* ============================================================
   MODULE — mosaic  (the community banner reveal, #reveal section)

   Two-stage feature:
   1. DORMANT  — before  year.reveal.opensOn  the section shows a quiet
      placeholder: a faint static "V" and an "opens on <date>" line.
      No scroll animation, no taps.
   2. LIVE     — on/after that date (or year.reveal.live === true, or
      ?reveal=preview in the URL) the section comes alive and:
        - a 14x9 tile grid assembles into the Victorians "V" as the
          section scrolls up the viewport (ambient), and
        - visitors can TAP tiles to place their own, filling the grid
          toward year.reveal.goalTaps. Progress is kept per-browser
          in localStorage until the shared backend counter lands.

   Markup:  <section id="reveal" hidden> ... <div data-mosaic></div>
            <i data-reveal-bar> ... <p data-reveal-count> ...
   ============================================================ */
Vim.register("mosaic", function (ctx) {
  var host = ctx.$("[data-mosaic]");
  if (!host) return;
  var section = host.closest("section") || host;
  var R = (ctx.year && ctx.year.reveal) || {};

  /* ---- stage gate -------------------------------------------------- */
  var previewing = /[?&]reveal=preview(&|$)/.test(location.search);
  var opensAt = R.opensOn ? new Date(R.opensOn).getTime() : NaN;
  var isLive = previewing || R.live === true ||
               (!isNaN(opensAt) && Date.now() >= opensAt);

  section.hidden = false;

  var bar = ctx.$("[data-reveal-bar]");
  var count = ctx.$("[data-reveal-count]");
  var eyebrow = section.querySelector(".eyebrow");

  /* ---- grid ------------------------------------------------------- */
  var MX = 14, MY = 9, N = MX * MY;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  host.style.setProperty("--mx", MX);

  var seed = 20260214;
  function rnd() { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; }
  function isMark(c, r) {
    var rr = r / (MY - 1);
    var lx = rr * (MX / 2 - 1.5) + 0.5;
    var rx = (MX - 1) - rr * (MX / 2 - 1.5) - 0.5;
    return Math.abs(c - lx) < 1.15 || Math.abs(c - rx) < 1.15;
  }

  var tiles = [], marks = [], field = [];
  for (var i = 0; i < N; i++) {
    var c = i % MX, r = (i / MX) | 0, mk = isMark(c, r);
    var t = document.createElement("i");
    t.className = "mosaic__t" + (mk ? " is-mark" : "");
    host.appendChild(t);
    tiles.push(t);
    (mk ? marks : field).push(i);
  }
  function shuffle(a) {
    for (var j = a.length - 1; j > 0; j--) {
      var k = (rnd() * (j + 1)) | 0, tmp = a[j]; a[j] = a[k]; a[k] = tmp;
    }
  }
  shuffle(marks); shuffle(field);

  /* ---- DORMANT placeholder -------------------------------------- */
  if (!isLive) {
    host.classList.add("mosaic--dormant");
    host.setAttribute("aria-hidden", "true");
    marks.forEach(function (idx) { tiles[idx].classList.add("is-on"); });
    if (eyebrow) eyebrow.textContent = "Coming this year";
    if (bar) { bar.setAttribute("data-progress", 0); bar.style.width = "0%"; }
    if (count) {
      var when = !isNaN(opensAt)
        ? new Date(R.opensOn).toLocaleDateString("en-IN", { day: "numeric", month: "long" })
        : "";
      count.textContent = when ? "The grid opens on " + when : "Opens closer to the night.";
    }
    return;
  }
  host.classList.add("mosaic--live");

  /* ---- ambient scroll assembly (mark resolves by ~0.8) ----------- */
  var scrollShown = -1;
  function revealN(list, count) {
    for (var i = 0; i < list.length; i++) list[i].on = i < count;
  }
  // wrap each index into a small object so scroll + taps share state
  var mNodes = marks.map(function (idx) { return { el: tiles[idx], on: false }; });
  var fNodes = field.map(function (idx) { return { el: tiles[idx], on: false }; });
  function paint() {
    mNodes.forEach(function (n) { n.el.classList.toggle("is-on", n.on || n.tapped); });
    fNodes.forEach(function (n) { n.el.classList.toggle("is-on", n.on || n.tapped); });
  }
  function applyScroll(p) {
    p = Math.max(0, Math.min(1, p));
    var mShow = Math.round(mNodes.length * Math.min(1, p / 0.8));
    var fShow = Math.round(fNodes.length * 0.4 * p);
    var key = mShow * 1000 + fShow;
    if (key === scrollShown) return;
    scrollShown = key;
    revealN(mNodes, mShow);
    revealN(fNodes, fShow);
    paint();
  }

  if (reduce) {
    applyScroll(1);
  } else {
    (function () {
      function onScroll() {
        var rect = section.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        applyScroll((vh - rect.top) / (vh * 0.9));
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      onScroll();
    })();
  }

  /* ---- tap to place a tile -------------------------------------- */
  var GOAL = R.goalTaps || 500;
  var STORE = "vim-reveal-taps-" + (ctx.year && ctx.year.year || "x");
  var placed = 0;
  try { placed = Math.max(0, parseInt(localStorage.getItem(STORE), 10) || 0); } catch (e) {}

  var order = mNodes.concat(fNodes);      // marks first — taps sharpen the "V"
  function render() {
    // tiles fill in proportion to progress toward the goal, so the grid
    // completes exactly when the community hits goalTaps
    var lit = Math.round(order.length * Math.min(1, placed / GOAL));
    for (var i = 0; i < order.length; i++) order[i].tapped = i < lit;
    paint();
    var pct = Math.max(0, Math.min(100, Math.round(placed / GOAL * 100)));
    if (bar) bar.setAttribute("data-progress", pct);
    if (bar) bar.style.width = pct + "%";
    if (count) {
      count.textContent = placed >= GOAL
        ? "The grid is full. See it on the grounds on the night."
        : placed
          ? placed.toLocaleString("en-IN") + " of " + GOAL.toLocaleString("en-IN") + " tiles placed"
          : "Tap a tile to add yours.";
    }
    section.classList.toggle("is-complete", placed >= GOAL);
  }

  function place() {
    if (placed >= order.length) return;
    placed++;
    try { localStorage.setItem(STORE, String(placed)); } catch (e) {}
    render();
  }

  host.addEventListener("click", function (e) {
    if (e.target === host) return;         // clicked the gap, not a tile
    place();
  });
  host.setAttribute("role", "button");
  host.setAttribute("tabindex", "0");
  host.setAttribute("aria-label", "Place a tile on the community banner");
  host.removeAttribute("aria-hidden");
  host.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(); }
  });

  render();
});
