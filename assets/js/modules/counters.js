/* ============================================================
   MODULE — counters + progress bars
   Number count-up:   <span data-count-to="1200" data-count-prefix="₹"></span>
   Progress fill:      <i class="progress__fill" data-progress="62"></i>
   Both animate once when scrolled into view.
   ============================================================ */
Vim.register("counters", function (ctx) {
  var nums = ctx.$$("[data-count-to]");
  var bars = ctx.$$("[data-progress]");
  if (!nums.length && !bars.length) return;

  function animateNum(el) {
    var end = parseFloat(el.getAttribute("data-count-to")) || 0;
    var pre = el.getAttribute("data-count-prefix") || "";
    var suf = el.getAttribute("data-count-suffix") || "";
    var dur = 1100;
    if (ctx.reducedMotion) { el.textContent = pre + end.toLocaleString("en-IN") + suf; return; }
    var t0;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(end * eased).toLocaleString("en-IN") + suf;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function fillBar(el) {
    var pct = Math.max(0, Math.min(100, parseFloat(el.getAttribute("data-progress")) || 0));
    requestAnimationFrame(function () { el.style.width = pct + "%"; });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      if (en.target.hasAttribute("data-count-to")) animateNum(en.target);
      else fillBar(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.4 });

  nums.concat(bars).forEach(function (el) { io.observe(el); });
});
