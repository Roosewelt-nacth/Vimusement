/* ============================================================
   MODULE — herofx
   Ambient particle field behind the hero, drifting and pulsing on
   its own — no pointer/tilt tracking (that "interactive" parallax
   read as broken on mobile, where device-tilt either needs an iOS
   permission prompt we never asked for, or just jittered the
   lights around unhelpfully). ~2KB, pauses when the hero scrolls
   out of view, goes static under prefers-reduced-motion.

   Two looks, same engine: the default is soft warm fairground
   bokeh; under this year's Doomsday theme (see tokens.css) it
   switches to sharper emerald/gold/wine embers rising off the
   bottom of the hero, like sparks off a dying fire — smaller,
   brighter, faster-flickering, and drifting up instead of just
   floating. Swap is read once at boot from the same
   [data-year-theme] attribute the palette itself uses, so both
   revert together next year.

   Markup:  <canvas class="hero__fx" data-hero-fx></canvas>
            (inside .hero, behind .hero .wrap)
   ============================================================ */
Vim.register("herofx", function (ctx) {
  var cv = ctx.$("[data-hero-fx]");
  if (!cv) return;
  var host = cv.parentElement;
  var g = cv.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doomsday = document.documentElement.getAttribute("data-year-theme") === "doomsday";

  var COLS = doomsday
    ? [
        [47, 190, 125],   // emerald spark
        [201, 150, 46],   // gold ember
        [122, 35, 51]     // deep wine cinder
      ]
    : [
        [231, 184, 92],   // gold
        [228, 138, 160],  // rose
        [246, 237, 225]   // cream
      ];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, lights = [], raf = 0, running = false;

  function size() {
    w = host.clientWidth; h = host.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + "px"; cv.style.height = h + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    if (doomsday) {
      var ne = Math.round(Math.min(42, Math.max(16, w * h / 28000)));
      lights = [];
      for (var j = 0; j < ne; j++) {
        var flare = Math.random() < 0.18;
        lights.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (flare ? 9 : 3) + Math.random() * (flare ? 13 : 6),
          c: COLS[(Math.random() * 3) | 0],
          a: 0.35 + Math.random() * 0.35,
          vx: (Math.random() - 0.5) * 0.1,
          vy: -(0.05 + Math.random() * 0.2),        // embers rise
          ph: Math.random() * 6.28,
          ps: 0.02 + Math.random() * 0.05             // faster flicker than a slow pulse
        });
      }
      return;
    }
    var n = Math.round(Math.min(70, Math.max(28, w * h / 16000)));
    lights = [];
    for (var i = 0; i < n; i++) {
      var big = Math.random() < 0.22;
      lights.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (big ? 34 : 10) + Math.random() * (big ? 34 : 26),
        c: COLS[(Math.random() * 3) | 0],
        a: 0.05 + Math.random() * 0.16,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.13 - 0.04,
        ph: Math.random() * 6.28,
        ps: 0.004 + Math.random() * 0.01
      });
    }
  }

  function paint(t) {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";
    for (var i = 0; i < lights.length; i++) {
      var L = lights[i];
      var pulse = 0.72 + Math.sin(L.ph + t * L.ps) * 0.28;
      var x = L.x, y = L.y;
      var grd = g.createRadialGradient(x, y, 0, x, y, L.r);
      var c = L.c, al = L.a * pulse;
      grd.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + al + ")");
      grd.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, L.r, 0, 6.2832); g.fill();
    }
    g.globalCompositeOperation = "source-over";
  }

  function step(now) {
    for (var i = 0; i < lights.length; i++) {
      var L = lights[i];
      L.x += L.vx; L.y += L.vy;
      if (L.x < -80) L.x = w + 80; else if (L.x > w + 80) L.x = -80;
      if (L.y < -80) L.y = h + 80; else if (L.y > h + 80) L.y = -80;
    }
    paint(now);
    if (running) raf = requestAnimationFrame(step);
  }

  function start() { if (running || reduce) return; running = true; raf = requestAnimationFrame(step); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  window.addEventListener("resize", function () { size(); build(); if (reduce) paint(0); }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  size(); build();
  if (reduce) { paint(0); return; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(host);
  } else {
    start();
  }
});
