/* ============================================================
   MODULE — brandpreview  (sponsors.html)
   "See your brand at the fair": a business types its name and sees
   it at once on the entrance arch, a stall canopy and the poster
   board, then sends it to Austin on WhatsApp with the name filled in.
   Markup: <section data-brand-preview></section>
   ============================================================ */
Vim.register("brandpreview", function (ctx) {
  var root = ctx.$("[data-brand-preview]");
  if (!root) return;
  function tt(key, fallback) { var v = ctx.t(key); return v === key ? fallback : v; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var DEF = tt("brand.default", "Your Brand");
  var wa = ((ctx.year.forms || {}).sponsor || "").split("?")[0];

  // little bulbs along a sagging wire
  function bulbs(x1, x2, y, sag, n) {
    var out = "";
    for (var i = 0; i <= n; i++) {
      var t = i / n, x = x1 + (x2 - x1) * t, yy = y + sag * 4 * t * (1 - t);
      out += '<circle class="bp-bulb" style="--d:' + (i % 5) * .4 + 's" cx="' + x.toFixed(1) + '" cy="' + (yy + 4).toFixed(1) + '" r="3.2"/>';
    }
    return '<path class="bp-wire" d="M' + x1 + ' ' + y + ' Q ' + (x1 + x2) / 2 + ' ' + (y + sag * 2) + ' ' + x2 + ' ' + y + '"/>' + out;
  }

  root.innerHTML =
    '<div class="wrap">' +
      '<div class="subsection__intro">' +
        '<p class="eyebrow">' + esc(tt("brand.eyebrow", "See it before you decide")) + '</p>' +
        '<h2 class="section__title">' + esc(tt("brand.title", "Your name, over the gates")) + '</h2>' +
        '<p class="lead">' + esc(tt("brand.lead", "Type your business name and see where it goes on the day.")) + '</p>' +
      '</div>' +
      '<div class="bp">' +
        '<svg class="bp__scene" viewBox="0 0 800 380" role="img" aria-label="' + esc(tt("brand.aria", "Preview of your name on the fair entrance")) + '">' +
          // the grounds behind: a row of stall roofs and the church spire, all in one quiet tone
          '<g class="bp-far">' +
            '<path d="M0 300 L0 262 L40 246 L80 262 L80 300 Z M86 300 L86 258 L128 240 L170 258 L170 300 Z M630 300 L630 258 L672 240 L714 258 L714 300 Z M720 300 L720 262 L760 246 L800 262 L800 300 Z"/>' +
          '</g>' +
          bulbs(0, 800, 40, 16, 26) +
          // the arch: two posts, a curved top, the banner hanging from it
          '<g class="bp-arch">' +
            '<rect x="170" y="96" width="22" height="232" rx="3"/><rect x="608" y="96" width="22" height="232" rx="3"/>' +
            '<path class="bp-arch__top" d="M160 104 Q 400 34 640 104"/>' +
          '</g>' +
          '<g class="bp-banner" data-bp-swing>' +
            '<path class="bp-rope" d="M252 86 V 112 M548 86 V 112"/>' +
            '<rect class="bp-banner__cloth" x="222" y="110" width="356" height="112" rx="6"/>' +
            '<rect class="bp-banner__edge" x="232" y="120" width="336" height="92" rx="3"/>' +
            '<text class="bp-banner__small" x="400" y="146">VIMUSEMENT 2026</text>' +
            '<text class="bp-banner__by" x="400" y="165">' + esc(tt("brand.presented", "presented by")) + '</text>' +
            '<text class="bp-banner__name" x="400" y="200" data-bp-name="arch">' + esc(DEF) + '</text>' +
          '</g>' +
          // a stall canopy, bottom left
          '<g class="bp-stall">' +
            '<path class="bp-stall__roof" d="M6 262 L 38 236 H 154 L 186 262 Z"/>' +
            '<rect class="bp-stall__strip" x="16" y="262" width="160" height="30" rx="2"/>' +
            '<text class="bp-stall__name" x="96" y="283" data-bp-name="stall">' + esc(DEF) + '</text>' +
            '<rect class="bp-stall__leg" x="24" y="292" width="6" height="48"/><rect class="bp-stall__leg" x="162" y="292" width="6" height="48"/>' +
            '<rect class="bp-stall__table" x="16" y="318" width="160" height="22" rx="2"/>' +
          '</g>' +
          // the poster board, bottom right
          '<g class="bp-board">' +
            '<rect class="bp-board__leg" x="632" y="330" width="5" height="28" transform="rotate(-6 634 330)"/><rect class="bp-board__leg" x="716" y="330" width="5" height="28" transform="rotate(6 718 330)"/>' +
            '<rect class="bp-board__panel" x="612" y="214" width="128" height="120" rx="4"/>' +
            '<text class="bp-board__small" x="676" y="244">LUCKY DRAW</text>' +
            '<text class="bp-board__title" x="676" y="272">₹25,000</text>' +
            '<line class="bp-board__rule" x1="636" y1="288" x2="716" y2="288"/>' +
            '<text class="bp-board__by" x="676" y="304">' + esc(tt("brand.poster", "Sponsored by")) + '</text>' +
            '<text class="bp-board__name" x="676" y="322" data-bp-name="board">' + esc(DEF) + '</text>' +
          '</g>' +
          '<rect class="bp-ground" x="0" y="340" width="800" height="40"/>' +
        '</svg>' +
        '<form class="bp__form" data-bp-form>' +
          '<label class="visually-hidden" for="bp-input">' + esc(tt("brand.placeholder", "Your business name")) + '</label>' +
          '<input id="bp-input" class="bp__input" type="text" maxlength="32" autocomplete="organization" placeholder="' + esc(tt("brand.placeholder", "Your business name")) + '" data-bp-input>' +
          (wa ? '<a class="btn btn--gold bp__send" data-bp-send target="_blank" rel="noopener" href="' + esc(wa) + '">' + esc(tt("brand.send", "Send this to Austin")) + '</a>' : '') +
        '</form>' +
      '</div>' +
    '</div>';

  var input = ctx.$("[data-bp-input]", root), send = ctx.$("[data-bp-send]", root);
  var names = ctx.$$("[data-bp-name]", root);
  var MAXW = { arch: 316, stall: 146, board: 112 }, SIZE = { arch: 34, stall: 17, board: 14 };

  function fit(el) {                                            // shrink long names to fit their sign
    var k = el.getAttribute("data-bp-name"), fs = SIZE[k];
    el.style.fontSize = fs + "px";
    try {
      var w = el.getComputedTextLength();
      if (w > MAXW[k]) el.style.fontSize = Math.max(8, fs * MAXW[k] / w).toFixed(1) + "px";
    } catch (e) {}
  }
  function update(swing) {
    var v = (input.value || "").trim() || DEF;
    names.forEach(function (el) { el.textContent = v; fit(el); });
    if (send) {
      var msg = tt("brand.msg", "Hi Austin, I'm from {name}. I saw our name on the Vimusement banner preview and I'd like to talk about sponsoring.")
        .replace("{name}", (input.value || "").trim() || "a local business");
      send.href = wa + "?text=" + encodeURIComponent(msg);
    }
    if (swing && !ctx.reducedMotion) {
      var b = ctx.$("[data-bp-swing]", root);
      b.classList.remove("is-swing"); void b.getBoundingClientRect(); b.classList.add("is-swing");
    }
  }
  var t;
  input.addEventListener("input", function () { update(false); clearTimeout(t); t = setTimeout(function () { update(true); }, 350); });
  ctx.$("[data-bp-form]", root).addEventListener("submit", function (e) { e.preventDefault(); update(true); });
  update(false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { update(false); });
});
