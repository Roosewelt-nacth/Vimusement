/* ============================================================
   MODULE — rupee  ("Follow a rupee", cause.html)
   The pledge told as a tiny scroll story, no reading needed:
   a gold coin drops in, splits 40 · 30 · 30, and each share pours
   into its own jar. Scrolling drives it (and scrolling back rewinds
   it); the amount chips re-run it for ₹500, ₹1,000 or ₹5,000.
   Markup: <section data-rupee></section>. Funds: VIM_YEAR.causes[].
   ============================================================ */
Vim.register("rupee", function (ctx) {
  var root = ctx.$("[data-rupee]");
  if (!root) return;
  var funds = (ctx.year.causes || []).filter(function (c) { return c.share != null; });
  if (funds.length !== 3) { root.hidden = true; return; }

  function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  var AMOUNTS = [100, 500, 1000, 5000], amount = 100;

  /* ---------- the scene ---------- */
  var JX = [120, 300, 480], JY = 168, JW = 104, JH = 100;   // jar centres, jar top, size
  var SPLIT = { x: 300, y: 84 };
  function jar(i, f) {
    var x = JX[i] - JW / 2;
    return '<g class="rupee-jar" style="--fund:' + esc(f.color) + '">' +
      '<clipPath id="rj' + i + '"><rect x="' + (x + 3) + '" y="' + (JY + 3) + '" width="' + (JW - 6) + '" height="' + (JH - 6) + '" rx="16"/></clipPath>' +
      '<g clip-path="url(#rj' + i + ')"><path class="rupee-jar__fill" data-fill="' + i + '" d="M' + (x - 40) + ' 0 q 24 -7 48 0 t 48 0 t 48 0 t 48 0 t 48 0 V ' + (JH + 20) + ' H ' + (x - 40) + ' Z"/></g>' +
      '<rect class="rupee-jar__glass" x="' + x + '" y="' + JY + '" width="' + JW + '" height="' + JH + '" rx="19"/>' +
      '<rect class="rupee-jar__lip" x="' + (x + 14) + '" y="' + (JY - 9) + '" width="' + (JW - 28) + '" height="9" rx="4"/>' +
      '<text class="rupee-jar__pct" x="' + JX[i] + '" y="' + (JY + JH / 2 + 9) + '">' + f.share + '%</text>' +
      '<text class="rupee-jar__amt" data-amt="' + i + '" x="' + JX[i] + '" y="' + (JY + JH + 34) + '">₹0</text>' +
      '<text class="rupee-jar__name" x="' + JX[i] + '" y="' + (JY + JH + 56) + '">' + esc(ctx.L(f.short || f.title)) + '</text>' +
    '</g>';
  }
  function route(i) {                                            // splitter to jar mouth
    var ex = JX[i], ey = JY - 14;
    return "M" + SPLIT.x + " " + SPLIT.y + " C " + SPLIT.x + " " + (SPLIT.y + 46) + " " + ex + " " + (ey - 56) + " " + ex + " " + ey;
  }
  root.innerHTML =
    '<div class="rupee__track"><div class="rupee__stage"><div class="wrap">' +
      '<p class="eyebrow">' + esc(tt("rupee.eyebrow", "Follow a rupee")) + '</p>' +
      '<h2 class="section__title rupee__title" data-rupee-title></h2>' +
      '<p class="rupee__cap" aria-live="polite" data-rupee-cap></p>' +
      '<svg class="rupee__svg" viewBox="40 22 520 318" role="img" aria-label="' + esc(funds.map(function (f) { return f.share + '% ' + ctx.L(f.title); }).join(', ')) + '" data-rupee-svg>' +
        funds.map(function (f, i) { return '<path class="rupee-route" style="--fund:' + esc(f.color) + '" data-route="' + i + '" d="' + route(i) + '"/>'; }).join("") +
        funds.map(function (f, i) { return jar(i, f); }).join("") +
        funds.map(function (f, i) {
          return '<g class="rupee-bit" data-bit="' + i + '" style="--fund:' + esc(f.color) + '"><circle r="16"/><text y="5">' + f.share + '</text></g>';
        }).join("") +
        '<g class="rupee-coin" data-coin><circle class="rupee-coin__rim" r="30"/><circle class="rupee-coin__face" r="25"/>' +
          '<text class="rupee-coin__val" y="6" data-coin-val>₹100</text></g>' +
      '</svg>' +
      '<div class="rupee__try"><span>' + esc(tt("rupee.try", "Try another amount")) + '</span>' +
        AMOUNTS.map(function (a) { return '<button type="button" class="rupee__chip" data-amt-chip="' + a + '" aria-pressed="' + (a === amount) + '">' + inr(a) + '</button>'; }).join("") +
      '</div>' +
      '<p class="rupee__hint" aria-hidden="true">' + esc(tt("rupee.hint", "Scroll to follow it")) + '</p>' +
    '</div></div></div>';

  var svg = ctx.$("[data-rupee-svg]", root), coin = ctx.$("[data-coin]", root);
  var coinVal = ctx.$("[data-coin-val]", root), title = ctx.$("[data-rupee-title]", root), cap = ctx.$("[data-rupee-cap]", root);
  var bits = ctx.$$("[data-bit]", root), routes = ctx.$$("[data-route]", root);
  var fills = ctx.$$("[data-fill]", root), amts = ctx.$$("[data-amt]", root);
  var lens = routes.map(function (r) { return r.getTotalLength(); });
  var track = ctx.$(".rupee__track", root);

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function fill(s, a) { return s.replace(/\{amt\}/g, inr(a)); }

  var capStep = -1;
  function captions(p) {
    var step = p < .3 ? 0 : p < .62 ? 1 : 2;
    if (step === capStep) return; capStep = step;
    var keys = [["rupee.s1", "Someone gives {amt} at the fair."],
                ["rupee.s2", "After event costs, it splits three ways, just as promised."],
                ["rupee.s3", "Each share lands in its fund, and on the public ledger."]];
    cap.classList.remove("is-in"); void cap.offsetWidth;
    cap.textContent = fill(tt(keys[step][0], keys[step][1]), amount);
    cap.classList.add("is-in");
  }

  /* p: 0 → 1 over the whole story */
  function draw(p) {
    // 1 · the coin drops in and lands on the splitter
    var d = ease(seg(p, .02, .26));
    var cy = 26 + (SPLIT.y - 26) * d;                            // stays inside the frame: fades in at the top, settles on the fork
    var pop = seg(p, .30, .38);                                  // 2 · it breaks into three
    coin.setAttribute("transform", "translate(" + SPLIT.x + " " + cy.toFixed(1) + ") scale(" + ((.7 + .3 * seg(p, 0, .12)) * (1 - pop * .7)).toFixed(3) + ")");
    coin.style.opacity = (seg(p, 0, .1) * (1 - pop)).toFixed(3);
    // 3 · the three shares travel their routes into the jars
    bits.forEach(function (b, i) {
      var t = ease(seg(p, .34 + i * .03, .64 + i * .03));
      var pt = routes[i].getPointAtLength(lens[i] * t);
      var land = seg(p, .62 + i * .03, .68 + i * .03);
      b.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + (pt.y + land * 18).toFixed(1) + ") scale(" + (1 - land * .6).toFixed(3) + ")");
      b.style.opacity = (pop > 0 ? 1 - land : 0).toFixed(3);
      routes[i].style.strokeDasharray = lens[i] + " " + lens[i];
      routes[i].style.strokeDashoffset = (lens[i] * (1 - t)).toFixed(1);
      // 4 · the jar fills to its share, the amount counts up
      var f = ease(seg(p, .64 + i * .03, .9 + i * .02));
      var level = JH * (funds[i].share / 50) * .9 * f;            // 40% nearly full, 30% three-quarters
      fills[i].setAttribute("transform", "translate(0 " + (JY + JH - level).toFixed(1) + ")");
      amts[i].textContent = inr(amount * funds[i].share / 100 * f);
      amts[i].classList.toggle("is-on", f > .02);
    });
    svg.classList.toggle("is-done", p > .95);
    captions(p);
  }

  var last = -1;
  function progress() {
    var r = track.getBoundingClientRect(), span = r.height - innerHeight;
    return span <= 0 ? 1 : clamp(-r.top / span * 1.08);
  }
  function onScroll() { var p = progress(); if (Math.abs(p - last) > .001) { last = p; draw(p); } }

  function setTitle() { title.textContent = fill(tt("rupee.title", "Where {amt} goes"), amount); coinVal.textContent = inr(amount); }
  setTitle();

  var replay = null;
  function play() {                                              // chips: run the whole story once, in place
    if (ctx.reducedMotion) { draw(1); return; }
    var t0 = performance.now(), DUR = 2600;
    cancelAnimationFrame(replay);
    (function step(now) {
      var p = Math.min(1, (now - t0) / DUR); draw(p);
      if (p < 1) replay = requestAnimationFrame(step); else last = 1;
    })(t0);
  }
  ctx.$$("[data-amt-chip]", root).forEach(function (b) {
    b.addEventListener("click", function () {
      amount = +b.getAttribute("data-amt-chip");
      ctx.$$("[data-amt-chip]", root).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      setTitle(); capStep = -1; play();
    });
  });

  if (ctx.reducedMotion) { root.classList.add("is-static"); draw(1); return; }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();
});
