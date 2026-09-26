/* ============================================================
   MODULE — pledge
   The 2026 pledge: everything raised, after event costs, is split
   between three funds (40 · 30 · 30), announced up front.

   Data:   VIM_YEAR.causes[]  ->  { key, share, color, title, short, text, stat }
   Markup: <div data-pledge="full">     split bar + one column per fund
           <div data-pledge="bar">      compact split bar + legend
   Every variant links to the live ledger on cause.html#ledger.
   ============================================================ */
Vim.register("pledge", function (ctx) {
  var els = ctx.$$("[data-pledge]");
  if (!els.length) return;

  var funds = (ctx.year.causes || []).filter(function (c) { return c.share != null; });
  if (!funds.length) { els.forEach(function (el) { el.hidden = true; }); return; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  var ICONS = window.VIM_ICONS || {};
  /* a stale cached strings.js must never leak a raw key onto the page */
  function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
  var ledgerHref = /cause\.html$/.test(location.pathname) ? "#ledger" : "cause.html#ledger";

  function bar() {
    return '<div class="pledge-bar" role="img" aria-label="' +
             esc(funds.map(function (f) { return f.share + "% " + ctx.L(f.title); }).join(", ")) + '">' +
           funds.map(function (f, i) {
             return '<span class="pledge-bar__seg" style="--fund:' + esc(f.color) + ";flex:" + f.share + ";--i:" + i + '">' +
                      "<b>" + esc(f.share) + "%</b><i>" + esc(ctx.L(f.short || f.title)) + "</i></span>";
           }).join("") + "</div>";
  }

  var render = {
    full: function () {
      return bar() +
        '<div class="pledge-funds">' + funds.map(function (f) {
          return '<article class="pledge-fund" style="--fund:' + esc(f.color) + '" data-animate="fade-up">' +
                   '<div class="pledge-fund__top"><span class="pledge-fund__pct">' + esc(f.share) + '<small>%</small></span>' +
                   '<span class="pledge-fund__icon">' + (ICONS[f.icon] || "") + "</span></div>" +
                   "<h3>" + esc(ctx.L(f.title)) + "</h3>" +
                   "<p>" + esc(ctx.L(f.text)) + "</p>" +
                   (f.stat ? '<p class="pledge-fund__stat">' + esc(ctx.L(f.stat)) + "</p>" : "") +
                 "</article>";
        }).join("") + "</div>";
    },
    bar: function () {
      return bar() + '<a class="pledge-mini__link" href="' + ledgerHref + '">' + esc(tt("pledge.ledgerCta", "See the public ledger →")) + "</a>";
    }
  };

  els.forEach(function (el) {
    var kind = el.getAttribute("data-pledge");
    if (!render[kind]) return;
    el.innerHTML = render[kind]();
    el.classList.add("pledge", "pledge--" + kind);
  });

  /* grow the bar when it scrolls into view */
  function reveal(el) { el.classList.add("is-in"); }
  if (ctx.reducedMotion || !("IntersectionObserver" in window)) {
    els.forEach(reveal);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) reveal(el);   // already on screen: no need to wait
      else io.observe(el);
    });
    /* safety net: never leave the split bar empty if the observer doesn't fire */
    setTimeout(function () { els.forEach(reveal); }, 6000);
  }
});
