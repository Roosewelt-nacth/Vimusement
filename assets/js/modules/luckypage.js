/* ============================================================
   MODULE — luckypage  (draw.html)
   The offline lucky draw showcase: prize cards (the first is the
   grand prize, drawn big) + the ticket-counter stub.
   Data: years/<year>.config.js → luckyDraw.{prizes, prizesNote,
   counter, drawWhen}. Price/blurb/directions come from render.js.
   Must load before motion.js so the cards get their reveal.
   ============================================================ */
Vim.register("luckypage", function (ctx) {
  var box = ctx.$("[data-lucky-prizes]");
  if (!box) return;
  var L = ctx.year.luckyDraw || {};

  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* line drawings, 24×24, stroke = currentColor */
  var ART = {
    sofa:     '<path d="M4.5 11V8.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3V11"/><path d="M2.5 13.2a2 2 0 0 1 4 0V15h11v-1.8a2 2 0 0 1 4 0V17a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z"/><path d="M5.5 19v1.8M18.5 19v1.8M12 5.5V15"/>',
    airfryer: '<rect x="5" y="2.8" width="14" height="18.4" rx="4.2"/><circle cx="12" cy="7.6" r="1.9"/><path d="M8 12.4h8v3.8a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 16.2z"/><path d="M10.8 15h2.4"/>',
    mixer:    '<path d="M8 2.8h8l-1.1 9H9.1z"/><path d="M16 4.6h2v4.2h-2.6"/><path d="M10.6 11.8v2.2h2.8v-2.2"/><rect x="5.8" y="14" width="12.4" height="7.2" rx="2.2"/><circle cx="12" cy="17.6" r="1.4"/>',
    cooker:   '<path d="M4 11.5h16v5.3a4.2 4.2 0 0 1-4.2 4.2H8.2A4.2 4.2 0 0 1 4 16.8z"/><path d="M2.8 11.5h18.4"/><path d="M8.2 11.5V9.6a3.8 3.8 0 0 1 7.6 0v1.9"/><path d="M12 5.8V3.2"/><path d="M20.4 13.3h2.4"/>',
    gift:     '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.2h14V12M12 8v12.2"/><path d="M12 8S10.6 3.6 8.2 4.6C6.5 5.4 7.8 8 12 8zM12 8s1.4-4.4 3.8-3.4c1.7.8.4 3.4-3.8 3.4z"/>'
  };
  function art(key, w) {
    return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ART[key] || ART.gift) + '</svg>';
  }

  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var CHECK = '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.4 3 3 6-6.8"/></svg>';

  var prizes = L.prizes || [];
  var total = prizes.reduce(function (t, p) { return t + (Number(p.worth) || 0); }, 0);

  /* prize sponsors: a prize can name its own (prizes[i].sponsor); any prize
     without one falls back to luckyDraw.prizeSponsor. Each sponsor is credited
     on its prizes' cards, in the strip under the heading, and in a thank-you. */
  var DEF = L.prizeSponsor && L.prizeSponsor.name ? L.prizeSponsor : null;
  function sponsorOf(p) { return p.sponsor && p.sponsor.name ? p.sponsor : DEF; }
  var sponsors = [];                       // in prize order, each once, with the prizes they gave
  prizes.forEach(function (p) {
    var s = sponsorOf(p); if (!s) return;
    var hit = sponsors.filter(function (x) { return x.s.name === s.name; })[0];
    if (hit) hit.prizes.push(p); else sponsors.push({ s: s, prizes: [p] });
  });
  function spMark(sp, cls) {
    if (sp.logo) return '<img class="' + cls + '" src="' + esc(sp.logo) + '" alt="' + esc(sp.name) + '">';
    var initials = sp.name.replace(/&/g, " ").split(/\s+/).filter(function (w) { return /^[A-Za-z]/.test(w); })
      .map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
    return '<span class="' + cls + ' lucky-mono" aria-hidden="true">' + esc(initials) + '</span>';
  }
  function fill(key, sp) { return ctx.t(key).replace(/\{name\}/g, sp ? sp.name : ""); }
  /* "The sofa" / "The air fryer, mixie and cooker" */
  function prizeList(list) {
    var names = list.map(function (p) { return (ctx.L(p.name) || "").toLowerCase(); });
    var joined = names.length < 2 ? names[0] : names.slice(0, -1).join(", ") + " " + ctx.t("lucky.sponsor.and") + " " + names[names.length - 1];
    return ctx.t("lucky.sponsor.the") + joined;
  }

  /* a prize with a photo shows it (like the poster): a gold medal with its
     place top-left and the "Branded" tag bottom-right; otherwise the line icon */
  function ordinal(n) {
    if (ctx.lang === "ta") return n + "";
    var s = ["TH", "ST", "ND", "RD"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function photoHtml(p, i) {
    return '<figure class="lucky-prize__photo">' +
      '<img src="' + esc(p.photo) + '" alt="' + esc(ctx.L(p.name)) + '" loading="' + (i ? "lazy" : "eager") + '" decoding="async">' +
      '<span class="lucky-medal" aria-hidden="true">' + ordinal(i + 1) + '</span>' +
      (L.branded ? '<span class="lucky-chip">' + CHECK + esc(ctx.t("lucky.prize.branded")) + '</span>' : '') +
    '</figure>';
  }

  box.innerHTML = prizes.map(function (p, i) {
    var grand = i === 0;
    var sub = ctx.L(p.sub);
    return '<article class="lucky-prize' + (grand ? ' lucky-prize--grand' : '') + (p.photo ? ' lucky-prize--photo' : '') + '" data-animate="fade-up" data-animate-delay="' + (i * 0.07).toFixed(2) + '">' +
      (p.photo ? photoHtml(p, i) :
        '<span class="lucky-prize__rank" aria-hidden="true">' + String(i + 1).padStart(2, "0") + '</span>' +
        '<div class="lucky-prize__art">' + art(p.icon, grand ? 132 : 64) + '</div>') +
      '<div class="lucky-prize__text">' +
        '<p class="lucky-prize__place">' + esc(grand ? ctx.t("lucky.prize.grand") + " · " + ctx.L(p.place) : ctx.L(p.place)) + '</p>' +
        '<h3 class="lucky-prize__name">' + esc(ctx.L(p.name) || ctx.L(p.detail)) + '</h3>' +
        (sub ? '<p class="lucky-prize__sub">' + esc(sub) + '</p>' : '') +
        '<div class="lucky-prize__meta">' +
          (p.worth ? '<p class="lucky-prize__worth"><span>' + esc(ctx.t("lucky.prize.worth")) + '</span> <b>' + money(p.worth) + '</b></p>' : '') +
          (L.branded && !p.photo ? '<span class="lucky-badge">' + CHECK + esc(ctx.t("lucky.prize.branded")) + '</span>' : '') +
        '</div>' +
        (sponsorOf(p) ? '<p class="lucky-prize__by">' + esc(fill("lucky.sponsor.by", sponsorOf(p))) + '</p>' : '') +
      '</div>' +
    '</article>';
  }).join("");

  var credit = ctx.$("[data-lucky-credit]"), thanks = ctx.$("[data-lucky-thanks]");
  function nameHtml(sp) {
    return sp.url ? '<a href="' + esc(sp.url) + '" target="_blank" rel="noopener">' + esc(sp.name) + '</a>' : '<b>' + esc(sp.name) + '</b>';
  }
  if (sponsors.length && credit) {
    credit.innerHTML = '<span class="lucky-credit__cap">' + esc(ctx.t("lucky.sponsor.strip")) + '</span>' +
      sponsors.map(function (x) { return '<span class="lucky-credit__who">' + spMark(x.s, "lucky-credit__logo") + nameHtml(x.s) + '</span>'; })
        .join('<span class="lucky-credit__sep" aria-hidden="true">·</span>');
    credit.hidden = false;
  }
  if (sponsors.length && thanks) {
    thanks.innerHTML = sponsors.map(function (x) {
      var sp = x.s;
      var text = ctx.t("lucky.sponsor.text")
        .replace(/\{prizes\}/g, prizeList(x.prizes))
        .replace(/\{verb\}/g, ctx.t(x.prizes.length === 1 ? "lucky.sponsor.verb1" : "lucky.sponsor.verbN"))
        .replace(/\{name\}/g, sp.name)
        .replace(/\.\./g, ".");   // a name ending in "." + "." shouldn't make ".."
      return '<aside class="lucky-thanks" data-animate="zoom-in">' +
        '<div class="lucky-thanks__mark">' + spMark(sp, "lucky-thanks__logo") + '</div>' +
        '<div class="lucky-thanks__body">' +
          '<p class="lucky-thanks__eyebrow">' + esc(ctx.t("lucky.sponsor.eyebrow")) + '</p>' +
          '<h3 class="lucky-thanks__title">' + esc(fill("lucky.sponsor.title", sp)) + '</h3>' +
          '<p class="lucky-thanks__text">' + esc(text) + '</p>' +
          '<p class="lucky-thanks__ask">' + esc(ctx.t("lucky.sponsor.ask")) + '</p>' +
          (sp.url ? '<a class="btn btn--pill-ghost" href="' + esc(sp.url) + '" target="_blank" rel="noopener">' + esc(fill("lucky.sponsor.visit", sp)) + ' ↗</a>' : '') +
        '</div></aside>';
    }).join("");
    thanks.hidden = false;
  }

  /* mystery cards — the special surprises aren't named, only teased */
  var nSurprise = Number((L.surprises || {}).count) || 0;
  var sWrap = ctx.$("[data-lucky-surprises]"), sGrid = ctx.$("[data-lucky-surprise-cards]");
  if (sWrap && sGrid && nSurprise) {
    var html = "";
    for (var k = 0; k < nSurprise; k++) {
      html += '<article class="lucky-prize lucky-prize--surprise" data-animate="fade-up" data-animate-delay="' + (k * 0.1).toFixed(2) + '">' +
        '<div class="lucky-prize__art lucky-prize__art--q" aria-hidden="true"><span>?</span></div>' +
        '<div class="lucky-prize__text">' +
          '<p class="lucky-prize__place">' + esc(ctx.t("lucky.surprise.place") + (nSurprise > 1 ? " · " + (k + 1) : "")) + '</p>' +
          '<h3 class="lucky-prize__name">' + esc(ctx.t("lucky.surprise.name")) + '</h3>' +
          '<p class="lucky-prize__sub">' + esc(ctx.t("lucky.surprise.sub")) + '</p>' +
          '<div class="lucky-prize__meta"><span class="lucky-badge lucky-badge--glow">' + esc(ctx.t("lucky.surprise.reveal")) + '</span></div>' +
        '</div>' +
      '</article>';
    }
    sGrid.innerHTML = html;
    sWrap.hidden = false;
  }

  /* "plus more gifts" strip — true = unnamed extras, a number = that many */
  var more = L.moreGifts;
  var moreEl = ctx.$("[data-lucky-more]");
  if (moreEl && more) {
    var mt = ctx.$("[data-lucky-more-title]");
    if (mt) mt.textContent = typeof more === "number" ? ctx.t("lucky.more.titleN").replace("{n}", more) : ctx.t("lucky.more.title");
    moreEl.hidden = false;
  }

  /* headline numbers, worked out from the prize list so they never drift */
  var title = ctx.$("[data-lucky-prizes-title]");
  if (title) title.textContent = ctx.t("lucky.prizes.title").replace("{total}", money(total));
  var stats = ctx.$("[data-lucky-stats]");
  if (stats) {
    var rows = [];
    if (total) rows.push([money(total), ctx.t("lucky.stat.total")]);
    rows.push([String(prizes.length), ctx.t(L.branded ? "lucky.stat.count" : "lucky.prizes.eyebrow")]);
    if (nSurprise) rows.push(["+" + nSurprise, ctx.t("lucky.stat.surprise")]);
    if (typeof more === "number") rows.push(["+" + more, ctx.t("lucky.stat.more")]);   // a bare "+" chip reads oddly, so only once there's a count
    if (L.price) rows.push([money(L.price), ctx.t("lucky.counter.perTicket")]);
    stats.innerHTML = rows.map(function (r) {
      return '<li class="lucky-stat"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>';
    }).join("");
  }

  var note = ctx.$("[data-lucky-prizes-note]");
  if (note) { if (L.prizesNote) note.textContent = ctx.L(L.prizesNote); else note.remove(); }

  var c = L.counter || {};
  ctx.$$("[data-lucky-where]").forEach(function (el) { if (c.where) el.textContent = ctx.L(c.where); });
  ctx.$$("[data-lucky-when]").forEach(function (el) { if (c.when) el.textContent = ctx.L(c.when); });
  ctx.$$("[data-lucky-drawwhen]").forEach(function (el) { if (L.drawWhen) el.textContent = ctx.L(L.drawWhen); });
});
